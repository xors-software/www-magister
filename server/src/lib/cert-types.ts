// Types for the Anthropic Claude Code Certification practice engine.
//
// The exam is multiple-choice. Pass = 720/1000. The official exam guide
// publishes 5 scenarios; we cover all 6 documented deep-dives here.
//
// Each item is tagged with its scenario, domain, and task so we can
// surface per-domain accuracy and weakness-driven follow-ups.

export type CertDomain =
	| "D1" // Agentic Architecture & Orchestration
	| "D2" // Tool Design & MCP Integration
	| "D3" // Claude Code Configuration & Workflows
	| "D4" // Prompt Engineering & Structured Output
	| "D5"; // Context Management & Reliability

export const DOMAIN_LABELS: Record<CertDomain, string> = {
	D1: "Agentic Architecture & Orchestration",
	D2: "Tool Design & MCP Integration",
	D3: "Claude Code Configuration & Workflows",
	D4: "Prompt Engineering & Structured Output",
	D5: "Context Management & Reliability",
};

export const DOMAIN_WEIGHT: Record<CertDomain, number> = {
	// Approximate exam weights (sum to 100); used to compose mock exams.
	D1: 0.27,
	D2: 0.18,
	D3: 0.2,
	D4: 0.2,
	D5: 0.15,
};

export type ScenarioId =
	| "customer-support"
	| "code-generation"
	| "multi-agent-research"
	| "developer-productivity"
	| "ci-cd"
	| "structured-extraction";

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
	"customer-support": "Customer Support Resolution Agent",
	"code-generation": "Code Generation with Claude Code",
	"multi-agent-research": "Multi-Agent Research System",
	"developer-productivity": "Developer Productivity with Claude",
	"ci-cd": "Claude Code for Continuous Integration",
	"structured-extraction": "Structured Data Extraction",
};

export const SCENARIO_TAGLINES: Record<ScenarioId, string> = {
	"customer-support":
		"Programmatic enforcement, structured handoffs, escalation calibration.",
	"code-generation":
		"CLAUDE.md hierarchy, slash commands, plan vs direct, iterative refinement.",
	"multi-agent-research":
		"Hub-and-spoke orchestration, parallel spawning, provenance preservation.",
	"developer-productivity":
		"Built-in tool selection, MCP scoping, session management, context degradation.",
	"ci-cd":
		"Non-interactive CLI, structured output, multi-pass review, batch vs sync.",
	"structured-extraction":
		"tool_use + JSON schema, validation/retry, batch correlation, provenance.",
};

export type Difficulty = "easy" | "medium" | "hard";

// Mode tags drive which "drill" surfaces a question.
//   - canonical: lifted nearly verbatim from the scenario practice questions
//   - gotcha: tests an explicit anti-pattern from the gotcha list
//   - trick: stem already disqualifies a plausible-looking distractor
//   - synthesis: requires connecting two scenarios
export type ItemMode = "canonical" | "gotcha" | "trick" | "synthesis";

export interface CertQuestion {
	id: string;
	scenario: ScenarioId;
	domain: CertDomain;
	// Free-form task ID from the exam guide (e.g. "1.4", "2.1", "5.2").
	// Multiple tasks possible when a question spans patterns.
	tasks: string[];
	mode: ItemMode;
	difficulty: Difficulty;
	stem: string;
	choices: { key: "A" | "B" | "C" | "D"; text: string }[];
	correct: "A" | "B" | "C" | "D";
	// Why the correct answer is right — shown after the user answers.
	explanation: string;
	// Per-distractor "why this is wrong" rationale. Keys are the wrong choice keys.
	distractorRationales: Partial<Record<"A" | "B" | "C" | "D", string>>;
	// Concept tags so we can recommend study material when a question is missed.
	studyTags: string[];
}

export interface QuizConfig {
	mode: "quick" | "exam" | "scenario" | "gotcha" | "domain";
	scenario?: ScenarioId;
	domain?: CertDomain;
	count: number;
	// Mock exam mode locks the timer to 120 minutes (matches the real exam).
	timeLimitSeconds?: number;
}

export interface QuizAnswer {
	questionId: string;
	selected: "A" | "B" | "C" | "D" | null;
	correct: boolean;
	timeMs?: number;
}

export interface Quiz {
	id: string;
	config: QuizConfig;
	questionIds: string[];
	answers: Record<string, QuizAnswer>;
	currentIndex: number;
	startedAt: string;
	completedAt?: string;
	timeLimitSeconds?: number;
}

export interface DomainScore {
	domain: CertDomain;
	correct: number;
	total: number;
	percent: number;
}

export interface ScenarioScore {
	scenario: ScenarioId;
	correct: number;
	total: number;
	percent: number;
}

export interface QuizResults {
	quizId: string;
	totalCorrect: number;
	totalQuestions: number;
	percent: number;
	// Estimated exam score on the 1000-pt scale (720 = pass, 95% target = 950).
	estimatedExamScore: number;
	passLikely: boolean;
	examReady: boolean;
	durationSeconds: number;
	byDomain: DomainScore[];
	byScenario: ScenarioScore[];
	weakestDomains: CertDomain[];
	weakestScenarios: ScenarioId[];
	missedQuestions: {
		id: string;
		stem: string;
		domain: CertDomain;
		scenario: ScenarioId;
		selected: "A" | "B" | "C" | "D" | null;
		correct: "A" | "B" | "C" | "D";
		explanation: string;
		studyTags: string[];
	}[];
}
