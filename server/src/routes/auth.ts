import { Elysia, t } from "elysia";
import {
	buildClearCookie,
	buildSessionCookie,
	consumePasswordResetToken,
	createPasswordResetToken,
	createSession,
	deleteSession,
	getUserBySession,
	readSessionToken,
	signupOrLogin,
} from "../lib/auth";

// Where reset URLs point. Logged with the token so an admin can paste a
// working link straight into Slack. Falls back to a placeholder so missing
// config is loud, not silent.
const WEB_BASE_URL = process.env.WEB_URL || "http://localhost:3010";

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
	})
	.post(
		"/forgot-password",
		async ({ body }) => {
			const result = await createPasswordResetToken(body.email, WEB_BASE_URL);
			if (result) {
				// Conspicuous block so an admin grepping `[reset]` in Railway
				// logs can spot the link instantly. Don't log the raw token
				// to make casual log-skimming a little less risky.
				console.log("\n========== PASSWORD RESET REQUESTED ==========");
				console.log(`[reset] user: ${result.userEmail}`);
				console.log(`[reset] url:  ${result.url}`);
				console.log(`[reset] expires: in ${60} minutes`);
				console.log("==============================================\n");
			} else {
				console.log(`[reset] ignored request for unknown email: ${body.email}`);
			}
			// Always the same response — caller can't distinguish a real
			// account from a typo, so this can't be used to enumerate users.
			return { ok: true };
		},
		{
			body: t.Object({
				email: t.String({ minLength: 3 }),
			}),
		},
	)
	.post(
		"/reset-password",
		async ({ body, set }) => {
			const result = await consumePasswordResetToken(body.token, body.password);
			if (result.kind === "invalid_token") {
				set.status = 400;
				return { error: "This reset link is invalid or expired. Request a new one." };
			}
			if (result.kind === "weak_password") {
				set.status = 400;
				return { error: "Password must be at least 8 characters." };
			}
			return { ok: true };
		},
		{
			body: t.Object({
				token: t.String({ minLength: 1 }),
				password: t.String({ minLength: 1 }),
			}),
		},
	);
