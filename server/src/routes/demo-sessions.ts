import { Elysia, t } from "elysia";
import {
	generateHandoff,
	getIntroMessage,
	getTutorResponse,
} from "../lib/anthropic-problems";
import {
	getAllTopics,
	getNextProblem,
	getProblemsForTopic,
} from "../lib/problems";
import type { EducationLevel, Topic } from "../lib/problems";
import {
	addKnowledgeGap,
	addMessage,
	addMisconception,
	createSession,
	getAllSessions,
	getSession,
	startProblemAttempt,
	updateSession,
} from "../lib/sessions-problems";

function briefProblem(p: {
	id: string;
	question: string;
	topic: string;
	subtopic: string;
	difficulty: string;
}) {
	return {
		id: p.id,
		question: p.question,
		topic: p.topic,
		subtopic: p.subtopic,
		difficulty: p.difficulty,
	};
}

function viewMsg(m: {
	role: string;
	content: string;
	diagrams?: string[];
	timestamp: string;
}) {
	return {
		role: m.role,
		content: m.content,
		diagrams: m.diagrams || [],
		timestamp: m.timestamp,
	};
}

export const demoSessionsRoutes = new Elysia({ prefix: "/demo-sessions" })
	.get("/topics", ({ query }) => {
		const level = query?.level as EducationLevel | undefined;
		return getAllTopics(level);
	})
	.post(
		"/",
		async ({ body }) => {
			const educationLevel = (body.educationLevel || "k12") as EducationLevel;
			const session = createSession(
				body.studentName,
				educationLevel,
				body.gradeLevel,
				body.topic as Topic,
			);
			const problems = getProblemsForTopic(body.topic as Topic);
			if (!problems.length) return { error: "No problems available" };

			const first = problems[0];
			startProblemAttempt(session.id, first);
			const intro = await getIntroMessage(session, first);
			addMessage(session.id, {
				role: "tutor",
				content: intro.content,
				diagrams: intro.diagrams,
				timestamp: new Date().toISOString(),
				diagnostic: intro.diagnostic,
			});

			const s = getSession(session.id)!;
			return {
				session: {
					id: s.id,
					studentName: s.studentName,
					educationLevel: s.educationLevel,
					gradeLevel: s.gradeLevel,
					topic: s.topic,
					status: s.status,
					startedAt: s.startedAt,
				},
				currentProblem: briefProblem(first),
				messages: (s.attempts[0]?.messages || []).map(viewMsg),
				problemIndex: 0,
				totalProblems: problems.length,
			};
		},
		{
			body: t.Object({
				studentName: t.String({ minLength: 1 }),
				educationLevel: t.Optional(t.String()),
				gradeLevel: t.Number({ minimum: 0, maximum: 16 }),
				topic: t.String(),
			}),
		},
	)
	.get(
		"/:id",
		({ params: { id }, set }) => {
			const s = getSession(id);
			if (!s) {
				set.status = 404;
				return { error: "Not found" };
			}
			const a = s.attempts[s.currentProblemIndex];
			return {
				session: {
					id: s.id,
					studentName: s.studentName,
					educationLevel: s.educationLevel,
					gradeLevel: s.gradeLevel,
					topic: s.topic,
					status: s.status,
					startedAt: s.startedAt,
					completedAt: s.completedAt,
				},
				currentProblem: a ? briefProblem(a.problem) : null,
				messages: (a?.messages || []).map(viewMsg),
				problemIndex: s.currentProblemIndex,
				totalProblems: getProblemsForTopic(s.topic).length,
				knowledgeGaps: s.knowledgeGaps,
			};
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.post(
		"/:id/message",
		async ({ params: { id }, body, set }) => {
			const s = getSession(id);
			if (!s) {
				set.status = 404;
				return { error: "Not found" };
			}
			if (s.status !== "active") {
				set.status = 400;
				return { error: "Not active" };
			}
			const a = s.attempts[s.currentProblemIndex];
			if (!a) {
				set.status = 400;
				return { error: "No problem" };
			}

			addMessage(id, {
				role: "student",
				content: body.content,
				timestamp: new Date().toISOString(),
			});

			const u = getSession(id)!;
			const msgs = u.attempts[u.currentProblemIndex].messages;
			const r = await getTutorResponse(u, a.problem, msgs);

			if (r.diagnostic) {
				for (const g of r.diagnostic.gaps) {
					const sev =
						r.diagnostic.confidence < 30
							? "critical"
							: r.diagnostic.confidence < 60
								? "moderate"
								: "minor";
					addKnowledgeGap(id, {
						concept: g,
						severity: sev as "critical" | "moderate" | "minor",
						evidence: body.content,
						identifiedAt: new Date().toISOString(),
					});
				}
				for (const mc of r.diagnostic.misconceptions) {
					addMisconception(id, {
						description: mc,
						evidence: body.content,
						identifiedAt: new Date().toISOString(),
					});
				}
			}
			addMessage(id, {
				role: "tutor",
				content: r.content,
				diagrams: r.diagrams,
				timestamp: new Date().toISOString(),
				diagnostic: r.diagnostic,
			});

			let np = null;
			let ni = null;
			if (r.problemSolved) {
				a.status = "solved";
				a.completedAt = new Date().toISOString();
				const done = u.attempts.map((x) => x.problem.id);
				const next = getNextProblem(s.topic, done);
				if (next) {
					startProblemAttempt(id, next);
					const intro = await getIntroMessage(getSession(id)!, next);
					addMessage(id, {
						role: "tutor",
						content: intro.content,
						diagrams: intro.diagrams,
						timestamp: new Date().toISOString(),
						diagnostic: intro.diagnostic,
					});
					np = briefProblem(next);
					ni = intro.content;
				}
			}

			const f = getSession(id)!;
			const fa = f.attempts[f.currentProblemIndex];
			return {
				tutorMessage: {
					role: "tutor" as const,
					content: r.content,
					diagrams: r.diagrams,
					timestamp: new Date().toISOString(),
				},
				problemSolved: r.problemSolved,
				nextProblem: np,
				nextProblemIntro: ni,
				messages: fa.messages.map(viewMsg),
				problemIndex: f.currentProblemIndex,
				totalProblems: getProblemsForTopic(s.topic).length,
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
			const s = getSession(id);
			if (!s) {
				set.status = 404;
				return { error: "Not found" };
			}
			const a = s.attempts[s.currentProblemIndex];
			if (a && a.status === "in-progress") {
				a.status = "moved-on";
				a.completedAt = new Date().toISOString();
			}
			updateSession(id, {
				status: "completed",
				completedAt: new Date().toISOString(),
			});
			return { status: "completed", sessionId: id };
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get(
		"/:id/handoff",
		async ({ params: { id }, set }) => {
			const s = getSession(id);
			if (!s) {
				set.status = 404;
				return { error: "Not found" };
			}
			if (s.status !== "completed") {
				set.status = 400;
				return { error: "Complete session first" };
			}
			return await generateHandoff(s);
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get("/", () =>
		getAllSessions().map((s) => ({
			id: s.id,
			studentName: s.studentName,
			gradeLevel: s.gradeLevel,
			topic: s.topic,
			status: s.status,
			startedAt: s.startedAt,
			completedAt: s.completedAt,
			problemsAttempted: s.attempts.length,
			gapsFound: s.knowledgeGaps.length,
		})),
	);
