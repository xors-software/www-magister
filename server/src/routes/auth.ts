import { Elysia, t } from "elysia";
import {
	buildClearCookie,
	buildSessionCookie,
	createSession,
	deleteSession,
	getUserBySession,
	readSessionToken,
	signupOrLogin,
} from "../lib/auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
	.post(
		"/login",
		async ({ body, set }) => {
			const result = await signupOrLogin(body.email, body.password, body.displayName);
			if (result.kind === "wrong_password") {
				set.status = 401;
				return { error: "Wrong password." };
			}
			if (result.kind === "invalid_email") {
				set.status = 400;
				return { error: "That doesn't look like a valid email." };
			}
			if (result.kind === "weak_password") {
				set.status = 400;
				return { error: "Password must be at least 8 characters." };
			}
			const session = await createSession(result.user.id);
			set.headers["set-cookie"] = buildSessionCookie(session.token);
			return {
				user: {
					id: result.user.id,
					email: result.user.email,
					displayName: result.user.displayName,
				},
				newAccount: result.kind === "signup",
			};
		},
		{
			body: t.Object({
				email: t.String({ minLength: 3 }),
				password: t.String({ minLength: 1 }),
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
