/**
 * Email + password sign-in handler. Lives on the web side (Next.js)
 * specifically — Next.js's filesystem routing wins over the
 * `/api/:path*` rewrite in next.config.js, so this intercepts before
 * the proxy can forward it to the Bun API. Same pattern
 * contractor-tracker uses.
 *
 * Why not on the Bun API: we need to set an HttpOnly cookie on the
 * Magister origin's response, and the simplest way to do that is from
 * a same-origin Next.js handler that calls api.xors.xyz server-side.
 * Putting it on the Bun API would mean threading the cookie through
 * the rewrite proxy, which works but adds a layer of indirection for
 * a flow that has no other reason to involve the Bun side.
 */

import { type NextRequest, NextResponse } from "next/server";
import { authenticateEmailPassword, XORS_SESSION_COOKIE } from "@/lib/xors";

export const runtime = "nodejs";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest): Promise<NextResponse> {
	let body: { email?: unknown; password?: unknown };
	try {
		body = (await req.json()) as { email?: unknown; password?: unknown };
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const email = typeof body.email === "string" ? body.email.trim() : "";
	const password = typeof body.password === "string" ? body.password : "";

	if (!email || !password) {
		return NextResponse.json(
			{ error: "Email and password are required." },
			{ status: 400 },
		);
	}

	const result = await authenticateEmailPassword(email, password);
	if ("error" in result) {
		return NextResponse.json({ error: result.error }, { status: 401 });
	}

	const res = NextResponse.json({ ok: true });
	const secure = process.env.NODE_ENV === "production";
	res.cookies.set(XORS_SESSION_COOKIE, result.key, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: COOKIE_MAX_AGE_SECONDS,
		secure,
	});
	return res;
}
