// Postgres-backed quiz session manager. State persists across restarts and
// is scoped to user_id so each Lazer engineer has their own dashboard.
//
// Reads questions from the union of (a) the curated seed bank and (b)
// `generated_questions` produced by Claude — generated rows tagged for a
// specific user are preferred when they exist (adaptive drilling).

import {
	CERT_QUESTION_BANK,
	composeMockExam,
	getQuestionsByDomain,
	getQuestionsByMode,
	getQuestionsByScenario,
	pickRandomQuestions,
	shuffleArray,
} from "./cert-questions";
import type {
	CertDomain,
	CertQuestion,
	DomainScore,
	Quiz,
	QuizConfig,
	QuizResults,
	ScenarioId,
	ScenarioScore,
} from "./cert-types";
import { sql } from "./pg";

function generateId(): string {
	return `qz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// In-process question lookup that also checks generated_questions in the DB.
// Cached weakly per-process; falls through to seed bank if not in cache.
const generatedCache = new Map<string, CertQuestion>();

export async function loadGeneratedQuestion(
	id: string,
): Promise<CertQuestion | undefined> {
	if (generatedCache.has(id)) return generatedCache.get(id);
	const rows = await sql<{
		id: string;
		scenario: string;
		domain: string;
		tasks: string[];
		mode: string;
		difficulty: string;
		stem: string;
		choices: { key: "A" | "B" | "C" | "D"; text: string }[];
		correct: "A" | "B" | "C" | "D";
		explanation: string;
		distractor_rationales: Partial<Record<"A" | "B" | "C" | "D", string>>;
		study_tags: string[];
	}[]>`
		SELECT id, scenario, domain, tasks, mode, difficulty, stem, choices,
		       correct, explanation, distractor_rationales, study_tags
		FROM generated_questions WHERE id = ${id}
	`;
	if (rows.length === 0) return undefined;
	const r = rows[0];
	const q: CertQuestion = {
		id: r.id,
		scenario: r.scenario as ScenarioId,
		domain: r.domain as CertDomain,
		tasks: r.tasks,
		mode: r.mode as CertQuestion["mode"],
		difficulty: r.difficulty as CertQuestion["difficulty"],
		stem: r.stem,
		choices: r.choices,
		correct: r.correct,
		explanation: r.explanation,
		distractorRationales: r.distractor_rationales,
		studyTags: r.study_tags,
	};
	generatedCache.set(id, q);
	return q;
}

// Resolve a question by id from seed bank → DB.
export async function resolveQuestion(id: string): Promise<CertQuestion | undefined> {
	const seed = CERT_QUESTION_BANK.find((q) => q.id === id);
	if (seed) return seed;
	return loadGeneratedQuestion(id);
}

async function getGeneratedPoolForUser(
	userId: string,
	scenario?: ScenarioId,
	domain?: CertDomain,
): Promise<CertQuestion[]> {
	const rows = await sql<{
		id: string;
		scenario: string;
		domain: string;
		tasks: string[];
		mode: string;
		difficulty: string;
		stem: string;
		choices: { key: "A" | "B" | "C" | "D"; text: string }[];
		correct: "A" | "B" | "C" | "D";
		explanation: string;
		distractor_rationales: Partial<Record<"A" | "B" | "C" | "D", string>>;
		study_tags: string[];
	}[]>`
		SELECT id, scenario, domain, tasks, mode, difficulty, stem, choices,
		       correct, explanation, distractor_rationales, study_tags
		FROM generated_questions
		WHERE (generated_for_user_id = ${userId} OR generated_for_user_id IS NULL)
		${scenario ? sql`AND scenario = ${scenario}` : sql``}
		${domain ? sql`AND domain = ${domain}` : sql``}
		ORDER BY generated_at DESC
		LIMIT 200
	`;
	return rows.map((r) => {
		const q: CertQuestion = {
			id: r.id,
			scenario: r.scenario as ScenarioId,
			domain: r.domain as CertDomain,
			tasks: r.tasks,
			mode: r.mode as CertQuestion["mode"],
			difficulty: r.difficulty as CertQuestion["difficulty"],
			stem: r.stem,
			choices: r.choices,
			correct: r.correct,
			explanation: r.explanation,
			distractorRationales: r.distractor_rationales,
			studyTags: r.study_tags,
		};
		generatedCache.set(q.id, q);
		return q;
	});
}

export async function createQuiz(userId: string, config: QuizConfig): Promise<Quiz> {
	let seedPool: CertQuestion[] = CERT_QUESTION_BANK;
	if (config.scenario) seedPool = getQuestionsByScenario(config.scenario);
	if (config.domain) seedPool = getQuestionsByDomain(config.domain);
	if (config.mode === "gotcha") seedPool = getQuestionsByMode("gotcha");

	const generatedPool = await getGeneratedPoolForUser(
		userId,
		config.scenario,
		config.domain,
	);

	let selectedIds: string[];
	if (config.mode === "exam") {
		// Mock exam: balanced by domain weight using seed + generated union.
		selectedIds = composeMockExam(config.count).map((q) => q.id);
		if (generatedPool.length > 0) {
			const targetGen = Math.min(Math.floor(config.count * 0.3), generatedPool.length);
			const genIds = shuffleArray(generatedPool).slice(0, targetGen).map((q) => q.id);
			const seedIds = selectedIds.filter((id) => !genIds.includes(id));
			selectedIds = shuffleArray([...seedIds.slice(0, config.count - targetGen), ...genIds]);
		}
	} else if (config.scenario || config.domain || config.mode === "gotcha") {
		const merged = shuffleArray([...seedPool, ...generatedPool]);
		selectedIds = merged.slice(0, Math.min(config.count, merged.length)).map((q) => q.id);
	} else {
		const merged = shuffleArray([...CERT_QUESTION_BANK, ...generatedPool]);
		selectedIds = merged.slice(0, config.count).map((q) => q.id);
	}

	const id = generateId();
	const startedAt = new Date().toISOString();
	await sql`
		INSERT INTO quizzes (id, user_id, config, question_ids, current_index, started_at, time_limit_seconds)
		VALUES (
			${id}, ${userId}, ${JSON.stringify(config)}::jsonb,
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

async function loadQuiz(id: string, userId?: string): Promise<Quiz | undefined> {
	const rows = await sql<{
		id: string;
		user_id: string;
		config: QuizConfig;
		question_ids: string[];
		current_index: number;
		started_at: string;
		completed_at: string | null;
		time_limit_seconds: number | null;
	}[]>`
		SELECT id, user_id, config, question_ids, current_index, started_at, completed_at, time_limit_seconds
		FROM quizzes WHERE id = ${id}
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
	const answers: Quiz["answers"] = {};
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

export async function getQuiz(
	id: string,
	userId?: string,
): Promise<Quiz | undefined> {
	return loadQuiz(id, userId);
}

export async function recordAnswer(
	quizId: string,
	userId: string,
	questionId: string,
	selected: "A" | "B" | "C" | "D" | null,
	timeMs?: number,
): Promise<{ correct: boolean } | undefined> {
	const quiz = await loadQuiz(quizId, userId);
	if (!quiz) return undefined;
	const q = await resolveQuestion(questionId);
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

export async function advanceQuiz(quizId: string, userId: string): Promise<void> {
	await sql`
		UPDATE quizzes
		SET current_index = LEAST(current_index + 1, array_length(question_ids, 1) - 1)
		WHERE id = ${quizId} AND user_id = ${userId}
	`;
}

export async function completeQuiz(
	quizId: string,
	userId: string,
): Promise<void> {
	await sql`
		UPDATE quizzes SET completed_at = NOW()
		WHERE id = ${quizId} AND user_id = ${userId} AND completed_at IS NULL
	`;
}

export async function computeResults(
	quizId: string,
	userId: string,
): Promise<QuizResults | undefined> {
	const quiz = await loadQuiz(quizId, userId);
	if (!quiz) return undefined;

	// Resolve all question metadata in parallel.
	const resolved = await Promise.all(
		quiz.questionIds.map((id) => resolveQuestion(id).then((q) => [id, q] as const)),
	);
	const qMap = new Map(resolved);

	const totalQuestions = quiz.questionIds.length;
	const answered = quiz.questionIds
		.map((qid) => quiz.answers[qid])
		.filter(Boolean) as { selected: "A" | "B" | "C" | "D" | null; correct: boolean }[];
	const totalCorrect = answered.filter((a) => a.correct).length;
	const percent = totalQuestions === 0 ? 0 : (totalCorrect / totalQuestions) * 100;

	const domains: CertDomain[] = ["D1", "D2", "D3", "D4", "D5"];
	const byDomain: DomainScore[] = domains.map((d) => {
		const dQuestions = quiz.questionIds.filter((qid) => qMap.get(qid)?.domain === d);
		const dCorrect = dQuestions.filter((qid) => quiz.answers[qid]?.correct).length;
		return {
			domain: d,
			correct: dCorrect,
			total: dQuestions.length,
			percent: dQuestions.length === 0 ? 0 : (dCorrect / dQuestions.length) * 100,
		};
	});

	const scenarios: ScenarioId[] = [
		"customer-support",
		"code-generation",
		"multi-agent-research",
		"developer-productivity",
		"ci-cd",
		"structured-extraction",
	];
	const byScenario: ScenarioScore[] = scenarios.map((s) => {
		const sQuestions = quiz.questionIds.filter((qid) => qMap.get(qid)?.scenario === s);
		const sCorrect = sQuestions.filter((qid) => quiz.answers[qid]?.correct).length;
		return {
			scenario: s,
			correct: sCorrect,
			total: sQuestions.length,
			percent: sQuestions.length === 0 ? 0 : (sCorrect / sQuestions.length) * 100,
		};
	});

	const weakestDomains = byDomain
		.filter((d) => d.total > 0)
		.slice()
		.sort((a, b) => a.percent - b.percent)
		.slice(0, 2)
		.map((d) => d.domain);
	const weakestScenarios = byScenario
		.filter((s) => s.total > 0)
		.slice()
		.sort((a, b) => a.percent - b.percent)
		.slice(0, 2)
		.map((s) => s.scenario);

	const missedQuestions = quiz.questionIds
		.filter((qid) => quiz.answers[qid] && !quiz.answers[qid].correct)
		.map((qid) => {
			const q = qMap.get(qid)!;
			const a = quiz.answers[qid];
			return {
				id: q.id,
				stem: q.stem,
				domain: q.domain,
				scenario: q.scenario,
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

	const estimatedExamScore = Math.round(percent * 10);
	const passLikely = estimatedExamScore >= 720;
	const examReady = estimatedExamScore >= 950;

	return {
		quizId: quiz.id,
		totalCorrect,
		totalQuestions,
		percent,
		estimatedExamScore,
		passLikely,
		examReady,
		durationSeconds,
		byDomain,
		byScenario,
		weakestDomains,
		weakestScenarios,
		missedQuestions,
	};
}

export async function aggregateForUser(userId: string): Promise<{
	totalQuizzes: number;
	totalAnswered: number;
	totalCorrect: number;
	rolling: { date: string; percent: number }[];
	byDomain: DomainScore[];
	byScenario: ScenarioScore[];
	bestEstimatedExamScore: number;
	latestEstimatedExamScore: number;
}> {
	const quizRows = await sql<{ id: string; question_ids: string[]; completed_at: string | null }[]>`
		SELECT id, question_ids, completed_at FROM quizzes
		WHERE user_id = ${userId} AND completed_at IS NOT NULL
		ORDER BY completed_at ASC
	`;

	if (quizRows.length === 0) {
		const empty = { correct: 0, total: 0, percent: 0 };
		return {
			totalQuizzes: 0,
			totalAnswered: 0,
			totalCorrect: 0,
			rolling: [],
			byDomain: (["D1", "D2", "D3", "D4", "D5"] as CertDomain[]).map((d) => ({ domain: d, ...empty })),
			byScenario: (
				[
					"customer-support",
					"code-generation",
					"multi-agent-research",
					"developer-productivity",
					"ci-cd",
					"structured-extraction",
				] as ScenarioId[]
			).map((s) => ({ scenario: s, ...empty })),
			bestEstimatedExamScore: 0,
			latestEstimatedExamScore: 0,
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

	// Resolve all unique questions across all quizzes.
	const allQids = new Set<string>();
	for (const q of quizRows) for (const id of q.question_ids) allQids.add(id);
	const resolved = await Promise.all(
		Array.from(allQids).map((id) => resolveQuestion(id).then((q) => [id, q] as const)),
	);
	const qMap = new Map(resolved);

	const domains: CertDomain[] = ["D1", "D2", "D3", "D4", "D5"];
	const scenarios: ScenarioId[] = [
		"customer-support",
		"code-generation",
		"multi-agent-research",
		"developer-productivity",
		"ci-cd",
		"structured-extraction",
	];

	const byDomain: DomainScore[] = domains.map((d) => {
		let correct = 0;
		let total = 0;
		for (const quiz of quizRows) {
			const ans = answersByQuiz.get(quiz.id) ?? [];
			for (const a of ans) {
				if (qMap.get(a.question_id)?.domain !== d) continue;
				total += 1;
				if (a.correct) correct += 1;
			}
		}
		return { domain: d, correct, total, percent: total ? (correct / total) * 100 : 0 };
	});

	const byScenario: ScenarioScore[] = scenarios.map((s) => {
		let correct = 0;
		let total = 0;
		for (const quiz of quizRows) {
			const ans = answersByQuiz.get(quiz.id) ?? [];
			for (const a of ans) {
				if (qMap.get(a.question_id)?.scenario !== s) continue;
				total += 1;
				if (a.correct) correct += 1;
			}
		}
		return { scenario: s, correct, total, percent: total ? (correct / total) * 100 : 0 };
	});

	const totalAnswered = byDomain.reduce((sum, d) => sum + d.total, 0);
	const totalCorrect = byDomain.reduce((sum, d) => sum + d.correct, 0);

	const rolling = quizRows.map((quiz) => {
		const ans = answersByQuiz.get(quiz.id) ?? [];
		const c = ans.filter((a) => a.correct).length;
		const pct = ans.length ? (c / ans.length) * 100 : 0;
		return { date: quiz.completed_at!, percent: pct };
	});

	const bestEstimatedExamScore = rolling.length
		? Math.round(Math.max(...rolling.map((r) => r.percent)) * 10)
		: 0;
	const latestEstimatedExamScore = rolling.length
		? Math.round(rolling[rolling.length - 1].percent * 10)
		: 0;

	return {
		totalQuizzes: quizRows.length,
		totalAnswered,
		totalCorrect,
		rolling,
		byDomain,
		byScenario,
		bestEstimatedExamScore,
		latestEstimatedExamScore,
	};
}
