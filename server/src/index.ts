import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { healthRoutes } from "./routes/health";
import { sessionsRoutes } from "./routes/sessions";
import { usersRoutes } from "./routes/users";

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
	.split(",")
	.map((o) => o.trim());

const app = new Elysia()
	.use(
		cors({
			origin: (request) => {
				const requestOrigin = request.headers.get("origin");
				if (!requestOrigin) return true;
				return allowedOrigins.some((o) => requestOrigin === o);
			},
			credentials: true,
		}),
	)
	.use(
		swagger({
			documentation: {
				info: {
					title: "Magister API",
					version: "1.0.0",
					description: "Elysia-powered API for XORS projects",
				},
			},
		}),
	)
	.use(healthRoutes)
	.use(usersRoutes)
	.use(sessionsRoutes)
	.listen(process.env.PORT || 3001);

console.log(
	`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
	`📚 Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`,
);

export type App = typeof app;
