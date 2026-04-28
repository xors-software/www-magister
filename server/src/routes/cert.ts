import { Elysia, t } from "elysia";
import {
	advanceQuiz,
	aggregateAllQuizzes,
	completeQuiz,
	computeResults,
	createQuiz,
	getQuiz,
	recordAnswer,
} from "../lib/cert-quizzes";
import {
	CERT_QUESTION_BANK,
	getQuestionById,
	getQuestionsByDomain,
	getQuestionsByScenario,
	summarizeQuestion,
} from "../lib/cert-questions";
import {
	DOMAIN_LABELS,
	SCENARIO_LABELS,
	SCENARIO_TAGLINES,
	type CertDomain,
	type ScenarioId,
} from "../lib/cert-types";

// Public-facing question shape (no correct answer / explanation until graded).
function publicQuestion(id: string) {
	const q = getQuestionById(id);
	if (!q) return null;
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

// Reveal-mode question shape (after answer submitted).
function revealQuestion(id: string, selected: "A" | "B" | "C" | "D" | null) {
	const q = getQuestionById(id);
	if (!q) return null;
	return {
		...publicQuestion(id),
		correct: q.correct,
		explanation: q.explanation,
		distractorRationales: q.distractorRationales,
		studyTags: q.studyTags,
		isCorrect: selected === q.correct,
	};
}

export const certRoutes = new Elysia({ prefix: "/cert" })
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
		({ body }) => {
			const defaultCount = body.mode === "exam" ? 50 : 10;
			const config = {
				mode: body.mode,
				scenario: body.scenario,
				domain: body.domain,
				count: body.count ?? defaultCount,
				timeLimitSeconds:
					body.mode === "exam" ? 120 * 60 : body.timeLimitSeconds,
			};
			const quiz = createQuiz(config);
			return {
				id: quiz.id,
				config: quiz.config,
				totalQuestions: quiz.questionIds.length,
				currentIndex: 0,
				startedAt: quiz.startedAt,
				timeLimitSeconds: quiz.timeLimitSeconds,
				question: publicQuestion(quiz.questionIds[0]),
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
		({ params: { id }, set }) => {
			const quiz = getQuiz(id);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			return {
				id: quiz.id,
				config: quiz.config,
				totalQuestions: quiz.questionIds.length,
				currentIndex: quiz.currentIndex,
				startedAt: quiz.startedAt,
				completedAt: quiz.completedAt,
				timeLimitSeconds: quiz.timeLimitSeconds,
				question: publicQuestion(quiz.questionIds[quiz.currentIndex]),
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
		({ params: { id }, body, set }) => {
			const quiz = getQuiz(id);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			const currentQid = quiz.questionIds[quiz.currentIndex];
			if (!currentQid) {
				set.status = 400;
				return { error: "No current question" };
			}
			const answer = recordAnswer(id, currentQid, body.selected, body.timeMs);
			const reveal = revealQuestion(currentQid, body.selected);
			const isLast = quiz.currentIndex >= quiz.questionIds.length - 1;
			let next = null;
			if (!isLast) {
				advanceQuiz(id);
				const nextQuiz = getQuiz(id)!;
				next = publicQuestion(nextQuiz.questionIds[nextQuiz.currentIndex]);
			}
			return {
				answer,
				reveal,
				isLast,
				nextQuestion: next,
				currentIndex: getQuiz(id)!.currentIndex,
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
		({ params: { id }, set }) => {
			const quiz = getQuiz(id);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			completeQuiz(id);
			return computeResults(id);
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get(
		"/quiz/:id/results",
		({ params: { id }, set }) => {
			const quiz = getQuiz(id);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			return computeResults(id);
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get("/stats", () => aggregateAllQuizzes());
