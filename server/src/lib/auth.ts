// Local Magister-side auth — runs ALONGSIDE the centralized xors auth
// (lib/xors-identity.ts) during the migration window. Existing users with
// a Magister password keep working via this module; new users go through
// api.xors.xyz. The session resolver in xors-identity.ts checks the xors
// cookie first, then falls back to the reps_session cookie this module
// manages.
//
// Once you've migrated everyone to xors, you can drop this module + its
// schema (auth_sessions, password_hash, recovery_codes_*).

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

function generateToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type LocalLoginOutcome =
	| { kind: "ok"; user: User }
	| { kind: "wrong_password" }
	// `not_found` is returned when no local account exists for this email
	// at all — used by the dual-auth login endpoint to decide whether
	// xors-side auth was already tried and there's genuinely no user, vs.
	// a typo that should be reported as "wrong password".
	| { kind: "not_found" }
	| { kind: "invalid_email" };

// Verify email + password against the local users table. No auto-create;
// new users go through xors. The dual-auth login flow tries xors first
// and only calls this on fall-through, so a `not_found` here means the
// account exists in neither system.
export async function localPasswordLogin(
	email: string,
	password: string,
): Promise<LocalLoginOutcome> {
	const cleaned = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
		return { kind: "invalid_email" };
	}

	const rows = await sql<{
		id: string;
		email: string;
		display_name: string | null;
		created_at: string;
		password_hash: string | null;
	}[]>`
		SELECT id, email, display_name, created_at, password_hash
		FROM users WHERE email = ${cleaned}
	`;
	if (rows.length === 0) return { kind: "not_found" };

	const row = rows[0];
	if (!row.password_hash) return { kind: "not_found" };

	// Wrap verify so a corrupted hash returns wrong_password instead of
	// crashing with UnsupportedAlgorithm — same defense as PR #5.
	let ok = false;
	try {
		ok = await Bun.password.verify(password, row.password_hash);
	} catch (err) {
		console.error(
			`[auth] Bun.password.verify threw for user ${row.id} — treat as wrong password.`,
			err instanceof Error ? err.message : err,
		);
		return { kind: "wrong_password" };
	}
	if (!ok) return { kind: "wrong_password" };

	return {
		kind: "ok",
		user: {
			id: row.id,
			email: row.email,
			displayName: row.display_name,
			createdAt: row.created_at,
		},
	};
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
	const rows = await sql<{
		id: string;
		email: string;
		display_name: string | null;
		created_at: string;
	}[]>`
		SELECT u.id, u.email, u.display_name, u.created_at
		FROM auth_sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token = ${token} AND s.expires_at > NOW()
	`;
	if (rows.length === 0) return null;
	const u = rows[0];
	return {
		id: u.id,
		email: u.email,
		displayName: u.display_name,
		createdAt: u.created_at,
	};
}

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "reps_session";
export const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE !== "false";
// Lax matches the xors_session cookie's setting and the same-origin
// proxy architecture (PR #3). Same-site requests carry the cookie;
// cross-site can't.
export const COOKIE_SAMESITE = process.env.SESSION_COOKIE_SAMESITE || "Lax";

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
	return parseCookies(headers.get("cookie"))[COOKIE_NAME] || null;
}
