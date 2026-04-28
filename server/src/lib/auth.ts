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

	const ok = await Bun.password.verify(password, row.password_hash);
	if (!ok) return { kind: "wrong_password" };
	return { kind: "login", user };
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
// On HTTPS the web and API may live on different subdomains under a public
// suffix (teacher.up.railway.app vs teacher-api.up.railway.app are
// cross-site for cookie purposes). SameSite=None+Secure lets the cookie
// ride along; Lax breaks login. Lax is fine on plain-HTTP localhost.
const COOKIE_SAMESITE =
	process.env.SESSION_COOKIE_SAMESITE ||
	(COOKIE_SECURE ? "None" : "Lax");

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
