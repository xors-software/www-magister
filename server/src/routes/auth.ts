// Auth routes — dual-auth during migration. Two paths coexist:
//
//   - Local Magister password (legacy): users who predate xors
//     centralization and haven't been manually migrated. Verified
//     against users.password_hash, sets a reps_session cookie.
//   - XORS centralized: api.xors.xyz/api/users/authenticate (or the
//     /oauth Google flow). Sets a xors_session cookie.
//
// /auth/login tries local first, falls back to xors. Local-first means
// existing users keep using their familiar local password without
// accidentally minting an xors account on every typo (xors's
// /api/users/authenticate auto-creates on unseen emails). New users
// fall through to xors and get a fresh account there.
//
// /auth/me + /auth/logout work for both session cookies via
// resolveCurrentUser, which checks xors_session first and falls back
// to reps_session.

import { Elysia, t } from "elysia";
import {
	buildClearCookie,
	buildSessionCookie,
	COOKIE_SAMESITE,
	COOKIE_SECURE,
	createSession,
	deleteSession,
	getUserBySession,
	localPasswordLogin,
	parseCookies,
	readSessionToken,
} from "../lib/auth";
import {
	consumeRecoveryCodeAndResetPassword,
	formatCodeForDisplay,
	generateRecoveryCodes,
	getRecoveryCodesStatus,
} from "../lib/recovery-codes";
import { resolveCurrentUser } from "../lib/xors-identity";

const XORS_API_URL =
	process.env.XORS_API_URL ||
	process.env.NEXT_PUBLIC_XORS_API_URL ||
	"https://api.xors.xyz";
const XORS_AUTH_SOURCE = process.env.XORS_AUTH_SOURCE || "teacher.up.railway.app";
const XORS_SESSION_COOKIE = "xors_session";
// Match the 30-day cookie life set by the Next.js /oauth handler.
const XORS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function buildXorsCookie(sessionKey: string): string {
	const parts = [
		`${XORS_SESSION_COOKIE}=${sessionKey}`,
		"HttpOnly",
		"Path=/",
		`Max-Age=${XORS_COOKIE_MAX_AGE}`,
		`SameSite=${COOKIE_SAMESITE}`,
	];
	if (COOKIE_SECURE) parts.push("Secure");
	return parts.join("; ");
}
function clearXorsCookie(): string {
	const parts = [
		`${XORS_SESSION_COOKIE}=`,
		"HttpOnly",
		"Path=/",
		"Max-Age=0",
		`SameSite=${COOKIE_SAMESITE}`,
	];
	if (COOKIE_SECURE) parts.push("Secure");
	return parts.join("; ");
}

// Try authenticating against api.xors.xyz. Returns the user's session
// key on success, or null on any failure (network, wrong creds, etc.).
async function tryXorsAuthenticate(
	email: string,
	password: string,
): Promise<string | null> {
	try {
		const res = await fetch(`${XORS_API_URL}/api/users/authenticate`, {
			method: "POST",
			headers: { Accept: "application/json", "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, source: XORS_AUTH_SOURCE }),
		});
		if (!res.ok) return null;
		const body = (await res.json()) as { user?: { key?: string } };
		return body.user?.key ?? null;
	} catch (err) {
		console.error(
			"[auth] xors authenticate failed:",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}

export const authRoutes = new Elysia({ prefix: "/auth" })
	.post(
		"/login",
		async ({ body, set }) => {
			// Local-first. Existing Magister users keep working without
			// ever calling xors, so a typo doesn't accidentally mint an
			// xors account with the wrong password.
			const localResult = await localPasswordLogin(body.email, body.password);
			if (localResult.kind === "ok") {
				const session = await createSession(localResult.user.id);
				set.headers["set-cookie"] = buildSessionCookie(session.token);
				return {
					user: {
						id: localResult.user.id,
						email: localResult.user.email,
						displayName: localResult.user.displayName,
					},
					authMethod: "local",
				};
			}
			if (localResult.kind === "invalid_email") {
				set.status = 400;
				return { error: "That doesn't look like a valid email." };
			}
			// `wrong_password` means the email matches a local row but the
			// password is wrong. Don't fall through — xors's /authenticate
			// auto-creates on unseen emails, so a typo on the local
			// password would mint a new xors account with the typo as the
			// password. Local users have to use their actual local
			// password (or recover via /forgot-password).
			if (localResult.kind === "wrong_password") {
				set.status = 401;
				return { error: "Wrong email or password." };
			}
			// `not_found` (no local row, or local row has no password_hash)
			// → fall through to xors. xors will auto-create if needed.
			const xorsKey = await tryXorsAuthenticate(body.email, body.password);
			if (xorsKey) {
				set.headers["set-cookie"] = buildXorsCookie(xorsKey);
				return { authMethod: "xors" };
			}

			set.status = 401;
			return { error: "Wrong email or password." };
		},
		{
			body: t.Object({
				email: t.String({ minLength: 3 }),
				password: t.String({ minLength: 1 }),
			}),
		},
	)
	.get("/me", async ({ request, set }) => {
		const user = await resolveCurrentUser(request.headers);
		if (!user) {
			set.status = 401;
			return { error: "Not authenticated" };
		}
		return {
			user: {
				id: user.id,
				email: user.email,
				displayName: user.displayName,
			},
		};
	})
	.post("/logout", async ({ request, set }) => {
		// Best-effort — clear both cookies regardless of which is set.
		const cookies = parseCookies(request.headers.get("cookie"));
		const repsToken = cookies.reps_session;
		if (repsToken) {
			try {
				await deleteSession(repsToken);
			} catch (err) {
				console.error(
					"[auth] failed to delete reps_session row:",
					err instanceof Error ? err.message : err,
				);
			}
		}
		set.headers["set-cookie"] = [buildClearCookie(), clearXorsCookie()];
		return { ok: true };
	})
	// Recovery codes — local-only. A xors-side user has no local password
	// to reset; if they want password recovery they'll use xors's email
	// flow (or just sign in with Google). Codes are generated and
	// consumed against the local Magister auth path.
	.get("/recovery-codes/status", async ({ request, set }) => {
		const token = readSessionToken(request.headers);
		const user = await getUserBySession(token);
		if (!user) {
			set.status = 401;
			return { error: "Sign in with your Magister password to view recovery code status." };
		}
		return await getRecoveryCodesStatus(user.id);
	})
	.post("/recovery-codes/generate", async ({ request, set }) => {
		const token = readSessionToken(request.headers);
		const user = await getUserBySession(token);
		if (!user) {
			set.status = 401;
			return { error: "Sign in with your Magister password to generate recovery codes." };
		}
		const result = await generateRecoveryCodes(user.id);
		if (result.kind === "user_not_found") {
			set.status = 404;
			return { error: "User not found." };
		}
		return { codes: result.codes.map(formatCodeForDisplay) };
	})
	.post(
		"/recovery-code-reset",
		async ({ body, set }) => {
			const result = await consumeRecoveryCodeAndResetPassword(
				body.email,
				body.code,
				body.password,
			);
			if (result.kind === "weak_password") {
				set.status = 400;
				return { error: "Password must be at least 8 characters." };
			}
			if (result.kind === "invalid") {
				set.status = 400;
				return { error: "That email + code combination didn't match." };
			}
			return { ok: true };
		},
		{
			body: t.Object({
				email: t.String({ minLength: 3 }),
				code: t.String({ minLength: 1 }),
				password: t.String({ minLength: 1 }),
			}),
		},
	);
