// Postgres-backed quiz session manager for the AI Fundamentals track.
//
// Shares the `quizzes` and `quiz_answers` tables with the cert track via
// the `track` column. All reads/writes here filter on track='ai-fundamentals'
// so the cert dashboard never sees fundamentals quizzes (and vice versa).

import {
	FUNDAMENTALS_QUESTION_BANK,
	composeFundamentalsMock,
	getFundamentalsQuestionsByTopic,
	pickRandomFundamentalsQuestions,
	shuffle,
} from "./fundamentals-questions";
import type {
	FundamentalsQuestion,
	FundamentalsQuiz,
	FundamentalsQuizConfig,
	FundamentalsResults,
	FundamentalsTopic,
	TopicScore,
} from "./fundamentals-types";
import { TOPIC_LABELS } from "./fundamentals-types";
import { sql } from "./pg";

const TRACK = "ai-fundamentals";

function generateId(): string {
	return `fnd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveFundamentalsQuestion(
	id: string,
): FundamentalsQuestion | undefined {
	return FUNDAMENTALS_QUESTION_BANK.find((q) => q.id === id);
}

export async function createFundamentalsQuiz(
	userId: string,
	config: FundamentalsQuizConfig,
): Promise<FundamentalsQuiz> {
	let pool: FundamentalsQuestion[] = FUNDAMENTALS_QUESTION_BANK;
	if (config.mode === "topic" && config.topic) {
		pool = getFundamentalsQuestionsByTopic(config.topic);
	}

	let selected: FundamentalsQuestion[];
	if (config.mode === "mock") {
		selected = composeFundamentalsMock(config.count);
	} else {
		selected = pickRandomFundamentalsQuestions(pool, config.count);
	}
	const selectedIds = selected.map((q) => q.id);

	const id = generateId();
	const startedAt = new Date().toISOString();
	// Pass `config` directly — see cert-generation.ts for why JSON.stringify
	// here would double-encode the JSONB value.
	await sql`
		INSERT INTO quizzes (id, user_id, track, config, question_ids, current_index, started_at, time_limit_seconds)
		VALUES (
			${id}, ${userId}, ${TRACK}, ${config}::jsonb,
			${selectedIds}::text[], 0, ${startedAt}, ${config.timeLimitSeconds ?? null}
		)
	`;
	return {
		id,
		config,
		questionIds: selectedIds,
		answers: {},
		currentIndex: 0,
		startedAt,
		timeLimitSeconds: config.timeLimitSeconds,
	};
}

async function loadFundamentalsQuiz(
	id: string,
	userId?: string,
): Promise<FundamentalsQuiz | undefined> {
	const rows = await sql<{
		id: string;
		user_id: string;
		config: FundamentalsQuizConfig;
		question_ids: string[];
		current_index: number;
		started_at: string;
		completed_at: string | null;
		time_limit_seconds: number | null;
	}[]>`
		SELECT id, user_id, config, question_ids, current_index, started_at, completed_at, time_limit_seconds
		FROM quizzes WHERE id = ${id} AND track = ${TRACK}
		${userId ? sql`AND user_id = ${userId}` : sql``}
	`;
	if (rows.length === 0) return undefined;
	const q = rows[0];
	const answerRows = await sql<{
		question_id: string;
		selected: string | null;
		correct: boolean;
		time_ms: number | null;
	}[]>`
		SELECT question_id, selected, correct, time_ms FROM quiz_answers WHERE quiz_id = ${id}
	`;
	const answers: FundamentalsQuiz["answers"] = {};
	for (const a of answerRows) {
		answers[a.question_id] = {
			questionId: a.question_id,
			selected: (a.selected as "A" | "B" | "C" | "D" | null) ?? null,
			correct: a.correct,
			timeMs: a.time_ms ?? undefined,
		};
	}
	return {
		id: q.id,
		config: q.config,
		questionIds: q.question_ids,
		answers,
		currentIndex: q.current_index,
		startedAt: q.started_at,
		completedAt: q.completed_at ?? undefined,
		timeLimitSeconds: q.time_limit_seconds ?? undefined,
	};
}

export async function getFundamentalsQuiz(
	id: string,
	userId?: string,
): Promise<FundamentalsQuiz | undefined> {
	return loadFundamentalsQuiz(id, userId);
}

export async function recordFundamentalsAnswer(
	quizId: string,
	userId: string,
	questionId: string,
	selected: "A" | "B" | "C" | "D" | null,
	timeMs?: number,
): Promise<{ correct: boolean } | undefined> {
	const quiz = await loadFundamentalsQuiz(quizId, userId);
	if (!quiz) return undefined;
	const q = resolveFundamentalsQuestion(questionId);
	if (!q) return undefined;
	const correct = selected === q.correct;
	await sql`
		INSERT INTO quiz_answers (quiz_id, question_id, selected, correct, time_ms)
		VALUES (${quizId}, ${questionId}, ${selected}, ${correct}, ${timeMs ?? null})
		ON CONFLICT (quiz_id, question_id) DO UPDATE
		SET selected = EXCLUDED.selected,
		    correct = EXCLUDED.correct,
		    time_ms = EXCLUDED.time_ms,
		    answered_at = NOW()
	`;
	return { correct };
}

export async function advanceFundamentalsQuiz(
	quizId: string,
	userId: string,
): Promise<void> {
	await sql`
		UPDATE quizzes
		SET current_index = LEAST(current_index + 1, array_length(question_ids, 1) - 1)
		WHERE id = ${quizId} AND user_id = ${userId} AND track = ${TRACK}
	`;
}

export async function completeFundamentalsQuiz(
	quizId: string,
	userId: string,
): Promise<void> {
	await sql`
		UPDATE quizzes SET completed_at = NOW()
		WHERE id = ${quizId} AND user_id = ${userId} AND track = ${TRACK} AND completed_at IS NULL
	`;
}

export async function computeFundamentalsResults(
	quizId: string,
	userId: string,
): Promise<FundamentalsResults | undefined> {
	const quiz = await loadFundamentalsQuiz(quizId, userId);
	if (!quiz) return undefined;

	const qMap = new Map<string, FundamentalsQuestion>();
	for (const id of quiz.questionIds) {
		const q = resolveFundamentalsQuestion(id);
		if (q) qMap.set(id, q);
	}

	const totalQuestions = quiz.questionIds.length;
	const answered = quiz.questionIds
		.map((qid) => quiz.answers[qid])
		.filter(Boolean) as { selected: "A" | "B" | "C" | "D" | null; correct: boolean }[];
	const totalCorrect = answered.filter((a) => a.correct).length;
	const percent = totalQuestions === 0 ? 0 : (totalCorrect / totalQuestions) * 100;

	const topics = Object.keys(TOPIC_LABELS) as FundamentalsTopic[];
	const byTopic: TopicScore[] = topics.map((topic) => {
		const tQuestions = quiz.questionIds.filter((qid) => qMap.get(qid)?.topic === topic);
		const tCorrect = tQuestions.filter((qid) => quiz.answers[qid]?.correct).length;
		return {
			topic,
			correct: tCorrect,
			total: tQuestions.length,
			percent: tQuestions.length === 0 ? 0 : (tCorrect / tQuestions.length) * 100,
		};
	});

	const weakestTopics = byTopic
		.filter((t) => t.total > 0)
		.slice()
		.sort((a, b) => a.percent - b.percent)
		.slice(0, 2)
		.map((t) => t.topic);

	const missedQuestions = quiz.questionIds
		.filter((qid) => quiz.answers[qid] && !quiz.answers[qid].correct)
		.map((qid) => {
			const q = qMap.get(qid)!;
			const a = quiz.answers[qid];
			return {
				id: q.id,
				stem: q.stem,
				topic: q.topic,
				selected: a.selected,
				correct: q.correct,
				explanation: q.explanation,
				studyTags: q.studyTags,
			};
		});

	const startedMs = new Date(quiz.startedAt).getTime();
	const endedMs = quiz.completedAt
		? new Date(quiz.completedAt).getTime()
		: Date.now();
	const durationSeconds = Math.round((endedMs - startedMs) / 1000);

	return {
		quizId: quiz.id,
		totalCorrect,
		totalQuestions,
		percent,
		durationSeconds,
		byTopic,
		weakestTopics,
		missedQuestions,
	};
}

export async function aggregateFundamentalsForUser(userId: string): Promise<{
	totalQuizzes: number;
	totalAnswered: number;
	totalCorrect: number;
	rolling: { date: string; percent: number }[];
	byTopic: TopicScore[];
	bestPercent: number;
	latestPercent: number;
}> {
	const quizRows = await sql<{ id: string; question_ids: string[]; completed_at: string | null }[]>`
		SELECT id, question_ids, completed_at FROM quizzes
		WHERE user_id = ${userId} AND track = ${TRACK} AND completed_at IS NOT NULL
		ORDER BY completed_at ASC
	`;

	const topics = Object.keys(TOPIC_LABELS) as FundamentalsTopic[];

	if (quizRows.length === 0) {
		return {
			totalQuizzes: 0,
			totalAnswered: 0,
			totalCorrect: 0,
			rolling: [],
			byTopic: topics.map((topic) => ({ topic, correct: 0, total: 0, percent: 0 })),
			bestPercent: 0,
			latestPercent: 0,
		};
	}

	const allAnswerRows = await sql<{ quiz_id: string; question_id: string; correct: boolean }[]>`
		SELECT quiz_id, question_id, correct FROM quiz_answers
		WHERE quiz_id = ANY(${quizRows.map((q) => q.id)}::text[])
	`;
	const answersByQuiz = new Map<string, { question_id: string; correct: boolean }[]>();
	for (const a of allAnswerRows) {
		const arr = answersByQuiz.get(a.quiz_id) ?? [];
		arr.push({ question_id: a.question_id, correct: a.correct });
		answersByQuiz.set(a.quiz_id, arr);
	}

	const qMap = new Map<string, FundamentalsQuestion>();
	for (const quiz of quizRows) {
		for (const id of quiz.question_ids) {
			if (!qMap.has(id)) {
				const q = resolveFundamentalsQuestion(id);
				if (q) qMap.set(id, q);
			}
		}
	}

	const byTopic: TopicScore[] = topics.map((topic) => {
		let correct = 0;
		let total = 0;
		for (const quiz of quizRows) {
			const ans = answersByQuiz.get(quiz.id) ?? [];
			for (const a of ans) {
				if (qMap.get(a.question_id)?.topic !== topic) continue;
				total += 1;
				if (a.correct) correct += 1;
			}
		}
		return { topic, correct, total, percent: total ? (correct / total) * 100 : 0 };
	});

	const totalAnswered = byTopic.reduce((sum, t) => sum + t.total, 0);
	const totalCorrect = byTopic.reduce((sum, t) => sum + t.correct, 0);

	const rolling = quizRows.map((quiz) => {
		const ans = answersByQuiz.get(quiz.id) ?? [];
		const c = ans.filter((a) => a.correct).length;
		const pct = ans.length ? (c / ans.length) * 100 : 0;
		return { date: quiz.completed_at as string, percent: pct };
	});

	const bestPercent = rolling.length ? Math.max(...rolling.map((r) => r.percent)) : 0;
	const latestPercent = rolling.length ? rolling[rolling.length - 1].percent : 0;

	return {
		totalQuizzes: quizRows.length,
		totalAnswered,
		totalCorrect,
		rolling,
		byTopic,
		bestPercent,
		latestPercent,
	};
}

// Re-export shuffle for any caller that needs it.
export { shuffle };
