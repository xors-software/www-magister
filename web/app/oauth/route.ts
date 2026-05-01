/**
 * OAuth callback handler. api.xors.xyz redirects users here after
 * Google consent with `?key=<aes-encrypted-hex>`. We decrypt the key
 * (which is the user's xors API key), set it as an HttpOnly
 * `xors_session` cookie scoped to this app's domain, and bounce into
 * the app.
 *
 * Failure paths all redirect to /login with an `error` query param so
 * the login page can surface a hint instead of leaving the user staring
 * at a blank screen.
 */

import { type NextRequest, NextResponse } from "next/server";
import { decryptOAuthPayload, XORS_SESSION_COOKIE } from "@/lib/xors";

// Force the Node runtime — the AES decrypt uses Node's `crypto` module,
// which isn't available in the Edge runtime.
export const runtime = "nodejs";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function GET(request: NextRequest): Promise<NextResponse> {
	const url = new URL(request.url);
	const key = url.searchParams.get("key");
	const nextHint = url.searchParams.get("next_hint");

	// Behind Railway's reverse proxy, `request.url` reflects the internal
	// `localhost:8080`, not the public host. Read the forwarded headers
	// first (and fall back to `Host`) so redirects we emit point at the
	// real origin the user is on. Same pattern contractor-tracker uses.
	const host =
		request.headers.get("x-forwarded-host") ||
		request.headers.get("host") ||
		url.host;
	const protocol =
		request.headers.get("x-forwarded-proto") ||
		url.protocol.replace(/:$/, "");
	const baseUrl = `${protocol}://${host}`;

	const loginRedirect = (errorCode: string) => {
		const u = new URL("/login", baseUrl);
		u.searchParams.set("error", errorCode);
		return NextResponse.redirect(u);
	};

	if (!key) return loginRedirect("oauth_no_key");

	let sessionKey: string;
	try {
		sessionKey = decryptOAuthPayload(key);
	} catch (err) {
		console.error("[oauth] decrypt failed:", err instanceof Error ? err.message : err);
		return loginRedirect("oauth_decrypt");
	}
	if (!sessionKey) return loginRedirect("oauth_empty_key");

	// Bounce to the deep-link the user was originally heading for, falling
	// back to the launcher. Only allow same-app paths to prevent open
	// redirects. The `?signed_in=google` flag is read once by the
	// destination page to fire a PostHog `signed_in` event, then stripped
	// from the URL via router.replace so refreshes don't re-fire.
	const baseDest = nextHint && nextHint.startsWith("/") ? nextHint : "/claude-code/quiz";
	const destUrl = new URL(baseDest, baseUrl);
	destUrl.searchParams.set("signed_in", "google");
	const res = NextResponse.redirect(destUrl);

	const secure = process.env.NODE_ENV === "production";
	res.cookies.set(XORS_SESSION_COOKIE, sessionKey, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: COOKIE_MAX_AGE_SECONDS,
		secure,
	});
	return res;
}
