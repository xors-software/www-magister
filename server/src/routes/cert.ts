import { Elysia, t } from "elysia";
import { resolveCurrentUser } from "../lib/xors-identity";
import {
	advanceQuiz,
	aggregateForUser,
	completeQuiz,
	computeResults,
	createQuiz,
	getQuiz,
	recordAnswer,
	resolveQuestion,
} from "../lib/cert-quizzes";
import {
	CERT_QUESTION_BANK,
	getQuestionsByDomain,
	getQuestionsByScenario,
	summarizeQuestion,
} from "../lib/cert-questions";
import {
	DOMAIN_LABELS,
	SCENARIO_LABELS,
	SCENARIO_TAGLINES,
	type CertDomain,
	type CertQuestion,
	type ScenarioId,
} from "../lib/cert-types";
import { generateAdaptiveQuestionsAsync } from "../lib/cert-generation";

function publicQuestion(q: CertQuestion) {
	return {
		id: q.id,
		scenario: q.scenario,
		scenarioLabel: SCENARIO_LABELS[q.scenario],
		domain: q.domain,
		domainLabel: DOMAIN_LABELS[q.domain],
		tasks: q.tasks,
		mode: q.mode,
		difficulty: q.difficulty,
		stem: q.stem,
		choices: q.choices,
	};
}

function revealQuestion(q: CertQuestion, selected: "A" | "B" | "C" | "D" | null) {
	return {
		...publicQuestion(q),
		correct: q.correct,
		explanation: q.explanation,
		distractorRationales: q.distractorRationales,
		studyTags: q.studyTags,
		isCorrect: selected === q.correct,
	};
}

