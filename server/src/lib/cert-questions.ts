// Question bank for the Anthropic Claude Code Certification practice engine.
//
// Sourced from the six scenario deep-dives. Each question carries scenario,
// domain, task, mode, and difficulty tags to power per-domain analytics and
// drill modes (gotcha, trick, scenario-specific).

import type {
	CertDomain,
	CertQuestion,
	ScenarioId,
} from "./cert-types";
import { CUSTOMER_SUPPORT_QUESTIONS } from "./cert-questions-customer-support";
import { CODE_GENERATION_QUESTIONS } from "./cert-questions-code-generation";
import { MULTI_AGENT_QUESTIONS } from "./cert-questions-multi-agent";
import { DEVELOPER_PRODUCTIVITY_QUESTIONS } from "./cert-questions-developer-productivity";
import { CICD_QUESTIONS } from "./cert-questions-cicd";
import { EXTRACTION_QUESTIONS } from "./cert-questions-extraction";

export const CERT_QUESTION_BANK: CertQuestion[] = [
	...CUSTOMER_SUPPORT_QUESTIONS,
	...CODE_GENERATION_QUESTIONS,
	...MULTI_AGENT_QUESTIONS,
	...DEVELOPER_PRODUCTIVITY_QUESTIONS,
	...CICD_QUESTIONS,
	...EXTRACTION_QUESTIONS,
];

export function getQuestionById(id: string): CertQuestion | undefined {
	return CERT_QUESTION_BANK.find((q) => q.id === id);
}

export function getQuestionsByScenario(scenario: ScenarioId): CertQuestion[] {
	return CERT_QUESTION_BANK.filter((q) => q.scenario === scenario);
}

export function getQuestionsByDomain(domain: CertDomain): CertQuestion[] {
	return CERT_QUESTION_BANK.filter((q) => q.domain === domain);
}

export function getQuestionsByMode(mode: CertQuestion["mode"]): CertQuestion[] {
	return CERT_QUESTION_BANK.filter((q) => q.mode === mode);
}

export function shuffleArray<T>(arr: T[]): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

// Compose a balanced quiz across domains using exam weights.
// Round-robins from each domain's pool to approximate the real exam mix.
export function composeMockExam(targetCount = 50): CertQuestion[] {
	const domains: CertDomain[] = ["D1", "D2", "D3", "D4", "D5"];
	const weights: Record<CertDomain, number> = {
		D1: 0.27,
		D2: 0.18,
		D3: 0.2,
		D4: 0.2,
		D5: 0.15,
	};
	const buckets: Record<CertDomain, CertQuestion[]> = {
		D1: shuffleArray(getQuestionsByDomain("D1")),
		D2: shuffleArray(getQuestionsByDomain("D2")),
		D3: shuffleArray(getQuestionsByDomain("D3")),
		D4: shuffleArray(getQuestionsByDomain("D4")),
		D5: shuffleArray(getQuestionsByDomain("D5")),
	};
	const out: CertQuestion[] = [];
	const targets: Record<CertDomain, number> = {
		D1: Math.round(targetCount * weights.D1),
		D2: Math.round(targetCount * weights.D2),
		D3: Math.round(targetCount * weights.D3),
		D4: Math.round(targetCount * weights.D4),
		D5: Math.round(targetCount * weights.D5),
	};
	for (const d of domains) {
		const want = targets[d];
		for (let i = 0; i < want && i < buckets[d].length; i++) {
			out.push(buckets[d][i]);
		}
	}
	// Pad/trim to exactly targetCount with shuffled remainder.
	const remaining = shuffleArray(
		CERT_QUESTION_BANK.filter((q) => !out.includes(q)),
	);
	while (out.length < targetCount && remaining.length > 0) {
		const next = remaining.shift()!;
		out.push(next);
	}
	if (out.length > targetCount) out.length = targetCount;
	return shuffleArray(out);
}

export function pickRandomQuestions(count: number): CertQuestion[] {
	return shuffleArray(CERT_QUESTION_BANK).slice(0, count);
}

// Trim heavy fields for client-facing list endpoints.
export function summarizeQuestion(q: CertQuestion) {
	return {
		id: q.id,
		scenario: q.scenario,
		domain: q.domain,
		tasks: q.tasks,
		mode: q.mode,
		difficulty: q.difficulty,
	};
}
