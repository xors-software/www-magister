// Auth routes — drastically slimmed down after centralizing on
// api.xors.xyz. Magister no longer handles login, password reset,
// recovery codes, or its own OAuth dance — all of that lives at
// api.xors.xyz now (see web/app/oauth/route.ts and lib/xors-identity.ts).
//
// Two endpoints remain:
//   GET  /auth/me     — return the resolved Magister user, or 401
//   POST /auth/logout — clear the xors_session cookie locally
//
// Logout is local-only because there's no logout endpoint on the xors
// side; clearing our cookie effectively signs the user out of Magister
// while their xors session key stays valid for other XORS apps. That
// matches how slopless / seeker / contractor-tracker behave.

import { Elysia } from "elysia";
import { resolveCurrentUser } from "../lib/xors-identity";

const COOKIE_NAME = "xors_session";
const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE !== "false";
const COOKIE_SAMESITE = process.env.SESSION_COOKIE_SAMESITE || "Lax";

function buildClearCookie(): string {
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

export const authRoutes = new Elysia({ prefix: "/auth" })
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
	.post("/logout", ({ set }) => {
		set.headers["set-cookie"] = buildClearCookie();
		return { ok: true };
	});
