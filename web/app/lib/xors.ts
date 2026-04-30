/**
 * XORS centralized identity service integration.
 *
 * Magister defers authentication to api.xors.xyz (the apis/ repo). The flow
 * mirrors the other consumer apps (slopless, seeker, contractor-tracker):
 *
 *   1. /login button → redirects browser to:
 *        https://api.xors.xyz/authenticate-google?domain=REDIRECT_MAGISTER
 *   2. api.xors.xyz handles Google OAuth, finds-or-creates the user in its
 *      own users table, AES-encrypts the user's session key.
 *   3. api.xors.xyz redirects browser back to:
 *        https://teacher.up.railway.app/oauth?key=<aes-encrypted-hex>
 *   4. /oauth route handler (web/app/oauth/route.ts) calls
 *      `decryptOAuthPayload` with the shared API_AES_KEY + API_IV_KEY,
 *      sets the `xors_session` cookie containing the decrypted session key.
 *   5. Subsequent authenticated requests include the cookie. The Magister
 *      API forwards the cookie value as `X-API-KEY` to
 *      api.xors.xyz/api/users/viewer to resolve the current user.
 *
 * The shared crypto bytes are formatted exactly the same way as the other
 * consumer apps (see contractor-tracker/web/app/lib/decrypt-xors.ts):
 *   - API_AES_KEY: utf-8 string used directly as 32-byte AES key
 *   - API_IV_KEY:  base64 → hex → 16 bytes, AES-CTR IV
 */

import crypto from "node:crypto";

export const XORS_SESSION_COOKIE = "xors_session";

export function getXorsApiUrl(): string {
	// Server-side env var, optionally overridable from the client by
	// NEXT_PUBLIC_XORS_API_URL — but the only place we hit api.xors.xyz
	// directly from the browser is the /authenticate-google redirect link
	// on /login, so the public default is fine.
	return (
		process.env.XORS_API_URL ||
		process.env.NEXT_PUBLIC_XORS_API_URL ||
		"https://api.xors.xyz"
	);
}

// Match the convention slopless/seeker/contractor-tracker use: the source
// is the consumer app's domain. api.xors.xyz tags the user with this so
// it knows which apps a given user has signed in to.
export function getXorsAuthSource(): string {
	return process.env.XORS_AUTH_SOURCE || "teacher.up.railway.app";
}

// Domain key registered in apis/common/constants.ts (REDIRECT_OPTIONS).
// api.xors.xyz uses this to decide where to bounce the user back to after
// Google consent.
export function getOauthDomainKey(): string {
	return process.env.NEXT_PUBLIC_XORS_OAUTH_DOMAIN || "REDIRECT_MAGISTER";
}

// Build the link the "Sign in with Google" button on /login points at.
// Server-side helper so the page can render a real `<a href>` instead of
// going through a fetch (avoids the third-party-cookie dance entirely —
// it's just a top-level navigation).
export function buildXorsSignInUrl(nextPath?: string): string {
	const base = getXorsApiUrl();
	const domain = getOauthDomainKey();
	const params = new URLSearchParams({ domain });
	// The `next` round-trip isn't supported by api.xors.xyz's
	// /authenticate-google flow today (it only carries `redirect_key` in
	// state). We stash `next` in a cookie before redirect and read it on
	// the way back; see web/app/login/page.tsx and /oauth route handler.
	if (nextPath) params.set("next_hint", nextPath);
	return `${base}/authenticate-google?${params.toString()}`;
}

/**
 * Decrypt the AES-CTR-encrypted session key that api.xors.xyz hands us
 * on the /oauth?key=... callback. Mirrors the encryption in
 * apis/common/server.ts → `encrypt`.
 *
 * Throws if either env var is missing or the input is malformed; callers
 * should treat that as "couldn't sign in" and bounce back to /login.
 */
export function decryptOAuthPayload(hex: string): string {
	const apiAes = process.env.API_AES_KEY;
	const apiIv = process.env.API_IV_KEY;
	if (!apiAes) throw new Error("API_AES_KEY is not set");
	if (!apiIv) throw new Error("API_IV_KEY is not set");

	// Key/IV byte derivation matches contractor-tracker exactly so a user
	// signed in on one app gets a session key that decrypts here too.
	const keyBytes = Buffer.from(apiAes, "utf8");
	const ivBytes = Buffer.from(apiIv, "base64");
	const ciphertext = Buffer.from(hex, "hex");
	if (keyBytes.length !== 32) {
		throw new Error(`API_AES_KEY must be 32 utf-8 bytes (got ${keyBytes.length})`);
	}
	if (ivBytes.length !== 16) {
		throw new Error(`API_IV_KEY must decode to 16 bytes (got ${ivBytes.length})`);
	}
	const decipher = crypto.createDecipheriv("aes-256-ctr", keyBytes, ivBytes);
	const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return decrypted.toString("utf8");
}

export interface XorsViewer {
	id: string;
	email: string;
	username: string | null;
	level: string | number | null;
	verified: number | null;
	data: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Resolve the current user from a session key by hitting api.xors.xyz.
 * Returns null on any failure (bad key, network, malformed response) —
 * the caller should treat that as "not authenticated" and clear the
 * cookie.
 */
export async function fetchXorsViewer(sessionKey: string): Promise<XorsViewer | null> {
	if (!sessionKey) return null;
	let key: string;
	try {
		key = decodeURIComponent(sessionKey);
	} catch {
		key = sessionKey;
	}
	try {
		const res = await fetch(`${getXorsApiUrl()}/api/users/viewer`, {
			method: "GET",
			headers: { "X-API-KEY": key, "Content-Type": "application/json" },
			cache: "no-store",
		});
		if (!res.ok) return null;
		const body = (await res.json()) as { viewer?: XorsViewer };
		return body.viewer ?? null;
	} catch {
		return null;
	}
}
