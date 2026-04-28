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

export async function getOrCreateUser(
	email: string,
	displayName?: string,
): Promise<User> {
	const cleaned = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
		throw new Error("Invalid email");
	}
	const existing = await sql<{ id: string; email: string; display_name: string | null; created_at: string }[]>`
		SELECT id, email, display_name, created_at FROM users WHERE email = ${cleaned}
	`;
	if (existing.length > 0) {
		const u = existing[0];
		return { id: u.id, email: u.email, displayName: u.display_name, createdAt: u.created_at };
	}
	const id = generateUserId();
	const inserted = await sql<{ id: string; email: string; display_name: string | null; created_at: string }[]>`
		INSERT INTO users (id, email, display_name)
		VALUES (${id}, ${cleaned}, ${displayName ?? null})
		RETURNING id, email, display_name, created_at
	`;
	const u = inserted[0];
	return { id: u.id, email: u.email, displayName: u.display_name, createdAt: u.created_at };
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
const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === "true";
// In prod (Secure cookies on HTTPS) the web and API may live on
// different subdomains under a public suffix (teacher.up.railway.app vs
// teacher-api.up.railway.app are cross-site for cookie purposes).
// SameSite=None+Secure lets the cookie ride along; Lax breaks login.
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
