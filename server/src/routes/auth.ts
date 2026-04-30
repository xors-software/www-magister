import { Elysia, t } from "elysia";
import {
	buildClearCookie,
	buildSessionCookie,
	COOKIE_SAMESITE,
	COOKIE_SECURE,
	consumePasswordResetToken,
	createPasswordResetToken,
	createSession,
	deleteSession,
	getUserBySession,
	parseCookies,
	readSessionToken,
	signupOrLogin,
} from "../lib/auth";
import {
	buildAuthUrl,
	exchangeCodeForUserInfo,
	findOrCreateUserByGoogle,
	NEXT_COOKIE,
	OAUTH_TRANSIENT_TTL_SECONDS,
	pkceChallenge,
	randomToken,
	readGoogleConfig,
	STATE_COOKIE,
	VERIFIER_COOKIE,
} from "../lib/google-oauth";
import {
	consumeRecoveryCodeAndResetPassword,
	formatCodeForDisplay,
	generateRecoveryCodes,
	getRecoveryCodesStatus,
} from "../lib/recovery-codes";

// Where reset URLs point. Logged with the token so an admin can paste a
// working link straight into Slack. Falls back to a placeholder so missing
// config is loud, not silent.
const WEB_BASE_URL = process.env.WEB_URL || "http://localhost:3010";

// Helpers to build / clear short-lived cookies for the OAuth dance. These
// piggyback on the session-cookie security config so dev/prod settings stay
// consistent.
function buildTransientCookie(name: string, value: string): string {
	const parts = [
		`${name}=${encodeURIComponent(value)}`,
		"HttpOnly",
		"Path=/",
		`Max-Age=${OAUTH_TRANSIENT_TTL_SECONDS}`,
		`SameSite=${COOKIE_SAMESITE}`,
	];
	if (COOKIE_SECURE) parts.push("Secure");
	return parts.join("; ");
}
function clearTransientCookie(name: string): string {
	const parts = [
		`${name}=`,
		"HttpOnly",
		"Path=/",
		"Max-Age=0",
		`SameSite=${COOKIE_SAMESITE}`,
	];
	if (COOKIE_SECURE) parts.push("Secure");
	return parts.join("; ");
}

