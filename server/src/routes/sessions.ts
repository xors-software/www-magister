import { Elysia, t } from "elysia";
import { getIntroMessage, getTutorResponse } from "../lib/anthropic";
import { getCourseWithMaterials } from "../lib/courses";
import {
	addMessage,
	completeSession,
	createSession,
	getAllSessions,
	getMessages,
	getSession,
} from "../lib/sessions";

function viewMsg(m: {
	role: string;
	content: string;
	diagrams: string[];
	createdAt: string;
}) {
	return {
		role: m.role,
		content: m.content,
		diagrams: m.diagrams,
		timestamp: m.createdAt,
	};
}

export const sessionsRoutes = new Elysia({ prefix: "/sessions" })
	.post(
		"/",
		async ({ body, set }) => {
			const courseData = getCourseWithMaterials(body.courseId);
			if (!courseData) {
				set.status = 404;
				return { error: "Course not found" };
			}

			const session = createSession(body.courseId, body.studentName);
			const intro = await getIntroMessage(
				session,
				courseData.course.name,
				courseData.materials,
			);

			addMessage(
				session.id,
				"tutor",
				intro.content,
				intro.diagrams,
				intro.diagnostic ?? null,
			);

			const messages = getMessages(session.id);

			return {
				session: {
					id: session.id,
					courseId: session.courseId,
					studentName: session.studentName,
					status: session.status,
					startedAt: session.startedAt,
				},
				course: {
					id: courseData.course.id,
					name: courseData.course.name,
				},
				messages: messages.map(viewMsg),
			};
		},
		{
			body: t.Object({
				courseId: t.String({ minLength: 1 }),
				studentName: t.String({ minLength: 1 }),
			}),
		},
	)
	.get(
		"/:id",
		({ params: { id }, set }) => {
			const session = getSession(id);
			if (!session) {
				set.status = 404;
				return { error: "Session not found" };
			}

			const courseData = getCourseWithMaterials(session.courseId);
			const messages = getMessages(id);

			return {
				session: {
					id: session.id,
					courseId: session.courseId,
					studentName: session.studentName,
					status: session.status,
					startedAt: session.startedAt,
					completedAt: session.completedAt,
				},
				course: courseData
					? { id: courseData.course.id, name: courseData.course.name }
					: null,
				messages: messages.map(viewMsg),
			};
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.post(
		"/:id/message",
		async ({ params: { id }, body, set }) => {
			const session = getSession(id);
			if (!session) {
				set.status = 404;
				return { error: "Session not found" };
			}
			if (session.status !== "active") {
				set.status = 400;
				return { error: "Session is not active" };
			}

			const courseData = getCourseWithMaterials(session.courseId);
			if (!courseData) {
				set.status = 500;
				return { error: "Course data unavailable" };
			}

			addMessage(id, "student", body.content);

			const allMessages = getMessages(id);

			const response = await getTutorResponse(
				session,
				courseData.course.name,
				courseData.materials,
				allMessages,
			);

			addMessage(
				id,
				"tutor",
				response.content,
				response.diagrams,
				response.diagnostic ?? null,
			);

			const updatedMessages = getMessages(id);

			return {
				tutorMessage: {
					role: "tutor" as const,
					content: response.content,
					diagrams: response.diagrams,
					timestamp: new Date().toISOString(),
				},
				messages: updatedMessages.map(viewMsg),
			};
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({ content: t.String({ minLength: 1 }) }),
		},
	)
	.post(
		"/:id/complete",
		({ params: { id }, set }) => {
			const session = completeSession(id);
			if (!session) {
				set.status = 404;
				return { error: "Session not found" };
			}
			return { status: "completed", sessionId: id };
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get("/", () =>
		getAllSessions().map((s) => {
			const courseData = getCourseWithMaterials(s.courseId);
			return {
				id: s.id,
				courseId: s.courseId,
				courseName: courseData?.course.name ?? "Unknown",
				studentName: s.studentName,
				status: s.status,
				startedAt: s.startedAt,
				completedAt: s.completedAt,
			};
		}),
	);
