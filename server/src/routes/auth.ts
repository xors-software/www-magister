import { Elysia, t } from "elysia";
import {
	buildClearCookie,
	buildSessionCookie,
	createSession,
	deleteSession,
	getOrCreateUser,
	getUserBySession,
	readSessionToken,
} from "../lib/auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
	.post(
		"/login",
		async ({ body, set, request }) => {
			try {
				const user = await getOrCreateUser(body.email, body.displayName);
				const session = await createSession(user.id);
				set.headers["set-cookie"] = buildSessionCookie(session.token);
				return {
					user: {
						id: user.id,
						email: user.email,
						displayName: user.displayName,
					},
				};
			} catch (e) {
				set.status = 400;
				return { error: e instanceof Error ? e.message : "Login failed" };
			}
		},
		{
			body: t.Object({
				email: t.String({ minLength: 3 }),
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
	});