export const certRoutes = new Elysia({ prefix: "/cert" })
	// Resolve current user via the centralized xors session. Routes that
	// need auth check `userId` and 401 if missing. See lib/xors-identity.ts
	// for how the session key cookie maps to a local Magister user row.
	.derive(async ({ request }) => {
		const user = await resolveCurrentUser(request.headers);
		return { userId: user?.id ?? null, user };
	})
	.get("/scenarios", () => {
		const scenarios: ScenarioId[] = [
			"customer-support",
			"code-generation",
			"multi-agent-research",
			"developer-productivity",
			"ci-cd",
			"structured-extraction",
		];
		return scenarios.map((s) => ({
			id: s,
			label: SCENARIO_LABELS[s],
			tagline: SCENARIO_TAGLINES[s],
			questionCount: getQuestionsByScenario(s).length,
		}));
	})
	.get("/domains", () => {
		const domains: CertDomain[] = ["D1", "D2", "D3", "D4", "D5"];
		return domains.map((d) => ({
			id: d,
			label: DOMAIN_LABELS[d],
			questionCount: getQuestionsByDomain(d).length,
		}));
	})
	.get("/questions", () => CERT_QUESTION_BANK.map(summarizeQuestion))
	.post(
		"/quiz",
		async ({ body, set, userId }) => {
			if (!userId) {
				set.status = 401;
				return { error: "Sign in to start a drill." };
			}
			const defaultCount = body.mode === "exam" ? 50 : 10;
			const config = {
				mode: body.mode,
				scenario: body.scenario,
				domain: body.domain,
				count: body.count ?? defaultCount,
				timeLimitSeconds:
					body.mode === "exam" ? 120 * 60 : body.timeLimitSeconds,
			};
			const quiz = await createQuiz(userId, config);
			const firstQ = await resolveQuestion(quiz.questionIds[0]);
			return {
				id: quiz.id,
				config: quiz.config,
				totalQuestions: quiz.questionIds.length,
				currentIndex: 0,
				startedAt: quiz.startedAt,
				timeLimitSeconds: quiz.timeLimitSeconds,
				question: firstQ ? publicQuestion(firstQ) : null,
			};
		},
		{
			body: t.Object({
				mode: t.Union([
					t.Literal("quick"),
					t.Literal("exam"),
					t.Literal("scenario"),
					t.Literal("gotcha"),
					t.Literal("domain"),
				]),
				scenario: t.Optional(
					t.Union([
						t.Literal("customer-support"),
						t.Literal("code-generation"),
						t.Literal("multi-agent-research"),
						t.Literal("developer-productivity"),
						t.Literal("ci-cd"),
						t.Literal("structured-extraction"),
					]),
				),
				domain: t.Optional(
					t.Union([
						t.Literal("D1"),
						t.Literal("D2"),
						t.Literal("D3"),
						t.Literal("D4"),
						t.Literal("D5"),
					]),
				),
				count: t.Optional(t.Number()),
				timeLimitSeconds: t.Optional(t.Number()),
			}),
		},
	)
	.get(
		"/quiz/:id",
		async ({ params: { id }, set, userId }) => {
			if (!userId) {
				set.status = 401;
				return { error: "Sign in to load this drill." };
			}
			const quiz = await getQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			const currentQ = await resolveQuestion(quiz.questionIds[quiz.currentIndex]);
			return {
				id: quiz.id,
				config: quiz.config,
				totalQuestions: quiz.questionIds.length,
				currentIndex: quiz.currentIndex,
				startedAt: quiz.startedAt,
				completedAt: quiz.completedAt,
				timeLimitSeconds: quiz.timeLimitSeconds,
				question: currentQ ? publicQuestion(currentQ) : null,
				answers: Object.fromEntries(
					Object.entries(quiz.answers).map(([qid, a]) => [
						qid,
						{ selected: a.selected, correct: a.correct },
					]),
				),
			};
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.post(
		"/quiz/:id/answer",
		async ({ params: { id }, body, set, userId }) => {
			if (!userId) {
				set.status = 401;
				return { error: "Sign in to answer." };
			}
			const quiz = await getQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			const currentQid = quiz.questionIds[quiz.currentIndex];
			if (!currentQid) {
				set.status = 400;
				return { error: "No current question" };
			}
			const currentQ = await resolveQuestion(currentQid);
			if (!currentQ) {
				set.status = 500;
				return { error: "Question lookup failed" };
			}
			const result = await recordAnswer(id, userId, currentQid, body.selected, body.timeMs);
			const reveal = revealQuestion(currentQ, body.selected);
			const isLast = quiz.currentIndex >= quiz.questionIds.length - 1;
			let next = null;
			if (!isLast) {
				await advanceQuiz(id, userId);
				const updated = await getQuiz(id, userId);
				if (updated) {
					const nextQ = await resolveQuestion(updated.questionIds[updated.currentIndex]);
					next = nextQ ? publicQuestion(nextQ) : null;
				}
			}
			const updatedQuiz = await getQuiz(id, userId);
			return {
				answer: { selected: body.selected, correct: result?.correct ?? false },
				reveal,
				isLast,
				nextQuestion: next,
				currentIndex: updatedQuiz?.currentIndex ?? quiz.currentIndex,
			};
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				selected: t.Union([
					t.Literal("A"),
					t.Literal("B"),
					t.Literal("C"),
					t.Literal("D"),
					t.Null(),
				]),
				timeMs: t.Optional(t.Number()),
			}),
		},
	)
	.post(
		"/quiz/:id/complete",
		async ({ params: { id }, set, userId }) => {
			if (!userId) {
				set.status = 401;
				return { error: "Sign in to finalize." };
			}
			const quiz = await getQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			await completeQuiz(id, userId);
			const results = await computeResults(id, userId);
			// Fire-and-forget adaptive generation for weakest segments.
			if (results) {
				generateAdaptiveQuestionsAsync(userId, results).catch((err) => {
					console.error("[cert] adaptive generation failed:", err);
				});
			}
			return results;
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get(
		"/quiz/:id/results",
		async ({ params: { id }, set, userId }) => {
			if (!userId) {
				set.status = 401;
				return { error: "Sign in to view results." };
			}
			const quiz = await getQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			return computeResults(id, userId);
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get("/stats", async ({ set, userId }) => {
		if (!userId) {
			set.status = 401;
			return { error: "Sign in to view your dashboard." };
		}
		return aggregateForUser(userId);
	});
