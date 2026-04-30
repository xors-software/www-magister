// Google OAuth 2.0 sign-in.
//
// Standard authorization-code-with-PKCE flow:
//   1. Browser hits GET /auth/google/start
//      → server generates `state` + `code_verifier`, stashes them in HttpOnly
//        cookies, redirects browser to Google with `code_challenge`.
//   2. User consents at Google.
//   3. Google redirects browser back to GET /auth/google/callback?code&state.
//      → server verifies `state` matches the cookie, exchanges the code +
//        `code_verifier` for tokens, fetches userinfo, finds-or-creates the
//        user, and sets the session cookie.
//
// Why same-origin /api/auth/google/* (proxied through Next.js) instead of
// hitting the API host directly: state and session cookies need to live on
// the same registrable domain the rest of the app uses, otherwise we hit
// the same third-party-cookie wall PR #3 fixed. The OAuth callback URL
// registered with Google must also point at the proxy path, not the API
// subdomain.

import { sql } from "./pg";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

// 5 minutes is plenty for a user to click "Allow" at Google. Anything
// longer just enlarges the window an attacker has to use a stolen state
// cookie. Anything shorter risks legitimate users on slow connections.
export const OAUTH_TRANSIENT_TTL_SECONDS = 300;

export const STATE_COOKIE = "reps_oauth_state";
export const VERIFIER_COOKIE = "reps_oauth_verifier";
// `next` survives the round-trip so we can return the user to the page
// they were trying to reach when they clicked "Sign in with Google".
export const NEXT_COOKIE = "reps_oauth_next";

export interface GoogleOAuthConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

export function readGoogleConfig(): GoogleOAuthConfig | null {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = process.env.GOOGLE_REDIRECT_URI;
	if (!clientId || !clientSecret || !redirectUri) return null;
	return { clientId, clientSecret, redirectUri };
}

// 32 random bytes, base64url-encoded. Both `state` and `code_verifier`
// need ≥128 bits of entropy; this gives 256.
export function randomToken(bytes = 32): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return base64url(buf);
}

// PKCE S256: code_challenge = base64url(sha256(code_verifier)).
export async function pkceChallenge(verifier: string): Promise<string> {
	const enc = new TextEncoder().encode(verifier);
	const hash = await crypto.subtle.digest("SHA-256", enc);
	return base64url(new Uint8Array(hash));
}

function base64url(bytes: Uint8Array): string {
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildAuthUrl(
	config: GoogleOAuthConfig,
	state: string,
	codeChallenge: string,
): string {
	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		response_type: "code",
		scope: "openid email profile",
		state,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
		// `prompt=select_account` lets the user pick which Google account
		// even if they're already signed in to one — useful for shared
		// machines. Drop it if you want frictionless re-auth.
		prompt: "select_account",
		// Don't request a refresh token: this app only needs identity at
		// login time, not ongoing access to Google APIs.
		access_type: "online",
	});
	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleUserInfo {
	sub: string;
	email: string;
	emailVerified: boolean;
	name: string | null;
}

export async function exchangeCodeForUserInfo(
	config: GoogleOAuthConfig,
	code: string,
	codeVerifier: string,
): Promise<GoogleUserInfo> {
	// Step 1 — exchange code for access token. Standard Google flow.
	const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			redirect_uri: config.redirectUri,
			grant_type: "authorization_code",
			code,
			code_verifier: codeVerifier,
		}),
	});
	if (!tokenRes.ok) {
		const text = await tokenRes.text().catch(() => "");
		throw new Error(`Google token exchange failed: ${tokenRes.status} ${text.slice(0, 200)}`);
	}
	const tokens = (await tokenRes.json()) as { access_token?: string };
	if (!tokens.access_token) {
		throw new Error("Google token response missing access_token");
	}

	// Step 2 — fetch userinfo. We trust this response because we just got
	// the access token over HTTPS direct from Google in step 1; the channel
	// itself is the verification (this is what the OAuth code flow gives us
	// over implicit flows).
	const userRes = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${tokens.access_token}` },
	});
	if (!userRes.ok) {
		const text = await userRes.text().catch(() => "");
		throw new Error(`Google userinfo failed: ${userRes.status} ${text.slice(0, 200)}`);
	}
	const u = (await userRes.json()) as {
		sub?: string;
		email?: string;
		email_verified?: boolean;
		name?: string;
	};
	if (!u.sub || !u.email) {
		throw new Error("Google userinfo missing sub or email");
	}
	return {
		sub: u.sub,
		email: u.email.toLowerCase(),
		emailVerified: !!u.email_verified,
		name: u.name ?? null,
	};
}

export interface UserRow {
	id: string;
	email: string;
	displayName: string | null;
	createdAt: string;
}

// Find-or-create logic for OAuth callbacks:
//   1. Match by `google_sub`. Found → that's the user, regardless of email.
//   2. Match by `email`. Found → link Google to the existing account by
//      setting google_sub. This is how an existing password-based user
//      converts to Google sign-in on first OAuth click.
//   3. Otherwise → create a new user with google_sub set and password_hash
//      null (Google-only account; can't sign in with a password).
export async function findOrCreateUserByGoogle(
	info: GoogleUserInfo,
): Promise<{ user: UserRow; isNewAccount: boolean }> {
	// Step 1 — match by google_sub.
	const bySub = await sql<UserRowDb[]>`
		SELECT id, email, display_name, created_at
		FROM users WHERE google_sub = ${info.sub}
	`;
	if (bySub.length > 0) {
		return { user: rowToUser(bySub[0]), isNewAccount: false };
	}

	// Step 2 — match by email; link Google.
	const byEmail = await sql<UserRowDb[]>`
		SELECT id, email, display_name, created_at
		FROM users WHERE email = ${info.email}
	`;
	if (byEmail.length > 0) {
		await sql`
			UPDATE users SET google_sub = ${info.sub} WHERE id = ${byEmail[0].id}
		`;
		return { user: rowToUser(byEmail[0]), isNewAccount: false };
	}

	// Step 3 — fresh account, Google-only.
	const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
	const inserted = await sql<UserRowDb[]>`
		INSERT INTO users (id, email, display_name, google_sub)
		VALUES (${id}, ${info.email}, ${info.name ?? null}, ${info.sub})
		RETURNING id, email, display_name, created_at
	`;
	return { user: rowToUser(inserted[0]), isNewAccount: true };
}

interface UserRowDb {
	id: string;
	email: string;
	display_name: string | null;
	created_at: string;
}

function rowToUser(r: UserRowDb): UserRow {
	return {
		id: r.id,
		email: r.email,
		displayName: r.display_name,
		createdAt: r.created_at,
	};
}
