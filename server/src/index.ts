import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { coursesRoutes } from "./routes/courses";
import { healthRoutes } from "./routes/health";
import { sessionsRoutes } from "./routes/sessions";
import { usersRoutes } from "./routes/users";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "*",
	"Access-Control-Allow-Headers": "*",
} as const;

const app = new Elysia()
	.onRequest(({ request, set }) => {
		Object.assign(set.headers, CORS_HEADERS);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}
	})
	.use(
		swagger({
			documentation: {
				info: {
					title: "Magister API",
					version: "2.0.0",
					description: "Course-based AI tutoring platform",
				},
			},
		}),
	)
	.use(healthRoutes)
	.use(usersRoutes)
	.use(coursesRoutes)
	.use(sessionsRoutes)
	.listen(process.env.PORT || 3001);

console.log(
	`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
	`📚 Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`,
);

export type App = typeof app;
