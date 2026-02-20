import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { healthRoutes } from "./routes/health";
import { sessionsRoutes } from "./routes/sessions";
import { usersRoutes } from "./routes/users";

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, Accept";

const app = new Elysia()
	.onRequest(({ request, set }) => {
		const origin = request.headers.get("origin");
		const allowed = process.env.CORS_ORIGIN || origin || "*";

		set.headers["Access-Control-Allow-Origin"] = allowed;
		set.headers["Access-Control-Allow-Methods"] = ALLOWED_METHODS;
		set.headers["Access-Control-Allow-Headers"] = ALLOWED_HEADERS;
		set.headers["Access-Control-Max-Age"] = "86400";

		if (request.method === "OPTIONS") {
			set.status = 204;
			return "";
		}
	})
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