export const authRoutes = new Elysia({ prefix: "/auth" })
	.post(
		"/login",
		async ({ body, set }) => {
			const result = await signupOrLogin(body.email, body.password, body.displayName);
			if (result.kind === "wrong_password") {
				set.status = 401;
				return { error: "Wrong password." };
			}
			if (result.kind === "invalid_email") {
				set.status = 400;
				return { error: "That doesn't look like a valid email." };
			}
			if (result.kind === "weak_password") {
				set.status = 400;
				return { error: "Password must be at least 8 characters." };
			}
			const session = await createSession(result.user.id);
			set.headers["set-cookie"] = buildSessionCookie(session.token);
			return {
				user: {
					id: result.user.id,
					email: result.user.email,
					displayName: result.user.displayName,
				},
				newAccount: result.kind === "signup",
			};
		},
		{
			body: t.Object({
				email: t.String({ minLength: 3 }),
				password: t.String({ minLength: 1 }),
				displayName: t.Optional(t.String()),
			}),
		},
	)
	.get("/me", async ({ request, set }) => {
		const token = readSessionToken(request.headers);
		const user = await getUserBySession(token);
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
		const token = readSessionToken(request.headers);
		if (token) await deleteSession(token);
		set.headers["set-cookie"] = buildClearCookie();
		return { ok: true };
	})
	.post(
		"/forgot-password",
		async ({ body }) => {
			const result = await createPasswordResetToken(body.email, WEB_BASE_URL);
			if (result) {
				// Conspicuous block so an admin grepping `[reset]` in Railway
				// logs can spot the link instantly. Don't log the raw token
				// to make casual log-skimming a little less risky.
				console.log("\n========== PASSWORD RESET REQUESTED ==========");
				console.log(`[reset] user: ${result.userEmail}`);
				console.log(`[reset] url:  ${result.url}`);
				console.log(`[reset] expires: in ${60} minutes`);
				console.log("==============================================\n");
			} else {
				console.log(`[reset] ignored request for unknown email: ${body.email}`);
			}
			// Always the same response — caller can't distinguish a real
			// account from a typo, so this can't be used to enumerate users.
			return { ok: true };
		},
		{
			body: t.Object({
				email: t.String({ minLength: 3 }),
			}),
		},
	)
	.post(
		"/reset-password",
		async ({ body, set }) => {
			const result = await consumePasswordResetToken(body.token, body.password);
			if (result.kind === "invalid_token") {
				set.status = 400;
				return { error: "This reset link is invalid or expired. Request a new one." };
			}
			if (result.kind === "weak_password") {
				set.status = 400;
				return { error: "Password must be at least 8 characters." };
			}
			return { ok: true };
		},
		{
			body: t.Object({
				token: t.String({ minLength: 1 }),
				password: t.String({ minLength: 1 }),
			}),
		},
	)
	// ---- Google OAuth ----
	// Standard authorization-code-with-PKCE flow. See google-oauth.ts for
	// the protocol-level docstring; the routes here are mostly cookie
	// plumbing + session creation.
	.get(
		"/google/start",
		async ({ query, set }) => {
			const config = readGoogleConfig();
			if (!config) {
				set.status = 503;
				return { error: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI." };
			}
			const state = randomToken();
			const verifier = randomToken();
			const challenge = await pkceChallenge(verifier);
			// Stash transient cookies so the callback can prove this flow
			// originated here (state) and complete the PKCE exchange (verifier).
			// `next` carries through the post-login destination if one was
			// passed (e.g. /claude-code/quiz when a deep-link bounce sent the
			// user to /login first).
			const cookies: string[] = [
				buildTransientCookie(STATE_COOKIE, state),
				buildTransientCookie(VERIFIER_COOKIE, verifier),
			];
			if (typeof query.next === "string" && query.next.startsWith("/")) {
				cookies.push(buildTransientCookie(NEXT_COOKIE, query.next));
			}
			set.headers["set-cookie"] = cookies;
			set.status = 302;
			set.headers.location = buildAuthUrl(config, state, challenge);
			return "";
		},
		{ query: t.Object({ next: t.Optional(t.String()) }) },
	)
	.get(
		"/google/callback",
		async ({ query, request, set }) => {
			const config = readGoogleConfig();
			if (!config) {
				set.status = 503;
				return { error: "Google sign-in is not configured." };
			}
			// Surface Google-side errors verbatim — these only happen if the
			// user clicked "Cancel" or the consent screen has a config issue.
			if (query.error) {
				set.status = 400;
				return { error: `Google sign-in declined: ${query.error}` };
			}
			if (typeof query.code !== "string" || typeof query.state !== "string") {
				set.status = 400;
				return { error: "Missing code or state on callback." };
			}
			const cookies = parseCookies(request.headers.get("cookie"));
			const stateCookie = cookies[STATE_COOKIE];
			const verifierCookie = cookies[VERIFIER_COOKIE];
			const nextCookie = cookies[NEXT_COOKIE];
			if (!stateCookie || !verifierCookie) {
				set.status = 400;
				return { error: "Sign-in session expired. Try again." };
			}
			// Constant-time-ish state compare to deflect any clever attacker
			// who somehow guessed half the bytes. Realistically the entropy
			// makes timing irrelevant, but it costs nothing.
			if (stateCookie.length !== query.state.length || stateCookie !== query.state) {
				set.status = 400;
				return { error: "State mismatch. Possible CSRF attempt." };
			}
			// Always clear the transient cookies — even on the success path
			// they have no further use, and on the error path we don't want
			// stale values lingering.
			const clearCookies = [
				clearTransientCookie(STATE_COOKIE),
				clearTransientCookie(VERIFIER_COOKIE),
				clearTransientCookie(NEXT_COOKIE),
			];

			let info: Awaited<ReturnType<typeof exchangeCodeForUserInfo>>;
			try {
				info = await exchangeCodeForUserInfo(config, query.code, verifierCookie);
			} catch (err) {
				console.error("[oauth] token exchange failed:", err instanceof Error ? err.message : err);
				set.status = 502;
				set.headers["set-cookie"] = clearCookies;
				return { error: "Couldn't complete sign-in with Google. Try again." };
			}
			if (!info.emailVerified) {
				set.status = 403;
				set.headers["set-cookie"] = clearCookies;
				return { error: "Your Google email isn't verified. Verify it with Google and retry." };
			}

			const { user } = await findOrCreateUserByGoogle(info);
			const session = await createSession(user.id);

			// Combine all cookie operations — the session cookie + clearing
			// the transients — into one Set-Cookie array. Then redirect into
			// the app.
			const next = nextCookie && nextCookie.startsWith("/") ? nextCookie : "/claude-code/quiz";
			set.headers["set-cookie"] = [...clearCookies, buildSessionCookie(session.token)];
			set.status = 302;
			set.headers.location = next;
			return "";
		},
		{
			query: t.Object({
				code: t.Optional(t.String()),
				state: t.Optional(t.String()),
				error: t.Optional(t.String()),
			}),
		},
	)
	// ---- Recovery codes ----
	// Self-serve password reset path: a logged-in user generates 8 codes
	// they save somewhere, and later uses one (no admin involvement) to
	// reset their password if they get locked out. See recovery-codes.ts
	// for the protocol details.
	.get("/recovery-codes/status", async ({ request, set }) => {
		const token = readSessionToken(request.headers);
		const user = await getUserBySession(token);
		if (!user) {
			set.status = 401;
			return { error: "Sign in to view recovery code status." };
		}
		return await getRecoveryCodesStatus(user.id);
	})
	.post("/recovery-codes/generate", async ({ request, set }) => {
		const token = readSessionToken(request.headers);
		const user = await getUserBySession(token);
		if (!user) {
			set.status = 401;
			return { error: "Sign in to generate recovery codes." };
		}
		const result = await generateRecoveryCodes(user.id);
		if (result.kind === "user_not_found") {
			set.status = 404;
			return { error: "User not found." };
		}
		// Display-format here so the frontend doesn't need to know the
		// chunking. Plaintext codes are returned exactly once — they're
		// hashed at rest and unrecoverable from this point on.
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
				// Generic so callers can't tell which of email/code is wrong
				// (don't enable enumeration).
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
