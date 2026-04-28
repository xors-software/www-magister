// In-memory quiz session manager for the cert practice engine.
// Pattern matches the existing sessions-problems.ts: a Map keyed by id.
// Easy to swap for SQLite later; nothing here is persistence-bound.

import {
	CERT_QUESTION_BANK,
	composeMockExam,
	getQuestionById,
	getQuestionsByDomain,
	getQuestionsByMode,
	getQuestionsByScenario,
	pickRandomQuestions,
	shuffleArray,
} from "./cert-questions";
import type {
	CertDomain,
	DomainScore,
	Quiz,
	QuizAnswer,
	QuizConfig,
	QuizResults,
	ScenarioId,
	ScenarioScore,
} from "./cert-types";

const quizzes = new Map<string, Quiz>();

function generateId(): string {
	return `qz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createQuiz(config: QuizConfig): Quiz {
	let pool = CERT_QUESTION_BANK;
	if (config.scenario) pool = getQuestionsByScenario(config.scenario);
	if (config.domain) pool = getQuestionsByDomain(config.domain);
	if (config.mode === "gotcha") pool = getQuestionsByMode("gotcha");

	let questionIds: string[];
	if (config.mode === "exam") {
		questionIds = composeMockExam(config.count).map((q) => q.id);
	} else if (config.scenario || config.domain || config.mode === "gotcha") {
		questionIds = shuffleArray(pool)
			.slice(0, Math.min(config.count, pool.length))
			.map((q) => q.id);
	} else {
		questionIds = pickRandomQuestions(config.count).map((q) => q.id);
	}

	const quiz: Quiz = {
		id: generateId(),
		config,
		questionIds,
		answers: {},
		currentIndex: 0,
		startedAt: new Date().toISOString(),
		timeLimitSeconds: config.timeLimitSeconds,
	};
	quizzes.set(quiz.id, quiz);
	return quiz;
}

export function getQuiz(id: string): Quiz | undefined {
	return quizzes.get(id);
}

export function recordAnswer(
	quizId: string,
	questionId: string,
	selected: "A" | "B" | "C" | "D" | null,
	timeMs?: number,
): QuizAnswer | undefined {
	const quiz = quizzes.get(quizId);
	if (!quiz) return undefined;
	const q = getQuestionById(questionId);
	if (!q) return undefined;
	const answer: QuizAnswer = {
		questionId,
		selected,
		correct: selected === q.correct,
		timeMs,
	};
	quiz.answers[questionId] = answer;
	return answer;
}

export function advanceQuiz(quizId: string): Quiz | undefined {
	const quiz = quizzes.get(quizId);
	if (!quiz) return undefined;
	if (quiz.currentIndex < quiz.questionIds.length - 1) {
		quiz.currentIndex += 1;
	}
	return quiz;
}

export function completeQuiz(quizId: string): Quiz | undefined {
	const quiz = quizzes.get(quizId);
	if (!quiz) return undefined;
	if (!quiz.completedAt) quiz.completedAt = new Date().toISOString();
	return quiz;
}

export function computeResults(quizId: string): QuizResults | undefined {
	const quiz = quizzes.get(quizId);
	if (!quiz) return undefined;

	const totalQuestions = quiz.questionIds.length;
	const answered = quiz.questionIds
		.map((qid) => quiz.answers[qid])
		.filter(Boolean) as QuizAnswer[];
	const totalCorrect = answered.filter((a) => a.correct).length;
	const percent =
		totalQuestions === 0 ? 0 : (totalCorrect / totalQuestions) * 100;

	const domains: CertDomain[] = ["D1", "D2", "D3", "D4", "D5"];
	const byDomain: DomainScore[] = domains.map((d) => {
		const dQuestions = quiz.questionIds.filter((qid) => {
			const q = getQuestionById(qid);
			return q?.domain === d;
		});
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
		const sQuestions = quiz.questionIds.filter((qid) => {
			const q = getQuestionById(qid);
			return q?.scenario === s;
		});
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
			const q = getQuestionById(qid)!;
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

// Aggregate stats across all quizzes the user has taken (in-memory only).
export function aggregateAllQuizzes(): {
	totalQuizzes: number;
	totalAnswered: number;
	totalCorrect: number;
	rolling: { date: string; percent: number }[];
	byDomain: DomainScore[];
	byScenario: ScenarioScore[];
	bestEstimatedExamScore: number;
	latestEstimatedExamScore: number;
} {
	const all = Array.from(quizzes.values()).filter((q) => q.completedAt);

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
		for (const quiz of all) {
			for (const qid of quiz.questionIds) {
				const q = getQuestionById(qid);
				if (q?.domain !== d) continue;
				if (!quiz.answers[qid]) continue;
				total += 1;
				if (quiz.answers[qid].correct) correct += 1;
			}
		}
		return { domain: d, correct, total, percent: total ? (correct / total) * 100 : 0 };
	});

	const byScenario: ScenarioScore[] = scenarios.map((s) => {
		let correct = 0;
		let total = 0;
		for (const quiz of all) {
			for (const qid of quiz.questionIds) {
				const q = getQuestionById(qid);
				if (q?.scenario !== s) continue;
				if (!quiz.answers[qid]) continue;
				total += 1;
				if (quiz.answers[qid].correct) correct += 1;
			}
		}
		return { scenario: s, correct, total, percent: total ? (correct / total) * 100 : 0 };
	});

	const totalAnswered = byDomain.reduce((sum, d) => sum + d.total, 0);
	const totalCorrect = byDomain.reduce((sum, d) => sum + d.correct, 0);

	const rolling = all
		.slice()
		.sort(
			(a, b) =>
				new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime(),
		)
		.map((quiz) => {
			const answered = quiz.questionIds
				.map((qid) => quiz.answers[qid])
				.filter(Boolean) as QuizAnswer[];
			const correct = answered.filter((a) => a.correct).length;
			const pct = answered.length ? (correct / answered.length) * 100 : 0;
			return { date: quiz.completedAt!, percent: pct };
		});

	const bestEstimatedExamScore = rolling.length
		? Math.round(Math.max(...rolling.map((r) => r.percent)) * 10)
		: 0;
	const latestEstimatedExamScore = rolling.length
		? Math.round(rolling[rolling.length - 1].percent * 10)
		: 0;

	return {
		totalQuizzes: all.length,
		totalAnswered,
		totalCorrect,
		rolling,
		byDomain,
		byScenario,
		bestEstimatedExamScore,
		latestEstimatedExamScore,
	};
}
