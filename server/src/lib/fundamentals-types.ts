// Types for the Lazer × Deloitte AI Fundamentals practice engine.
//
// Mirrors the shape of cert-types but pivots from cert-specific
// scenario/domain tagging to a flat topic taxonomy that lines up 1:1
// with the twelve cheatsheets shipped on /ai-fundamentals.

export type FundamentalsTopic =
	| "ai-fundamentals"
	| "ai-terminology"
	| "context-and-prompts"
	| "prompt-patterns"
	| "models-and-spend"
	| "task-decomposition"
	| "cursor-modes"
	| "cursor-vs-jetbrains"
	| "rules-and-repo-config"
	| "keyboard-shortcuts"
	| "tdd-with-agent"
	| "debugging-workflows";

export const TOPIC_LABELS: Record<FundamentalsTopic, string> = {
	"ai-fundamentals": "AI Fundamentals",
	"ai-terminology": "AI Terminology",
	"context-and-prompts": "Context & Prompts",
	"prompt-patterns": "Prompt Patterns",
	"models-and-spend": "Models & Spend",
	"task-decomposition": "Task Decomposition",
	"cursor-modes": "Cursor Modes",
	"cursor-vs-jetbrains": "Cursor vs JetBrains",
	"rules-and-repo-config": "Rules & Repo Config",
	"keyboard-shortcuts": "Keyboard Shortcuts",
	"tdd-with-agent": "TDD with Agent Mode",
	"debugging-workflows": "Debugging Workflows",
};

export const TOPIC_TAGLINES: Record<FundamentalsTopic, string> = {
	"ai-fundamentals": "How LLMs actually work — calibrated user, not magical thinker.",
	"ai-terminology": "Vocabulary primer — the words you'll hear every day.",
	"context-and-prompts": "What goes in the window, what stays out.",
	"prompt-patterns": "Reusable shapes that work.",
	"models-and-spend": "When to reach for Sonnet vs Opus vs Haiku.",
	"task-decomposition": "Breaking a fuzzy ask into pieces an agent can finish.",
	"cursor-modes": "Ask vs Edit vs Agent vs Plan.",
	"cursor-vs-jetbrains": "Pragmatic comparison for teams running both.",
	"rules-and-repo-config": ".cursor/rules and AGENTS.md compounding standards.",
	"keyboard-shortcuts": "The shortcuts that earn back the most minutes/day.",
	"tdd-with-agent": "Use the agent loop as a TDD partner.",
	"debugging-workflows": "Stack trace → reproduce → bisect → fix.",
};

export type FundamentalsDifficulty = "easy" | "medium" | "hard";

export interface FundamentalsQuestion {
	id: string;
	topic: FundamentalsTopic;
	difficulty: FundamentalsDifficulty;
	stem: string;
	choices: { key: "A" | "B" | "C" | "D"; text: string }[];
	correct: "A" | "B" | "C" | "D";
	explanation: string;
	distractorRationales: Partial<Record<"A" | "B" | "C" | "D", string>>;
	studyTags: string[];
}

export interface FundamentalsQuizConfig {
	mode: "quick" | "topic" | "mock";
	topic?: FundamentalsTopic;
	count: number;
	timeLimitSeconds?: number;
}

export interface FundamentalsQuizAnswer {
	questionId: string;
	selected: "A" | "B" | "C" | "D" | null;
	correct: boolean;
	timeMs?: number;
}

export interface FundamentalsQuiz {
	id: string;
	config: FundamentalsQuizConfig;
	questionIds: string[];
	answers: Record<string, FundamentalsQuizAnswer>;
	currentIndex: number;
	startedAt: string;
	completedAt?: string;
	timeLimitSeconds?: number;
}

export interface TopicScore {
	topic: FundamentalsTopic;
	correct: number;
	total: number;
	percent: number;
}

export interface FundamentalsResults {
	quizId: string;
	totalCorrect: number;
	totalQuestions: number;
	percent: number;
	durationSeconds: number;
	byTopic: TopicScore[];
	weakestTopics: FundamentalsTopic[];
	missedQuestions: {
		id: string;
		stem: string;
		topic: FundamentalsTopic;
		selected: "A" | "B" | "C" | "D" | null;
		correct: "A" | "B" | "C" | "D";
		explanation: string;
		studyTags: string[];
	}[];
}
