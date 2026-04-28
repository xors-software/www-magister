import "./lib/env-bootstrap";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import { certRoutes } from "./routes/cert";
import { coursesRoutes } from "./routes/courses";
import { demoSessionsRoutes } from "./routes/demo-sessions";
import { healthRoutes } from "./routes/health";
import { sessionsRoutes } from "./routes/sessions";
import { usersRoutes } from "./routes/users";
import { runMigrations } from "./lib/pg";

// Run schema migrations once on startup. Failure here should crash the server
// — without DB access, the cert routes can't function.
await runMigrations();
console.log("✓ Postgres migrations applied");

// CORS_ORIGIN must be a specific origin (not '*') because we use credentialed
// requests for the session cookie. Multiple origins comma-separated.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
	.split(",")
	.map((s) => s.trim());

const app = new Elysia()
	.onRequest(({ request, set }) => {
		const origin = request.headers.get("origin") || "";
		if (allowedOrigins.includes(origin)) {
			set.headers["access-control-allow-origin"] = origin;
		}
		set.headers["access-control-allow-credentials"] = "true";
		set.headers["access-control-allow-methods"] = "GET,POST,PUT,DELETE,OPTIONS";
		set.headers["access-control-allow-headers"] = "Content-Type,Authorization,Cookie";
		set.headers.vary = "Origin";

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					"access-control-allow-origin": allowedOrigins.includes(origin) ? origin : "",
					"access-control-allow-credentials": "true",
					"access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
					"access-control-allow-headers": "Content-Type,Authorization,Cookie",
				},
			});
		}
	})
	.use(
		swagger({
			documentation: {
				info: {
					title: "Reps API",
					version: "3.0.0",
					description: "Anthropic Claude Code certification practice engine",
				},
			},
		}),
	)
	.use(healthRoutes)
	.use(usersRoutes)
	.use(coursesRoutes)
	.use(sessionsRoutes)
	.use(demoSessionsRoutes)
	.use(authRoutes)
	.use(certRoutes)
	.listen(process.env.PORT || 3001);

console.log(
	`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
	`📚 Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`,
);

export type App = typeof app;
