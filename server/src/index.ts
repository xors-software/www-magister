import "./lib/env-bootstrap";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import { certRoutes } from "./routes/cert";
import { coursesRoutes } from "./routes/courses";
import { demoSessionsRoutes } from "./routes/demo-sessions";
import { fundamentalsRoutes } from "./routes/fundamentals";
import { healthRoutes } from "./routes/health";
import { sessionsRoutes } from "./routes/sessions";
import { usersRoutes } from "./routes/users";
import { runMigrationsWithRetry } from "./lib/pg";

console.log("[boot] server entry, NODE_ENV=", process.env.NODE_ENV ?? "(unset)");
console.log(
	"[boot] env signals: DATABASE_URL=",
	process.env.DATABASE_URL ? "set" : "MISSING",
	"ANTHROPIC_API_KEY=",
	process.env.ANTHROPIC_API_KEY ? "set" : "MISSING",
	"CORS_ORIGIN=",
	process.env.CORS_ORIGIN ?? "(unset)",
	"PORT=",
	process.env.PORT ?? "(unset)",
	// XORS centralized identity. Without API_AES_KEY + API_IV_KEY the
	// /oauth callback can't decrypt session keys from api.xors.xyz, so
	// every sign-in attempt fails with `oauth_decrypt`. Loud log on boot
	// makes a missing var obvious in Railway logs.
	"API_AES_KEY=",
	process.env.API_AES_KEY ? "set" : "MISSING",
	"API_IV_KEY=",
	process.env.API_IV_KEY ? "set" : "MISSING",
	"XORS_API_URL=",
	process.env.XORS_API_URL ?? "(default https://api.xors.xyz)",
);

// Run schema migrations on startup. Retries on transient errors (Railway
// can race the DB during cold starts) and fails loud if every attempt fails.
try {
	await runMigrationsWithRetry();
	console.log("✓ Postgres migrations applied");
} catch (err) {
	console.error("✗ Postgres unreachable after retries — exiting:", err);
	process.exit(1);
}

// CORS_ORIGIN must be specific origins (not '*') because session cookies
// require credentialed requests. Comma-separated; supports wildcards via
// trailing '*' (e.g. 'https://*.up.railway.app') to cover preview deploys.
const allowedOriginPatterns = (process.env.CORS_ORIGIN || "http://localhost:3000")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);
console.log("[cors] allowed origins:", allowedOriginPatterns.join(", "));

function isOriginAllowed(origin: string): boolean {
	if (!origin) return false;
	for (const pattern of allowedOriginPatterns) {
		if (pattern === origin) return true;
		if (pattern.includes("*")) {
			const re = new RegExp(
				"^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
			);
			if (re.test(origin)) return true;
		}
	}
	return false;
}

const app = new Elysia()
	.onRequest(({ request, set }) => {
		const origin = request.headers.get("origin") || "";
		const ok = isOriginAllowed(origin);
		// Loud log on denial so production CORS misconfigs are immediately
		// obvious in Railway logs. Silent on allow.
		if (origin && !ok) {
			console.warn(
				`[cors] DENIED origin "${origin}" — allowed: ${allowedOriginPatterns.join(", ") || "(none)"}`,
			);
		}
		if (ok) {
			set.headers["access-control-allow-origin"] = origin;
		}
		set.headers["access-control-allow-credentials"] = "true";
		set.headers["access-control-allow-methods"] = "GET,POST,PUT,DELETE,OPTIONS";
		set.headers["access-control-allow-headers"] = "Content-Type,Authorization,Cookie";
		set.headers.vary = "Origin";

		if (request.method === "OPTIONS") {
			const headers: Record<string, string> = {
				"access-control-allow-credentials": "true",
				"access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
				"access-control-allow-headers": "Content-Type,Authorization,Cookie",
				vary: "Origin",
			};
			if (ok) headers["access-control-allow-origin"] = origin;
			return new Response(null, { status: 204, headers });
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
	.use(fundamentalsRoutes)
	.listen({
		hostname: "0.0.0.0",
		port: Number(process.env.PORT) || 8080,
	});

console.log(
	`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
	`📚 Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`,
);

export type App = typeof app;
