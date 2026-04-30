import { Elysia, t } from "elysia";
import { resolveCurrentUser } from "../lib/xors-identity";
import {
	FUNDAMENTALS_QUESTION_BANK,
	getFundamentalsQuestionsByTopic,
} from "../lib/fundamentals-questions";
import {
	advanceFundamentalsQuiz,
	aggregateFundamentalsForUser,
	completeFundamentalsQuiz,
	computeFundamentalsResults,
	createFundamentalsQuiz,
	getFundamentalsQuiz,
	recordFundamentalsAnswer,
	resolveFundamentalsQuestion,
} from "../lib/fundamentals-quizzes";
import {
	TOPIC_LABELS,
	TOPIC_TAGLINES,
	type FundamentalsQuestion,
	type FundamentalsTopic,
} from "../lib/fundamentals-types";

function publicQuestion(q: FundamentalsQuestion) {
	return {
		id: q.id,
		topic: q.topic,
		topicLabel: TOPIC_LABELS[q.topic],
		difficulty: q.difficulty,
		stem: q.stem,
		choices: q.choices,
	};
}

function revealQuestion(
	q: FundamentalsQuestion,
	selected: "A" | "B" | "C" | "D" | null,
) {
	return {
		...publicQuestion(q),
		correct: q.correct,
		explanation: q.explanation,
		distractorRationales: q.distractorRationales,
		studyTags: q.studyTags,
		isCorrect: selected === q.correct,
	};
}

export const fundamentalsRoutes = new Elysia({ prefix: "/fundamentals" })
	.derive(async ({ request }) => {
		const user = await resolveCurrentUser(request.headers);
		return { userId: user?.id ?? null, user };
	})
	.get("/topics", () => {
		const topics = Object.keys(TOPIC_LABELS) as FundamentalsTopic[];
		return topics.map((id) => ({
			id,
			label: TOPIC_LABELS[id],
			tagline: TOPIC_TAGLINES[id],
			questionCount: getFundamentalsQuestionsByTopic(id).length,
		}));
	})
	.get("/questions", () =>
		FUNDAMENTALS_QUESTION_BANK.map((q) => ({
			id: q.id,
			topic: q.topic,
			topicLabel: TOPIC_LABELS[q.topic],
			difficulty: q.difficulty,
			stemPreview: q.stem.slice(0, 140),
		})),
	)
	.post(
		"/quiz",
		async ({ body, set, userId }) => {
			if (!userId) {
				set.status = 401;
				return { error: "Sign in to start a drill." };
			}
			if (body.mode === "topic" && !body.topic) {
				set.status = 400;
				return { error: "topic mode requires a topic." };
			}
			const defaultCount = body.mode === "mock" ? 30 : 10;
			const config = {
				mode: body.mode,
				topic: body.topic,
				count: body.count ?? defaultCount,
				timeLimitSeconds: body.timeLimitSeconds,
			};
			const quiz = await createFundamentalsQuiz(userId, config);
			if (quiz.questionIds.length === 0) {
				set.status = 400;
				return {
					error:
						"No questions yet for that selection. Pick a topic with seeded questions or try Quick mode.",
				};
			}
			const firstQ = resolveFundamentalsQuestion(quiz.questionIds[0]);
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
					t.Literal("topic"),
					t.Literal("mock"),
				]),
				topic: t.Optional(
					t.Union([
						t.Literal("ai-fundamentals"),
						t.Literal("ai-terminology"),
						t.Literal("context-and-prompts"),
						t.Literal("prompt-patterns"),
						t.Literal("models-and-spend"),
						t.Literal("task-decomposition"),
						t.Literal("cursor-modes"),
						t.Literal("cursor-vs-jetbrains"),
						t.Literal("rules-and-repo-config"),
						t.Literal("keyboard-shortcuts"),
						t.Literal("tdd-with-agent"),
						t.Literal("debugging-workflows"),
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
			const quiz = await getFundamentalsQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			const currentQ = resolveFundamentalsQuestion(quiz.questionIds[quiz.currentIndex]);
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
			const quiz = await getFundamentalsQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			const currentQid = quiz.questionIds[quiz.currentIndex];
			if (!currentQid) {
				set.status = 400;
				return { error: "No current question" };
			}
			const currentQ = resolveFundamentalsQuestion(currentQid);
			if (!currentQ) {
				set.status = 500;
				return { error: "Question lookup failed" };
			}
			const result = await recordFundamentalsAnswer(
				id,
				userId,
				currentQid,
				body.selected,
				body.timeMs,
			);
			const reveal = revealQuestion(currentQ, body.selected);
			const isLast = quiz.currentIndex >= quiz.questionIds.length - 1;
			let next = null;
			if (!isLast) {
				await advanceFundamentalsQuiz(id, userId);
				const updated = await getFundamentalsQuiz(id, userId);
				if (updated) {
					const nextQ = resolveFundamentalsQuestion(updated.questionIds[updated.currentIndex]);
					next = nextQ ? publicQuestion(nextQ) : null;
				}
			}
			const updatedQuiz = await getFundamentalsQuiz(id, userId);
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
			const quiz = await getFundamentalsQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			await completeFundamentalsQuiz(id, userId);
			return computeFundamentalsResults(id, userId);
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
			const quiz = await getFundamentalsQuiz(id, userId);
			if (!quiz) {
				set.status = 404;
				return { error: "Not found" };
			}
			return computeFundamentalsResults(id, userId);
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get("/stats", async ({ set, userId }) => {
		if (!userId) {
			set.status = 401;
			return { error: "Sign in to view your dashboard." };
		}
		return aggregateFundamentalsForUser(userId);
	});
