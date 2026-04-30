// Lightweight auth: email-based identity with HttpOnly cookie session.
//
// MVP design — anyone with an email gets an account on first login. No
// password, no magic link. Suitable for an internal Lazer tool. Add a
// magic-link layer or OAuth before exposing externally.

import { sql } from "./pg";

export interface User {
	id: string;
	email: string;
	displayName: string | null;
	createdAt: string;
}

export interface AuthSession {
	token: string;
	userId: string;
	expiresAt: string;
}

const SESSION_TTL_DAYS = 60;

function generateUserId(): string {
	return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateToken(): string {
	// 32 random bytes hex-encoded; ~256 bits of entropy.
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Result kind tells the caller whether this was a fresh signup (so the UI
// can show a "welcome" message) or an existing-user login.
export type LoginOutcome =
	| { kind: "signup"; user: User }
	| { kind: "login"; user: User }
	| { kind: "wrong_password" }
	| { kind: "invalid_email" }
	| { kind: "weak_password" };

const MIN_PASSWORD_LEN = 8;

// Auto-signup-on-first-login: if email is new, create with this password.
// If email exists with a hash, verify. If email exists without a hash
// (legacy/test rows from the no-password era), accept any password and
// set it as the new permanent hash. Either way, the caller gets a session.
export async function signupOrLogin(
	email: string,
	password: string,
	displayName?: string,
): Promise<LoginOutcome> {
	const cleaned = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
		return { kind: "invalid_email" };
	}
	if (typeof password !== "string" || password.length < MIN_PASSWORD_LEN) {
		return { kind: "weak_password" };
	}

	const existing = await sql<
		{ id: string; email: string; display_name: string | null; created_at: string; password_hash: string | null }[]
	>`
		SELECT id, email, display_name, created_at, password_hash
		FROM users WHERE email = ${cleaned}
	`;

	if (existing.length === 0) {
		// New user — hash and insert.
		const id = generateUserId();
		const hash = await Bun.password.hash(password, { algorithm: "argon2id" });
		const inserted = await sql<
			{ id: string; email: string; display_name: string | null; created_at: string }[]
		>`
			INSERT INTO users (id, email, display_name, password_hash)
			VALUES (${id}, ${cleaned}, ${displayName ?? null}, ${hash})
			RETURNING id, email, display_name, created_at
		`;
		const u = inserted[0];
		return {
			kind: "signup",
			user: { id: u.id, email: u.email, displayName: u.display_name, createdAt: u.created_at },
		};
	}

	const row = existing[0];
	const user: User = {
		id: row.id,
		email: row.email,
		displayName: row.display_name,
		createdAt: row.created_at,
	};

	if (!row.password_hash) {
		// Legacy row from before passwords existed. Accept this attempt and
		// permanently bind the password so subsequent logins must match.
		const hash = await Bun.password.hash(password, { algorithm: "argon2id" });
		await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${row.id}`;
		return { kind: "login", user };
	}

	// Wrap verify so a corrupted/legacy hash returns 401 instead of crashing
	// the request with a 500. We've seen rows where password_hash got mangled
	// (e.g. set to the literal string 'NULL' by a SQL tool quoting bug) —
	// Bun.password.verify throws "UnsupportedAlgorithm" on those.
	let ok = false;
	try {
		ok = await Bun.password.verify(password, row.password_hash);
	} catch (err) {
		console.error(
			`[auth] Bun.password.verify threw for user ${row.id} — treat as wrong password. Hash may be corrupted.`,
			err instanceof Error ? err.message : err,
		);
		return { kind: "wrong_password" };
	}
	if (!ok) return { kind: "wrong_password" };
	return { kind: "login", user };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------
//
// We don't have email infra yet, so the reset URL is logged to stdout. An
// admin watches Railway logs and shares the link out of band (Slack, etc.).
// Tokens are single-use, expire after RESET_TTL_MIN, and invalidate every
// existing session for the user on consumption.

const RESET_TTL_MIN = 60;

export type ResetRequestOutcome =
	// Always returned to the caller regardless of whether the email exists,
	// so /forgot-password can't be used to enumerate users. The actual token
	// (when one was generated) is logged server-side.
	{ kind: "ok" };

export type ResetConsumeOutcome =
	| { kind: "ok"; userId: string }
	| { kind: "invalid_token" }
	| { kind: "weak_password" };

// Returns the URL the admin should share, or null if no user with that email
// exists. The /forgot-password endpoint always responds the same way to the
// caller — only the server log differs.
export async function createPasswordResetToken(
	email: string,
	webBaseUrl: string,
): Promise<{ url: string; userEmail: string } | null> {
	const cleaned = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
	const rows = await sql<{ id: string; email: string }[]>`
		SELECT id, email FROM users WHERE email = ${cleaned}
	`;
	if (rows.length === 0) return null;
	const userId = rows[0].id;
	const token = generateToken();
	const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000).toISOString();
	await sql`
		INSERT INTO password_reset_tokens (token, user_id, expires_at)
		VALUES (${token}, ${userId}, ${expiresAt})
	`;
	const trimmed = webBaseUrl.replace(/\/$/, "");
	const url = `${trimmed}/reset-password?token=${token}`;
	return { url, userEmail: rows[0].email };
}

export async function consumePasswordResetToken(
	token: string,
	newPassword: string,
): Promise<ResetConsumeOutcome> {
	if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LEN) {
		return { kind: "weak_password" };
	}
	if (typeof token !== "string" || token.length === 0) {
		return { kind: "invalid_token" };
	}
	const rows = await sql<{ user_id: string }[]>`
		SELECT user_id FROM password_reset_tokens
		WHERE token = ${token}
		  AND used_at IS NULL
		  AND expires_at > NOW()
	`;
	if (rows.length === 0) return { kind: "invalid_token" };
	const userId = rows[0].user_id;
	const hash = await Bun.password.hash(newPassword, { algorithm: "argon2id" });
	// Atomic-ish: mark token used, set new password, invalidate every session
	// for this user. If anyone else was logged in as this account, they're
	// kicked out — standard post-reset hygiene.
	await sql.begin(async (tx) => {
		await tx`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ${token}`;
		await tx`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
		await tx`DELETE FROM auth_sessions WHERE user_id = ${userId}`;
	});
	return { kind: "ok", userId };
}

export async function createSession(userId: string): Promise<AuthSession> {
	const token = generateToken();
	const expiresAt = new Date(
		Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
	).toISOString();
	await sql`
		INSERT INTO auth_sessions (token, user_id, expires_at)
		VALUES (${token}, ${userId}, ${expiresAt})
	`;
	return { token, userId, expiresAt };
}

export async function deleteSession(token: string): Promise<void> {
	await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
}

export async function getUserBySession(
	token: string | null | undefined,
): Promise<User | null> {
	if (!token) return null;
	const rows = await sql<{ id: string; email: string; display_name: string | null; created_at: string }[]>`
		SELECT u.id, u.email, u.display_name, u.created_at
		FROM auth_sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token = ${token} AND s.expires_at > NOW()
	`;
	if (rows.length === 0) return null;
	const u = rows[0];
	return { id: u.id, email: u.email, displayName: u.display_name, createdAt: u.created_at };
}

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "reps_session";
// Default to Secure cookies — production is the common case. Local dev opts
// out via SESSION_COOKIE_SECURE=false in server/.env (browsers refuse
// `Secure` cookies over plain http://localhost).
const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE !== "false";
// Lax is the secure default: cookies sent on same-site requests, including
// top-level navigations. The web app proxies /api/* through Next.js so all
// authenticated calls are same-origin from the browser's POV — no need for
// SameSite=None (which would otherwise be required to opt into cross-site
// cookies, but is blocked anyway by strict browsers like Safari).
const COOKIE_SAMESITE = process.env.SESSION_COOKIE_SAMESITE || "Lax";

export function buildSessionCookie(token: string): string {
	const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
	const parts = [
		`${COOKIE_NAME}=${token}`,
		"HttpOnly",
		"Path=/",
		`Max-Age=${maxAge}`,
		`SameSite=${COOKIE_SAMESITE}`,
	];
	if (COOKIE_SECURE) parts.push("Secure");
	return parts.join("; ");
}

export function buildClearCookie(): string {
	const parts = [
		`${COOKIE_NAME}=`,
		"HttpOnly",
		"Path=/",
		"Max-Age=0",
		`SameSite=${COOKIE_SAMESITE}`,
	];
	if (COOKIE_SECURE) parts.push("Secure");
	return parts.join("; ");
}

// Parse a Cookie header into a map.
export function parseCookies(header: string | null | undefined): Record<string, string> {
	if (!header) return {};
	const out: Record<string, string> = {};
	for (const piece of header.split(";")) {
		const eq = piece.indexOf("=");
		if (eq === -1) continue;
		const k = piece.slice(0, eq).trim();
		const v = piece.slice(eq + 1).trim();
		if (k) out[k] = decodeURIComponent(v);
	}
	return out;
}

export function readSessionToken(headers: Headers): string | null {
	return parseCookies(headers.get("cookie")) [COOKIE_NAME] || null;
}
