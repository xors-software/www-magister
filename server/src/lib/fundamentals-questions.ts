// Question bank for the AI Fundamentals track (Lazer × Deloitte L&D pilot).
//
// Sourced verbatim from the twelve cheatsheets shipped on /ai-fundamentals
// (web/public/ai-fundamentals/cheatsheets/*.pdf, v2 · 2026). Every question
// is grounded in concrete cheatsheet content — Cursor-specific shortcuts,
// model names, mode picker, rule formats, hooks, etc. — so a learner who
// has read the relevant cheatsheet can answer it without prior LLM
// knowledge.
//
// 10 questions per topic × 12 topics = 120 total.

import type {
	FundamentalsQuestion,
	FundamentalsTopic,
} from "./fundamentals-types";

// ──────────────────────────────────────────────────────────────────────
// 01 · AI Fundamentals
// Source: cheatsheets/ai-fundamentals.pdf
// ──────────────────────────────────────────────────────────────────────

const AI_FUNDAMENTALS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-af-1",
		topic: "ai-fundamentals",
		difficulty: "easy",
		stem: "What is a token in an LLM, per the AI Fundamentals cheatsheet?",
		choices: [
			{ key: "A", text: "A single character." },
			{ key: "B", text: "A whole word." },
			{ key: "C", text: "A chunk roughly the size of a syllable — pricing, speed, and context size are all measured in these." },
			{ key: "D", text: "An API authentication credential." },
		],
		correct: "C",
		explanation:
			"Tokens are sub-word chunks (~syllable-sized). 'validation' is one token; 'VAlidation' might be three. ~0.75 tokens per English word — pricing, speed, and context size are all token-denominated.",
		distractorRationales: {
			A: "Characters are smaller than tokens — a typical English token is ~4 characters.",
			B: "Words don't map 1:1 — common words may be one token, rare words multiple.",
			D: "Different sense of the word; the cheatsheet uses 'token' as the model's input/output unit.",
		},
		studyTags: ["token", "vocab"],
	},
	{
		id: "fnd-af-2",
		topic: "ai-fundamentals",
		difficulty: "easy",
		stem: "What happens when the context window fills up?",
		choices: [
			{ key: "A", text: "The model stops responding until the user trims the chat." },
			{ key: "B", text: "Oldest content silently drops out." },
			{ key: "C", text: "The IDE shows a warning dialog." },
			{ key: "D", text: "The model switches to a smaller model automatically." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: 'Once full, oldest content silently drops.' The drop is silent — there's no warning. Modern windows range from 128K to 1M (Opus, Gemini).",
		distractorRationales: {
			A: "It doesn't stop — it just drops the oldest content.",
			C: "There's no warning dialog; that's why the cheatsheet calls the drop 'silent.'",
			D: "Model switching isn't automatic on context exhaustion.",
		},
		studyTags: ["context-window"],
	},
	{
		id: "fnd-af-3",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "Cursor's @codebase indexer relies on which underlying technique?",
		choices: [
			{ key: "A", text: "Full-text keyword search across every file." },
			{ key: "B", text: "Embeddings — text becomes a high-dimensional vector and similar meanings sit close together." },
			{ key: "C", text: "Manually-written file-importance scores." },
			{ key: "D", text: "Static AST parsing without any ML." },
		],
		correct: "B",
		explanation:
			"@codebase uses embeddings: each file/chunk is converted to a vector, and a query embedding is matched to the closest vectors. That's how 'semantic search' finds relevant code without literal keyword matches.",
		distractorRationales: {
			A: "Keyword search would miss semantically related code that uses different wording.",
			C: "There's no manual scoring — the index is computed automatically.",
			D: "AST parsing is structural; embeddings encode meaning.",
		},
		studyTags: ["embedding", "rag", "@codebase"],
	},
	{
		id: "fnd-af-4",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "Per the cheatsheet, RAG (Retrieval-Augmented Generation) is best described as which sequence?",
		choices: [
			{ key: "A", text: "Train → fine-tune → deploy." },
			{ key: "B", text: "Search → pick → inject → answer." },
			{ key: "C", text: "Plan → implement → review." },
			{ key: "D", text: "Embed → quantize → serve." },
		],
		correct: "B",
		explanation:
			"RAG retrieves only the relevant slices instead of putting everything in the prompt: search the corpus, pick what's relevant, inject it as context, then the model answers. Cursor's @codebase, @docs, @web are all RAG.",
		distractorRationales: {
			A: "That's a model-training pipeline, not retrieval.",
			C: "That's the model-picker workflow from Models & Spend.",
			D: "Embed/quantize/serve is infrastructure plumbing for vector search, not RAG itself.",
		},
		studyTags: ["rag"],
	},
	{
		id: "fnd-af-5",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "Tool use — what makes Agent mode 'agentic' rather than just chat?",
		choices: [
			{ key: "A", text: "The model decides 'I need to read a file' or 'run a test' and emits a function call the runtime executes; the result comes back as the next message." },
			{ key: "B", text: "The model has a special 'agent' parameter set in the API." },
			{ key: "C", text: "It is a different, larger model than Ask uses." },
			{ key: "D", text: "It generates code without running anything." },
		],
		correct: "A",
		explanation:
			"Tool use = the model emits function calls the runtime executes (read file, edit file, run terminal command), and the result feeds back into the model. Every Agent edit, file read, and terminal command in Cursor is a tool call you can see in the chat.",
		distractorRationales: {
			B: "There's no magic 'agent' parameter — the agentic behavior is the loop with tool execution.",
			C: "Same models can power Agent and Ask; the difference is the runtime, not the model.",
			D: "Agent mode runs things — that's the whole point.",
		},
		studyTags: ["tool-use", "agent"],
	},
	{
		id: "fnd-af-6",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "An engineer says 'the model hallucinated, so it must have been confused.' Which framing matches the cheatsheet's definition?",
		choices: [
			{ key: "A", text: "The model knew it was wrong but lied anyway." },
			{ key: "B", text: "The model produced confident-sounding output that's wrong; it's a probability machine and does not know it's wrong." },
			{ key: "C", text: "Hallucination only happens with smaller models." },
			{ key: "D", text: "Hallucination is impossible at temperature 0." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: hallucination is 'confident-sounding output that's wrong. The model is a probability machine. When uncertain, it still outputs something coherent — invented APIs, missing imports, wrong types. It does not know it's wrong.' Mitigation: verify imports, file paths, signatures before merging.",
		distractorRationales: {
			A: "Lying implies awareness; the model has no self-awareness about its outputs.",
			C: "Bigger models hallucinate too — often more confidently.",
			D: "Temperature 0 reduces variance but doesn't eliminate plausible-sounding inventions.",
		},
		studyTags: ["hallucination"],
	},
	{
		id: "fnd-af-7",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "What composes the system prompt in Cursor, per the cheatsheet?",
		choices: [
			{ key: "A", text: "Whatever the user types in the chat box." },
			{ key: "B", text: "Hidden instructions composed from .cursor/rules + AGENTS.md + your User Rules — you don't write it directly, you configure it." },
			{ key: "C", text: "A fixed prompt set by Anthropic that can't be changed." },
			{ key: "D", text: "Only the active file's contents." },
		],
		correct: "B",
		explanation:
			"The system prompt sits above your chat. In Cursor it's composed from .cursor/rules/ + AGENTS.md + your User Rules + IDE state. You don't write it directly; you configure those sources and Cursor assembles them.",
		distractorRationales: {
			A: "That's the user prompt, not the system prompt.",
			C: "It's user-configurable through the rules surfaces.",
			D: "Active file is just one piece — rules and User Rules feed in too.",
		},
		studyTags: ["system-prompt", "rules"],
	},
	{
		id: "fnd-af-8",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "Per the cheatsheet, Plan Mode in Cursor is a UI for which underlying capability?",
		choices: [
			{ key: "A", text: "Code review." },
			{ key: "B", text: "A reasoning model that thinks (extra internal steps) before answering." },
			{ key: "C", text: "Increased context window only." },
			{ key: "D", text: "Auto-saving file history." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: 'Plan Mode is a UI for reasoning. Opus + thinking flag is the heavy version.' Reasoning models spend extra tokens on internal deliberation before emitting the answer — better at planning, multi-step debugging, math.",
		distractorRationales: {
			A: "Code review isn't the underlying capability; reasoning is.",
			C: "Context windows are independent of reasoning.",
			D: "That's checkpoints, a different feature.",
		},
		studyTags: ["plan-mode", "reasoning"],
	},
	{
		id: "fnd-af-9",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "A teammate says 'more context = better answers.' What's the cheatsheet's correction?",
		choices: [
			{ key: "A", text: "Always true; more context is always better." },
			{ key: "B", text: "False; only paid plans benefit from more context." },
			{ key: "C", text: "True up to a point. Beyond that, signal-to-noise drops. Curate context; don't just stuff it." },
			{ key: "D", text: "False; large context windows cause models to crash." },
		],
		correct: "C",
		explanation:
			"More context helps — but only up to a point. Past a threshold, signal-to-noise drops and the model loses focus. The cheatsheet's mental model: curate context, don't stuff it.",
		distractorRationales: {
			A: "Naive view — empirically wrong past a saturation point.",
			B: "Plan tier doesn't change the principle.",
			D: "Models don't crash; they just degrade in focus.",
		},
		studyTags: ["context-window", "myths"],
	},
	{
		id: "fnd-af-10",
		topic: "ai-fundamentals",
		difficulty: "hard",
		stem: "The cheatsheet's mental model is 'the calibrated user.' Which behavior matches that mindset?",
		choices: [
			{ key: "A", text: "Trust the model's output completely — it's a domain expert." },
			{ key: "B", text: "Re-read every diff before merging; verify cheap structural things (imports, types, file paths)." },
			{ key: "C", text: "Always use the biggest model regardless of task." },
			{ key: "D", text: "Never use Agent mode; only Ask is safe." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: 'Trust the output to the same degree you'd trust a smart junior who read the docs last week. Re-read every diff. The model writes; you ship. Verify the cheap thing: imports, types, file paths.'",
		distractorRationales: {
			A: "The cheatsheet explicitly warns against treating the model as a domain expert.",
			C: "Models & Spend cheatsheet says: try smaller first.",
			D: "Agent has its place — the calibrated user picks the right mode for the job.",
		},
		studyTags: ["mental-model", "calibrated-user"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 02 · AI Terminology
// Source: cheatsheets/ai-terminology.pdf
// ──────────────────────────────────────────────────────────────────────

const AI_TERMINOLOGY_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-at-1",
		topic: "ai-terminology",
		difficulty: "easy",
		stem: "Per the AI Terminology cheatsheet, what is an LLM?",
		choices: [
			{ key: "A", text: "A search engine that retrieves documents." },
			{ key: "B", text: "A text-prediction engine trained on a massive corpus that, given text, predicts what comes next." },
			{ key: "C", text: "A database management system." },
			{ key: "D", text: "A code linter." },
		],
		correct: "B",
		explanation:
			"LLM = text-prediction engine trained on a massive corpus. Given text, it predicts what comes next. Examples: Claude, GPT, Gemini.",
		distractorRationales: {
			A: "Search retrieves; LLMs predict next-token over a learned distribution.",
			C: "Different category of system entirely.",
			D: "Linters are rule-based static analysis, not next-token prediction.",
		},
		studyTags: ["llm", "vocab"],
	},
	{
		id: "fnd-at-2",
		topic: "ai-terminology",
		difficulty: "easy",
		stem: "What does parameter size measure in an LLM?",
		choices: [
			{ key: "A", text: "How many CPUs the model needs." },
			{ key: "B", text: "How many learned connections (weights) the model has — '70B' = 70 billion." },
			{ key: "C", text: "The maximum prompt length in characters." },
			{ key: "D", text: "The price per million tokens." },
		],
		correct: "B",
		explanation:
			"Parameter size = the count of learned weights. '70B' = 70 billion parameters. More ≈ more capable, slower, pricier — but smaller models are often fine for the job.",
		distractorRationales: {
			A: "CPU count is hardware; parameters are learned weights.",
			C: "That's context window.",
			D: "That's per-token pricing.",
		},
		studyTags: ["parameter-size", "vocab"],
	},
	{
		id: "fnd-at-3",
		topic: "ai-terminology",
		difficulty: "easy",
		stem: "What does MCP stand for and what is it for?",
		choices: [
			{ key: "A", text: "Model Cursor Plugin — a Cursor-only extension format." },
			{ key: "B", text: "Model Context Protocol — a standard connector for AI tools to talk to external systems (Jira, databases, custom services). 'USB for AI.'" },
			{ key: "C", text: "Multi-Compute Pipeline — a distributed inference framework." },
			{ key: "D", text: "Mock Configuration Panel — a UI for fake API responses." },
		],
		correct: "B",
		explanation:
			"MCP = Model Context Protocol. The cheatsheet calls it 'USB for AI' — a standard connector so any AI tool can talk to any external system through the same interface.",
		distractorRationales: {
			A: "MCP is cross-tool, not Cursor-specific.",
			C: "Inference frameworks aren't what MCP is.",
			D: "Different concept entirely.",
		},
		studyTags: ["mcp", "vocab"],
	},
	{
		id: "fnd-at-4",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "A teammate uses 'agent' to mean any LLM call. Per the cheatsheet, what's the actual definition?",
		choices: [
			{ key: "A", text: "Any chat with an LLM is an agent." },
			{ key: "B", text: "An AI mode with tools — it can read files, write files, run terminal commands, and iterate. It acts, not just talks." },
			{ key: "C", text: "Only fine-tuned models are agents." },
			{ key: "D", text: "An agent is a separate AI service hosted by a third party." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: an agent is 'an AI mode with tools. It can read files, write files, run terminal commands, and iterate. It acts, not just talks. Creates checkpoints as it goes.'",
		distractorRationales: {
			A: "Conflates 'using an LLM' with 'agent'; the loop+tools matter.",
			C: "Agentic behavior comes from the loop, not fine-tuning.",
			D: "Agents in Cursor run locally with the IDE.",
		},
		studyTags: ["agent", "vocab"],
	},
	{
		id: "fnd-at-5",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "Which prompting style adds 'Think step by step' to the prompt and is best on debugging, planning, and multi-step logic?",
		choices: [
			{ key: "A", text: "Zero-shot." },
			{ key: "B", text: "Few-shot." },
			{ key: "C", text: "Chain of thought." },
			{ key: "D", text: "Role-based." },
		],
		correct: "C",
		explanation:
			"Chain of thought asks the model to reason step by step before producing the answer. Better on debugging, planning, multi-step logic. The cheatsheet's example: 'Before making changes, walk me through how token validation works. Think step by step.'",
		distractorRationales: {
			A: "Zero-shot = no examples and no reasoning instruction.",
			B: "Few-shot = include input/output examples; doesn't request reasoning.",
			D: "Role prompting = persona priming; orthogonal to reasoning depth.",
		},
		studyTags: ["chain-of-thought", "prompting-styles"],
	},
	{
		id: "fnd-at-6",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "Few-shot prompting is best when…",
		choices: [
			{ key: "A", text: "You want the model to reason about its own reasoning." },
			{ key: "B", text: "Output format matters and you can show 1-3 input/output pairs as examples." },
			{ key: "C", text: "You're doing a quick one-off question." },
			{ key: "D", text: "You want to fine-tune the model permanently." },
		],
		correct: "B",
		explanation:
			"Few-shot includes input/output pairs so the model pattern-matches the shape. The cheatsheet's note: 'Good when output format matters.' Doesn't change weights — it's all in the prompt.",
		distractorRationales: {
			A: "Self-reflection is closer to chain-of-thought / meta-prompts.",
			C: "Quick one-offs are typically zero-shot.",
			D: "Fine-tuning is a different mechanism (updates weights).",
		},
		studyTags: ["few-shot", "prompting-styles"],
	},
	{
		id: "fnd-at-7",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "Per the cheatsheet, multimodality is useful but has a cost — what should you watch?",
		choices: [
			{ key: "A", text: "Network bandwidth." },
			{ key: "B", text: "Images and audio consume far more tokens than prose — watch the context window." },
			{ key: "C", text: "Disk space." },
			{ key: "D", text: "Battery." },
		],
		correct: "B",
		explanation:
			"Multimodal models accept images/audio/video alongside text. The catch: those inputs consume far more tokens than equivalent prose, so they fill the context window faster.",
		distractorRationales: {
			A: "Bandwidth is rarely the bottleneck.",
			C: "Disk isn't a per-call constraint.",
			D: "Battery isn't a model concern.",
		},
		studyTags: ["multimodality", "context-window"],
	},
	{
		id: "fnd-at-8",
		topic: "ai-terminology",
		difficulty: "easy",
		stem: "What is a model provider and what are the named ones in the cheatsheet?",
		choices: [
			{ key: "A", text: "A cloud GPU vendor — AWS, GCP, Azure." },
			{ key: "B", text: "The company running the model — Anthropic (Claude), OpenAI (GPT), Google (Gemini), xAI (Grok)." },
			{ key: "C", text: "An open-source model registry like Hugging Face." },
			{ key: "D", text: "The IDE you're using." },
		],
		correct: "B",
		explanation:
			"Model provider = the company running the model. Cursor lets you switch between them. Named: Anthropic, OpenAI, Google, xAI.",
		distractorRationales: {
			A: "GPU vendors host providers — they aren't the providers themselves.",
			C: "Hugging Face is a registry, not a provider in this sense.",
			D: "The IDE isn't running the model.",
		},
		studyTags: ["model-provider", "vocab"],
	},
	{
		id: "fnd-at-9",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "What is a system prompt versus a prompt?",
		choices: [
			{ key: "A", text: "They're the same thing." },
			{ key: "B", text: "A prompt is what you type; the system prompt is hidden instructions that sit above your chat — shaped by .cursor/rules and AGENTS.md, not written directly." },
			{ key: "C", text: "The system prompt is sent only on the first request." },
			{ key: "D", text: "A system prompt is what the LLM produces back to you." },
		],
		correct: "B",
		explanation:
			"Prompt = whatever you type. System prompt = hidden instructions above your chat, composed from rule files. You configure the system prompt indirectly by editing rules.",
		distractorRationales: {
			A: "Distinct concepts — one is yours, the other is the tool's.",
			C: "It's sent every turn, not just first.",
			D: "Output isn't a prompt; it's a completion.",
		},
		studyTags: ["prompt", "system-prompt"],
	},
	{
		id: "fnd-at-10",
		topic: "ai-terminology",
		difficulty: "easy",
		stem: "Why does the cheatsheet say 'smaller, focused prompts tend to produce better outputs than broad, open-ended ones'?",
		choices: [
			{ key: "A", text: "Because the API has a hard length limit." },
			{ key: "B", text: "Because focused prompts reduce ambiguity, which gives the model a tighter target to hit." },
			{ key: "C", text: "Because shorter prompts cost less." },
			{ key: "D", text: "Because LLMs always ignore long prompts." },
		],
		correct: "B",
		explanation:
			"Focused prompts give the model a clearer target. Broad ones force it to interpret intent — interpretation introduces variance. The principle behind CICE/RISEN/RTF in the Context & Prompts cheatsheet.",
		distractorRationales: {
			A: "Hard limits exist but that's not the reason for the recommendation.",
			C: "Cost is real but secondary to quality.",
			D: "Long prompts aren't ignored; they just have lower signal-to-noise past saturation.",
		},
		studyTags: ["prompting-styles"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 03 · Context & Prompts
// Source: cheatsheets/context-and-prompts.pdf
// ──────────────────────────────────────────────────────────────────────

const CONTEXT_PROMPTS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-cp-1",
		topic: "context-and-prompts",
		difficulty: "easy",
		stem: "What does the CICE prompt framework stand for?",
		choices: [
			{ key: "A", text: "Code, Implement, Compile, Execute." },
			{ key: "B", text: "Context, Intent, Constraints, Examples." },
			{ key: "C", text: "Critique, Inspect, Confirm, Edit." },
			{ key: "D", text: "Cursor, IDE, Chat, Editor." },
		],
		correct: "B",
		explanation:
			"CICE is the default prompt framework: Context (where you're working), Intent (the change you want), Constraints (what not to touch), Examples (one concrete data shape or output format — most skipped, most valuable).",
		distractorRationales: {
			A: "Build steps, not a prompt framework.",
			C: "Made-up acronym.",
			D: "Tooling, not framing.",
		},
		studyTags: ["cice", "framework"],
	},
	{
		id: "fnd-cp-2",
		topic: "context-and-prompts",
		difficulty: "easy",
		stem: "Per the cheatsheet, which CICE field is 'most skipped, most valuable'?",
		choices: [
			{ key: "A", text: "Context." },
			{ key: "B", text: "Intent." },
			{ key: "C", text: "Constraints." },
			{ key: "D", text: "Examples." },
		],
		correct: "D",
		explanation:
			"The cheatsheet labels Examples 'most skipped, most valuable.' One concrete data shape or output format pins the model's interpretation more than prose ever does.",
		distractorRationales: {
			A: "Context is usually given (the file you're in).",
			B: "Intent is hard to skip — it's the request itself.",
			C: "Constraints are often skipped but Examples is what the cheatsheet specifically calls out.",
		},
		studyTags: ["cice", "examples"],
	},
	{
		id: "fnd-cp-3",
		topic: "context-and-prompts",
		difficulty: "medium",
		stem: "RISEN stands for…",
		choices: [
			{ key: "A", text: "Role, Inputs, Steps, Errors, Notes." },
			{ key: "B", text: "Role, Instructions, Steps, End goal, Narrowing." },
			{ key: "C", text: "Refactor, Implement, Save, Explain, Notify." },
			{ key: "D", text: "Read, Inspect, Synthesize, Edit, Navigate." },
		],
		correct: "B",
		explanation:
			"RISEN: Role (persona), Instructions (high-level task), Steps (sequence), End goal (success state), Narrowing (off-limits/most important constraints). Used for multi-step agent work with real guardrails.",
		distractorRationales: {
			A: "Wrong expansion.",
			C: "Made up.",
			D: "Made up.",
		},
		studyTags: ["risen", "framework"],
	},
	{
		id: "fnd-cp-4",
		topic: "context-and-prompts",
		difficulty: "medium",
		stem: "Per the cheatsheet, when should you reach for RISEN over CICE?",
		choices: [
			{ key: "A", text: "Always — RISEN is strictly better." },
			{ key: "B", text: "For multi-step agent work with real guardrails. Use CICE if it's one-and-done." },
			{ key: "C", text: "Never — CICE always wins." },
			{ key: "D", text: "Only when working with TypeScript." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's note: 'useful for small tasks. Like CICE instead if it's one-and-done.' RISEN earns its weight on multi-step work where steps and narrowing matter.",
		distractorRationales: {
			A: "Overkill for one-shot tasks.",
			C: "RISEN has its place.",
			D: "Language-agnostic.",
		},
		studyTags: ["risen", "cice"],
	},
	{
		id: "fnd-cp-5",
		topic: "context-and-prompts",
		difficulty: "easy",
		stem: "RTF stands for and is used for…",
		choices: [
			{ key: "A", text: "Rich Text Format — file conversion." },
			{ key: "B", text: "Role, Task, Format — quick tasks where output format matters." },
			{ key: "C", text: "Read, Test, Fix — debugging." },
			{ key: "D", text: "Refactor, Test, Fix — TDD." },
		],
		correct: "B",
		explanation:
			"RTF: Role (who the model is pretending to be), Task (one concrete thing), Format (the exact shape of the output — 'a single function', 'numbered steps', 'a 3-row table'). For quick tasks where output shape matters.",
		distractorRationales: {
			A: "Different domain.",
			C: "Not in the cheatsheet.",
			D: "Different framework, also not in the cheatsheet.",
		},
		studyTags: ["rtf", "framework"],
	},
	{
		id: "fnd-cp-6",
		topic: "context-and-prompts",
		difficulty: "medium",
		stem: "When does the cheatsheet recommend Chain-of-thought prompting?",
		choices: [
			{ key: "A", text: "For trivial single-line edits." },
			{ key: "B", text: "For debugging or when you don't know what to fix — ask the model to think first, act second." },
			{ key: "C", text: "Only for production code." },
			{ key: "D", text: "Never — it wastes tokens." },
		],
		correct: "B",
		explanation:
			"Chain-of-thought ('Think step by step.') for bugs you can't localize, tricky logic, unfamiliar code paths. The cheatsheet's note: 'asking for an explanation first often surfaces the bug before a line is written.'",
		distractorRationales: {
			A: "Trivial edits don't need reasoning overhead — Cmd+K is enough.",
			C: "Code stage doesn't matter — situation does.",
			D: "It's a real tool; Plan Mode is a UI for the same idea.",
		},
		studyTags: ["chain-of-thought", "debugging"],
	},
	{
		id: "fnd-cp-7",
		topic: "context-and-prompts",
		difficulty: "medium",
		stem: "A teammate writes the prompt 'Clean up the code.' Per the cheatsheet, what's the fix?",
		choices: [
			{ key: "A", text: "Add 'please.'" },
			{ key: "B", text: "Switch to a bigger model." },
			{ key: "C", text: "It's vague — name what to rename and what to leave alone." },
			{ key: "D", text: "Add a code-review step at the end." },
		],
		correct: "C",
		explanation:
			"From the anti-patterns table: 'Clean up the code' is vague — name what to rename, what to leave alone. Specificity is the lever, not politeness or model size.",
		distractorRationales: {
			A: "Politeness has negligible effect.",
			B: "Bigger model can't compensate for ambiguous intent.",
			D: "Doesn't address the prompt's vagueness.",
		},
		studyTags: ["anti-patterns", "specificity"],
	},
	{
		id: "fnd-cp-8",
		topic: "context-and-prompts",
		difficulty: "medium",
		stem: "A user prompt says 'Use a factory pattern.' What's the cheatsheet's anti-pattern critique?",
		choices: [
			{ key: "A", text: "Factory patterns are deprecated." },
			{ key: "B", text: "Implements it even if wrong — describe the problem, not the solution. Let the model propose how." },
			{ key: "C", text: "Cursor doesn't support OOP idioms." },
			{ key: "D", text: "Add 'please' and the model will reconsider." },
		],
		correct: "B",
		explanation:
			"From the anti-patterns table: prescribing the solution lets the model implement it even when it's the wrong choice for the problem. Describe the problem; let the model propose the solution.",
		distractorRationales: {
			A: "Pattern itself is fine where appropriate.",
			C: "Cursor is language-agnostic.",
			D: "Politeness doesn't change the pattern of the prompt.",
		},
		studyTags: ["anti-patterns", "describe-problem"],
	},
	{
		id: "fnd-cp-9",
		topic: "context-and-prompts",
		difficulty: "medium",
		stem: "Per the cheatsheet, which is NOT a 'start fresh' signal?",
		choices: [
			{ key: "A", text: "You've moved to a new, unrelated task." },
			{ key: "B", text: "Agent keeps hallucinating file paths." },
			{ key: "C", text: "The conversation anchored on a wrong assumption." },
			{ key: "D", text: "You added one more file to the chat as context." },
		],
		correct: "D",
		explanation:
			"The cheatsheet lists four start-fresh signals: new unrelated task, hallucinated file paths, wrong-assumption anchor, near the context-window cap. Adding a single file isn't on that list — that's normal context curation.",
		distractorRationales: {
			A: "Listed signal.",
			B: "Listed signal.",
			C: "Listed signal.",
		},
		studyTags: ["start-fresh", "context"],
	},
	{
		id: "fnd-cp-10",
		topic: "context-and-prompts",
		difficulty: "hard",
		stem: "The closing maxim of the cheatsheet is 'one task per prompt' and 'describe the problem, not the solution.' What's the meta-prompting tip when you're stuck?",
		choices: [
			{ key: "A", text: "Switch to a different model provider." },
			{ key: "B", text: "Ask the model to write the prompt for you." },
			{ key: "C", text: "Open a fresh chat and try the same prompt again." },
			{ key: "D", text: "Lower the temperature to 0." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet's closing line: 'Stuck? Ask the model to write the prompt for you (meta-prompting).' If your own framing isn't landing, let the model rewrite it.",
		distractorRationales: {
			A: "Provider swap rarely fixes a vague prompt.",
			C: "Same prompt = same problem.",
			D: "Temperature is orthogonal to prompt clarity.",
		},
		studyTags: ["meta-prompting"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 04 · Prompt Patterns (for Agent Mode)
// Source: cheatsheets/prompt-patterns.pdf
// ──────────────────────────────────────────────────────────────────────

const PROMPT_PATTERNS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-pp-1",
		topic: "prompt-patterns",
		difficulty: "easy",
		stem: "Which prompt pattern fits 'I know the behavior but not the code'?",
		choices: [
			{ key: "A", text: "Refactor by intent." },
			{ key: "B", text: "Spec-first." },
			{ key: "C", text: "Migration." },
			{ key: "D", text: "Audit and report." },
		],
		correct: "B",
		explanation:
			"Spec-first: behavior + signature + invariants → 'now build it.' Watch out for leaving invariants implicit — 'reasonable defaults' is not a spec.",
		distractorRationales: {
			A: "Refactor by intent is for shape changes without behavior changes.",
			C: "Migration is for systematic A→B moves across the codebase.",
			D: "Audit and report is for findings, not new code.",
		},
		studyTags: ["spec-first"],
	},
	{
		id: "fnd-pp-2",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "In the Failing-test → fix pattern, what does the cheatsheet say MUST NOT happen?",
		choices: [
			{ key: "A", text: "Agent reads any other file." },
			{ key: "B", text: "Agent modifies the test or adds a new test — always pin the test." },
			{ key: "C", text: "Agent runs the test runner." },
			{ key: "D", text: "Agent uses the terminal." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: 'Do NOT modify the test files. Do NOT add a new test.' The watch-out: 'letting Agent change the test to match the code. Always pin the test.'",
		distractorRationales: {
			A: "Reading other files is fine — the constraint is on test mutation.",
			C: "Running the test is the whole point.",
			D: "Terminal access is part of normal Agent behavior.",
		},
		studyTags: ["failing-test", "tdd"],
	},
	{
		id: "fnd-pp-3",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "Refactor by intent — what's the watch-out the cheatsheet flags?",
		choices: [
			{ key: "A", text: "Agent will refuse the task." },
			{ key: "B", text: "Overshoot. Without 'preserve behavior,' refactors become rewrites." },
			{ key: "C", text: "It only works on TypeScript files." },
			{ key: "D", text: "The diff is too small to review." },
		],
		correct: "B",
		explanation:
			"Refactor by intent shape: rule + file + boundary → 'preserve behavior; show me the diff.' Without 'preserve behavior,' you get rewrites instead of refactors.",
		distractorRationales: {
			A: "Agent doesn't refuse refactors.",
			C: "Pattern is language-agnostic.",
			D: "Small diff is the goal, not the problem.",
		},
		studyTags: ["refactor", "preserve-behavior"],
	},
	{
		id: "fnd-pp-4",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "Migration pattern — what's the most important thing to include?",
		choices: [
			{ key: "A", text: "A list of every file affected." },
			{ key: "B", text: "A before/after example pair (the cheatsheet: 'no example = no consistency')." },
			{ key: "C", text: "An estimated time budget." },
			{ key: "D", text: "A list of imports to add." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet's watch-out: 'no example = no consistency. Always show the before/after pair.' The pattern: before/after example + scope + acceptance → 'do all of them.'",
		distractorRationales: {
			A: "Useful but not the cheatsheet's headline.",
			C: "Time budgets aren't part of the pattern.",
			D: "Imports come out of the example, not in addition.",
		},
		studyTags: ["migration", "example"],
	},
	{
		id: "fnd-pp-5",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "Audit and report pattern — Agent has a tendency the cheatsheet warns about. What is it?",
		choices: [
			{ key: "A", text: "It will hallucinate findings." },
			{ key: "B", text: "It will start fixing if you don't say 'don't.'" },
			{ key: "C", text: "It will miss obvious bugs." },
			{ key: "D", text: "It will require Plan mode." },
		],
		correct: "B",
		explanation:
			"From the watch-out: 'Agent will start fixing if you don't say don't.' For audits you want findings, not edits — so explicit 'don't edit' constraint is required.",
		distractorRationales: {
			A: "Possible but not the cheatsheet's specific warning here.",
			C: "Audit quality varies but isn't the documented gotcha.",
			D: "Audit doesn't require Plan mode.",
		},
		studyTags: ["audit", "constraints"],
	},
	{
		id: "fnd-pp-6",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "Debug-with-hypothesis pattern — what's the difference from a generic debug request?",
		choices: [
			{ key: "A", text: "It uses Plan mode." },
			{ key: "B", text: "Symptom + your hypothesis + ask to confirm or refute. Without a hypothesis, it becomes a long fishing expedition." },
			{ key: "C", text: "It bans the use of @-mentions." },
			{ key: "D", text: "It only works on tests, not runtime errors." },
		],
		correct: "B",
		explanation:
			"The shape: symptom + your hypothesis + ask to confirm or refute. The cheatsheet's watch-out: 'asking with no hypothesis turns into a long fishing expedition.'",
		distractorRationales: {
			A: "Mode-agnostic.",
			C: "@-mentions are still useful.",
			D: "Works on any failure with reproducible signal.",
		},
		studyTags: ["debug", "hypothesis"],
	},
	{
		id: "fnd-pp-7",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "The cheatsheet calls out 'four levers, in every prompt.' Which set is correct?",
		choices: [
			{ key: "A", text: "Tone, voice, length, model." },
			{ key: "B", text: "Scope, Constraints, Format, Stop condition." },
			{ key: "C", text: "Plan, implement, test, ship." },
			{ key: "D", text: "Read, write, run, review." },
		],
		correct: "B",
		explanation:
			"The four levers: 1) Scope (which files? @-mention them), 2) Constraints (what NOT to touch — capitalised NOTs work), 3) Format (diff, file, table, plan?), 4) Stop condition ('Run X and stop.' 'Apply once.').",
		distractorRationales: {
			A: "Stylistic; not what the cheatsheet emphasises.",
			C: "Workflow phases, not levers.",
			D: "Tool actions, not prompt levers.",
		},
		studyTags: ["four-levers"],
	},
	{
		id: "fnd-pp-8",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "Per the cheatsheet, which formatting trick measurably improves Agent's adherence to constraints?",
		choices: [
			{ key: "A", text: "Bold the constraints in Markdown." },
			{ key: "B", text: "Use ALL CAPS for the constraint type and capitalised NOTs ('Do NOT modify the test files.')." },
			{ key: "C", text: "Translate the prompt to French." },
			{ key: "D", text: "Place the constraint as a code comment." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's note: 'Capitalised NOTs work.' Specifically capitalising the negation cue ('NOT', 'NEVER') makes Agent more reliable about the boundary.",
		distractorRationales: {
			A: "Bold doesn't carry through to the model with the same emphasis.",
			C: "Language change doesn't help — clarity does.",
			D: "Comments don't have special weight in prompts.",
		},
		studyTags: ["constraints", "all-caps"],
	},
	{
		id: "fnd-pp-9",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "Which meta-prompt does the cheatsheet recommend when you want to surface wrong assumptions before code is written?",
		choices: [
			{ key: "A", text: "'Write the code, then explain it.'" },
			{ key: "B", text: "'Walk me through how you'd approach this. Don't write code yet.'" },
			{ key: "C", text: "'Use Plan mode automatically.'" },
			{ key: "D", text: "'Make it 10× faster.'" },
		],
		correct: "B",
		explanation:
			"From Meta-prompts that work: '\"Walk me through how you'd approach this. Don't write code yet.\" Surfaces wrong assumptions before they become wrong code.'",
		distractorRationales: {
			A: "Inverts the order — too late.",
			C: "Mode switch isn't a meta-prompt.",
			D: "Concrete optimisation goal, not a planning prompt.",
		},
		studyTags: ["meta-prompts", "plan"],
	},
	{
		id: "fnd-pp-10",
		topic: "prompt-patterns",
		difficulty: "hard",
		stem: "The cheatsheet's closing recommendation is 'Re-use, don't re-invent.' Where does it suggest saving your best prompts?",
		choices: [
			{ key: "A", text: "In an external Notion workspace." },
			{ key: "B", text: "In .cursor/rules/ as Manual rules — pull them in with @-mention." },
			{ key: "C", text: "As code comments in the relevant files." },
			{ key: "D", text: "In your IDE settings." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet's closing line: 'Save your best ones in .cursor/rules/ as Manual rules and pull them in with @-mention.'",
		distractorRationales: {
			A: "External tool — defeats the in-IDE retrieval flow.",
			C: "Comments don't get pulled into prompts the same way.",
			D: "IDE settings aren't shared across the team.",
		},
		studyTags: ["rules", "manual-rules"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 05 · Models & Spend
// Source: cheatsheets/models-and-spend.pdf
// ──────────────────────────────────────────────────────────────────────

const MODELS_SPEND_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-ms-1",
		topic: "models-and-spend",
		difficulty: "easy",
		stem: "Per the Models & Spend cheatsheet, what's the recommended default?",
		choices: [
			{ key: "A", text: "Always use Claude 4.7 Opus." },
			{ key: "B", text: "Default to Auto, try Composer 2 next, reach for named models on purpose." },
			{ key: "C", text: "Always use the cheapest model in the menu." },
			{ key: "D", text: "Pick a model and stick with it for every task." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's tagline: 'Default to Auto, try Composer 2 next, reach for named models on purpose.' Auto is fixed-low-rate and token-fee exempt — always cheapest.",
		distractorRationales: {
			A: "Opus is top-tier; default for everything is wasteful.",
			C: "Cheapest isn't always best — match the task.",
			D: "Workflow varies — model picker is the lever.",
		},
		studyTags: ["auto", "default"],
	},
	{
		id: "fnd-ms-2",
		topic: "models-and-spend",
		difficulty: "medium",
		stem: "What is unique about Auto's pricing in the menu?",
		choices: [
			{ key: "A", text: "It only bills for cached reads." },
			{ key: "B", text: "Fixed low rate ($1.25 in / $0.25 cache / $6.00 out per 1M) and token-fee exempt." },
			{ key: "C", text: "It's free under Pro plan." },
			{ key: "D", text: "Output is cheaper than input." },
		],
		correct: "B",
		explanation:
			"Auto: $1.25 input / $0.25 cache read / $6.00 output per 1M tokens, exempt from the $0.25/1M Cursor Token Fee that named models incur. The cheatsheet labels Auto 'always cheapest.'",
		distractorRationales: {
			A: "Auto bills input + output normally.",
			C: "Not free.",
			D: "Output is more expensive — like every model.",
		},
		studyTags: ["auto", "pricing"],
	},
	{
		id: "fnd-ms-3",
		topic: "models-and-spend",
		difficulty: "medium",
		stem: "Per the cheatsheet, output tokens cost roughly how much more than input tokens on every model?",
		choices: [
			{ key: "A", text: "Same — equal pricing." },
			{ key: "B", text: "About half." },
			{ key: "C", text: "3-10× input." },
			{ key: "D", text: "100× input." },
		],
		correct: "C",
		explanation:
			"The cheatsheet's note above the table: 'Output is 3-10× input on every model.' Implication: large outputs are where spend really compounds.",
		distractorRationales: {
			A: "Generation is more expensive than reading.",
			B: "Inverted — output is more, not less.",
			D: "Too high — most models are 5×.",
		},
		studyTags: ["pricing", "output-cost"],
	},
	{
		id: "fnd-ms-4",
		topic: "models-and-spend",
		difficulty: "medium",
		stem: "Per the workflow guide, which phase pairs best with the biggest model?",
		choices: [
			{ key: "A", text: "Planning — reasoning pays off; use your biggest model here (Opus or GPT-5.4)." },
			{ key: "B", text: "Implementation — once the plan is solid, mid-tier works (Sonnet or Codex)." },
			{ key: "C", text: "Review — a reviewer from another lab catches more blind spots (Sonnet/GPT-5.4 small)." },
			{ key: "D", text: "All three phases require the same model." },
		],
		correct: "A",
		explanation:
			"Planning is where reasoning pays off. The cheatsheet's pairing: Planning → Opus / GPT-5.4. Implementation → Sonnet / Codex. Review → cross-lab small models.",
		distractorRationales: {
			B: "Implementation is mechanical — mid-tier is enough.",
			C: "Review benefits from cross-lab pairing — but not the biggest one.",
			D: "Whole point of the workflow is to vary by phase.",
		},
		studyTags: ["workflow", "planning"],
	},
	{
		id: "fnd-ms-5",
		topic: "models-and-spend",
		difficulty: "medium",
		stem: "Per the cheatsheet, why should the reviewer model come from a different lab than the implementer?",
		choices: [
			{ key: "A", text: "To minimize cost." },
			{ key: "B", text: "A reviewer from another lab catches more blind spots — different training distributions notice different mistakes." },
			{ key: "C", text: "Because models from the same lab refuse to critique each other." },
			{ key: "D", text: "Because of vendor licensing requirements." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's framing: 'A reviewer from another lab catches more blind spots.' Anthropic-implemented → OpenAI-reviewed (or vice versa).",
		distractorRationales: {
			A: "Cost is secondary; the rationale is blind-spot diversity.",
			C: "Models don't refuse self-critique.",
			D: "Not a licensing issue.",
		},
		studyTags: ["review", "cross-lab"],
	},
	{
		id: "fnd-ms-6",
		topic: "models-and-spend",
		difficulty: "medium",
		stem: "Max Mode — what does the cheatsheet say it is, and is it not?",
		choices: [
			{ key: "A", text: "A quality dial — flips on the smartest model." },
			{ key: "B", text: "A capacity dial — raises the context window ceiling, not quality. On Enterprise, no surcharge — you just burn more tokens." },
			{ key: "C", text: "A free upgrade for every plan." },
			{ key: "D", text: "A different inference cluster." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: 'It's a context-window dial, not a quality dial.' The 'Max Mode raises the ceiling, not the quality' callout from AI Fundamentals reinforces this.",
		distractorRationales: {
			A: "Common misconception; explicitly corrected.",
			C: "Tier-specific.",
			D: "Same models, more context budget.",
		},
		studyTags: ["max-mode"],
	},
	{
		id: "fnd-ms-7",
		topic: "models-and-spend",
		difficulty: "medium",
		stem: "Which scenario is a GOOD fit for Max Mode per the cheatsheet?",
		choices: [
			{ key: "A", text: "Single-file edits." },
			{ key: "B", text: "Refactors across 20+ files / searching a large monorepo / architectural design or audit." },
			{ key: "C", text: "Targeted bug fixes." },
			{ key: "D", text: "Quick autocomplete." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's '✓ Max Mode when' list: refactors across 20+ files, searching a large monorepo, architectural design or audit. The '✗' list explicitly rules out single-file edits, <10 file features, targeted bug fixes.",
		distractorRationales: {
			A: "Listed as ✗.",
			C: "Listed as ✗.",
			D: "Tab autocomplete isn't even chat.",
		},
		studyTags: ["max-mode"],
	},
	{
		id: "fnd-ms-8",
		topic: "models-and-spend",
		difficulty: "medium",
		stem: "What's the Cursor Token Fee mentioned in the cheatsheet, and which model is exempt?",
		choices: [
			{ key: "A", text: "$0.25/1M added to named models; Auto is exempt." },
			{ key: "B", text: "$1.00/1M added to all models; no exemptions." },
			{ key: "C", text: "$0.10/1M added only to Opus." },
			{ key: "D", text: "It's been deprecated." },
		],
		correct: "A",
		explanation:
			"From the menu's intro: 'Named models add a $0.25/1M Cursor Token Fee; Auto is exempt.' Part of why Auto is the cheapest default.",
		distractorRationales: {
			B: "Wrong amount and exemption status.",
			C: "Not Opus-specific.",
			D: "Still active per the v2 · 2026 cheatsheet.",
		},
		studyTags: ["pricing", "auto"],
	},
	{
		id: "fnd-ms-9",
		topic: "models-and-spend",
		difficulty: "hard",
		stem: "The cheatsheet frames spend against engineer time. What's the rough ROI lever it cites?",
		choices: [
			{ key: "A", text: "A loaded engineer is $75-150/hr; the $100/user cap is ~40 min to 1.3 hr of that. Save 30 min/day and spend returns 7.5-15×." },
			{ key: "B", text: "Engineer time is irrelevant — minimise model spend at all costs." },
			{ key: "C", text: "Spend should always be at least 50% of engineer cost." },
			{ key: "D", text: "Auto is too expensive for production use." },
		],
		correct: "A",
		explanation:
			"The cheatsheet's closing math: $100/user/month ≈ 40 min to 1.3 hr of loaded engineer time. Save 30 min/day → spend returns 7.5-15×. The lever is the model picker, not the admin panel.",
		distractorRationales: {
			B: "Misses the engineer-time anchoring entirely.",
			C: "Made-up rule of thumb.",
			D: "Auto is the cheapest option.",
		},
		studyTags: ["roi", "engineer-time"],
	},
	{
		id: "fnd-ms-10",
		topic: "models-and-spend",
		difficulty: "hard",
		stem: "An engineer always reaches for Claude 4.7 Opus for every task to be safe. What's the cheatsheet's pushback?",
		choices: [
			{ key: "A", text: "Opus is fine — never use anything else." },
			{ key: "B", text: "Try smaller; if the output holds, you've saved. Default to Auto, then Composer 2; reach for named models on purpose, not by reflex." },
			{ key: "C", text: "Opus is unavailable for paid plans." },
			{ key: "D", text: "Opus has a smaller context window than Sonnet." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's workflow note: 'a starting point, not a rule. Try smaller; if the output holds, you've saved.' Reflexive Opus burns budget on tasks Sonnet/Composer 2/Auto can handle.",
		distractorRationales: {
			A: "Workflow guide explicitly varies model by phase.",
			C: "Opus is in the menu — available.",
			D: "Opus has up to 1M context.",
		},
		studyTags: ["model-selection", "spend-discipline"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 06 · Task Decomposition
// Source: cheatsheets/task-decomposition.pdf
// ──────────────────────────────────────────────────────────────────────

const TASK_DECOMPOSITION_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-td-1",
		topic: "task-decomposition",
		difficulty: "easy",
		stem: "What are the three dimensions the cheatsheet uses to decide one-shot vs split?",
		choices: [
			{ key: "A", text: "Cost, Latency, Quality." },
			{ key: "B", text: "Scope, Reversibility, Specifiability." },
			{ key: "C", text: "Frontend, Backend, Infra." },
			{ key: "D", text: "Read, Write, Run." },
		],
		correct: "B",
		explanation:
			"The three dimensions: Scope (how much code is touched), Reversibility (how hard to undo), Specifiability (how precisely 'done' can be described).",
		distractorRationales: {
			A: "Quality metrics, not split criteria.",
			C: "Architectural layers, not the heuristic.",
			D: "Tool actions, not split criteria.",
		},
		studyTags: ["scope", "reversibility", "specifiability"],
	},
	{
		id: "fnd-td-2",
		topic: "task-decomposition",
		difficulty: "easy",
		stem: "Per Reversibility, when is one-shot OK?",
		choices: [
			{ key: "A", text: "Whenever git has a remote." },
			{ key: "B", text: "If git checkpoint covers it — editor diff is the rollback. Split if external state is involved (DB migration, CI config, deployed service, third-party API)." },
			{ key: "C", text: "Only on Mondays." },
			{ key: "D", text: "Only when no tests exist." },
		],
		correct: "B",
		explanation:
			"Reversibility: one-shot if git diff is the rollback. Split if external state is involved — DB migration, CI config, deployed service, third-party API. Anything you can't `git checkout` to undo.",
		distractorRationales: {
			A: "Remote presence isn't the criterion.",
			C: "Joke distractor.",
			D: "Tests existence is independent.",
		},
		studyTags: ["reversibility"],
	},
	{
		id: "fnd-td-3",
		topic: "task-decomposition",
		difficulty: "medium",
		stem: "Per Specifiability, when is split required?",
		choices: [
			{ key: "A", text: "Whenever the request has more than 10 words." },
			{ key: "B", text: "When the goal is fuzzy ('make this faster,' 'clean it up') — Plan first, then split." },
			{ key: "C", text: "Whenever Agent fails on the first attempt." },
			{ key: "D", text: "Only for refactors, never for new features." },
		],
		correct: "B",
		explanation:
			"Split if the goal is fuzzy. The fix is to Plan first to surface what 'done' looks like, then split into specifiable chunks. Cheatsheet's 30-second test: if you can't describe failure mode in one sentence, you don't know what 'done' looks like.",
		distractorRationales: {
			A: "Length isn't the criterion.",
			C: "Failure may be a prompt issue, not necessarily a split-needed issue.",
			D: "New features get split too.",
		},
		studyTags: ["specifiability", "plan-first"],
	},
	{
		id: "fnd-td-4",
		topic: "task-decomposition",
		difficulty: "medium",
		stem: "From the blast-radius lookup: 'Edits 5+ files, same pattern.' What's the move?",
		choices: [
			{ key: "A", text: "One-shot — Agent handles repetition." },
			{ key: "B", text: "Split: do one as a worked example, then batch ('do the same for these 12 files')." },
			{ key: "C", text: "Refuse — too risky to automate." },
			{ key: "D", text: "Always Plan, never split." },
		],
		correct: "B",
		explanation:
			"The blast-radius row: 'Edits 5+ files, same pattern → split: do one as a worked example, then batch.' The example sets consistency; the batch picks up the pattern.",
		distractorRationales: {
			A: "Without an example, batch consistency suffers.",
			C: "Automation is the strength here, just with a guide.",
			D: "Plan isn't always needed for repetitive mechanical edits.",
		},
		studyTags: ["batch", "example"],
	},
	{
		id: "fnd-td-5",
		topic: "task-decomposition",
		difficulty: "medium",
		stem: "From the blast-radius lookup: 'Touches infra, secrets, CI.' What's the move?",
		choices: [
			{ key: "A", text: "Let Agent handle it autonomously." },
			{ key: "B", text: "Human writes; Agent reviews. Don't reverse." },
			{ key: "C", text: "Plan first, then one-shot." },
			{ key: "D", text: "Run a TDD loop on it." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's hardest blast-radius row: infra/secrets/CI = human writes, Agent reviews. The reviewer roles are reversed because the cost of getting it wrong is too high.",
		distractorRationales: {
			A: "Inverts the recommended pairing.",
			C: "Plan-then-one-shot still has Agent writing the change.",
			D: "TDD loop assumes you can write a fast failing test — usually not for infra.",
		},
		studyTags: ["infra", "secrets", "human-writes"],
	},
	{
		id: "fnd-td-6",
		topic: "task-decomposition",
		difficulty: "medium",
		stem: "Splitting strategies — which one defines an interface first, commits it, then implements on each side?",
		choices: [
			{ key: "A", text: "By layer." },
			{ key: "B", text: "By file batch." },
			{ key: "C", text: "By contract." },
			{ key: "D", text: "By guardrail." },
		],
		correct: "C",
		explanation:
			"By contract: define the new interface first; commit it; then implement on each side. Keeps both sides green. Especially useful when crossing client/server or service boundaries.",
		distractorRationales: {
			A: "By layer = ship one architectural layer at a time.",
			B: "By file batch = repetitive migrations.",
			D: "By guardrail = test-first.",
		},
		studyTags: ["splitting", "contract"],
	},
	{
		id: "fnd-td-7",
		topic: "task-decomposition",
		difficulty: "medium",
		stem: "The 'Mega-prompt' anti-pattern — why does the cheatsheet say it fails?",
		choices: [
			{ key: "A", text: "Models are bad at long prompts." },
			{ key: "B", text: "Agent commits early, runs out of context mid-job, or pattern-matches one piece against another. The diff becomes unreviewable." },
			{ key: "C", text: "It's slow." },
			{ key: "D", text: "It violates Cursor's TOS." },
		],
		correct: "B",
		explanation:
			"The mega-prompt example: 'Refactor the auth system, add MFA, migrate to JWT, and update all the tests.' Agent commits early, runs out of context, or cross-matches piece A against piece B. Result: unreviewable diff. Fix: split by layer or guardrail.",
		distractorRationales: {
			A: "Long isn't the issue; multi-job is.",
			C: "Speed isn't the diagnosis.",
			D: "Not a TOS issue.",
		},
		studyTags: ["mega-prompt", "anti-pattern"],
	},
	{
		id: "fnd-td-8",
		topic: "task-decomposition",
		difficulty: "medium",
		stem: "The 'Over-splitting' anti-pattern — what's the failure mode?",
		choices: [
			{ key: "A", text: "Each split has its own bug." },
			{ key: "B", text: "You spend more time coordinating than coding. Trivial mechanical edits should batch — that's what tools are for." },
			{ key: "C", text: "Agent refuses to work on small tasks." },
			{ key: "D", text: "Tests fail on every split." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's example: 'Step 1: rename one variable. Step 2: rename another.' Coordination overhead exceeds coding time. Fix: if every split is reversible and inside one file, merge them. Three similar lines is better than three prompts.",
		distractorRationales: {
			A: "Bugs aren't from over-splitting per se.",
			C: "Agent doesn't refuse small tasks.",
			D: "Test failures aren't the diagnosis.",
		},
		studyTags: ["over-splitting", "anti-pattern"],
	},
	{
		id: "fnd-td-9",
		topic: "task-decomposition",
		difficulty: "medium",
		stem: "The 'Hidden coupling' anti-pattern — what's the example and the fix?",
		choices: [
			{ key: "A", text: "'Just update the response shape. The frontend is fine.' → Define the contract first (TypeScript types, OpenAPI, schema). Implement on both sides against the same artifact." },
			{ key: "B", text: "Refactor everything at once." },
			{ key: "C", text: "Always use Plan mode." },
			{ key: "D", text: "Add more tests." },
		],
		correct: "A",
		explanation:
			"From the cheatsheet: 'fine' is unverified. Splits across system boundaries need a contract — not a guess. Define types/schema first, then implement on both sides against the same artifact.",
		distractorRationales: {
			B: "That's the mega-prompt anti-pattern.",
			C: "Plan mode is broader than this fix.",
			D: "Tests don't substitute for a contract.",
		},
		studyTags: ["hidden-coupling", "contract"],
	},
	{
		id: "fnd-td-10",
		topic: "task-decomposition",
		difficulty: "hard",
		stem: "What's the cheatsheet's '30-second test' for deciding one-shot vs split?",
		choices: [
			{ key: "A", text: "Can you write the code in 30 seconds?" },
			{ key: "B", text: "Can you describe the failure mode in one sentence? If yes, one-shot. If no, you don't know what 'done' looks like — Plan first." },
			{ key: "C", text: "Does the prompt fit in 30 words?" },
			{ key: "D", text: "Has the file been edited in the last 30 days?" },
		],
		correct: "B",
		explanation:
			"From the closing line: 'Before you hit Enter: can you describe the failure mode in one sentence?' If yes, you've earned the one-shot. If no, the request is fuzzy and Plan should come first.",
		distractorRationales: {
			A: "Misreads the test — it's about specification, not typing speed.",
			C: "Word count is unrelated.",
			D: "File age isn't the criterion.",
		},
		studyTags: ["30-second-test"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 07 · Cursor Modes
// Source: cheatsheets/cursor-modes.pdf
// ──────────────────────────────────────────────────────────────────────

const CURSOR_MODES_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-cm-1",
		topic: "cursor-modes",
		difficulty: "easy",
		stem: "Which Cursor mode is read-only Q&A about your codebase?",
		choices: [
			{ key: "A", text: "Tab." },
			{ key: "B", text: "Ask." },
			{ key: "C", text: "Agent." },
			{ key: "D", text: "Inline Edit." },
		],
		correct: "B",
		explanation:
			"Ask is read-only Q&A. Use it before touching unfamiliar code, for blast-radius questions, to surface existing utilities and design intent. Switch out of Ask when you're ready to write.",
		distractorRationales: {
			A: "Tab is autocomplete-as-you-type.",
			C: "Agent reads, edits, runs.",
			D: "Inline Edit edits at the cursor.",
		},
		studyTags: ["ask", "modes"],
	},
	{
		id: "fnd-cm-2",
		topic: "cursor-modes",
		difficulty: "easy",
		stem: "Which mode is the autonomous one — reads, edits, runs, iterates?",
		choices: [
			{ key: "A", text: "Ask." },
			{ key: "B", text: "Tab." },
			{ key: "C", text: "Agent." },
			{ key: "D", text: "Plan." },
		],
		correct: "C",
		explanation:
			"Agent: autonomous — reads, edits, runs, iterates. Use when outcome is clearly defined, change spans multiple files, and you can give it a spec (failing test, types, behavior).",
		distractorRationales: {
			A: "Read-only.",
			B: "Autocomplete only.",
			D: "Research → editable plan; doesn't execute by itself.",
		},
		studyTags: ["agent", "modes"],
	},
	{
		id: "fnd-cm-3",
		topic: "cursor-modes",
		difficulty: "easy",
		stem: "Which mode is for surgical edits at the cursor (Cmd+K)?",
		choices: [
			{ key: "A", text: "Inline Edit." },
			{ key: "B", text: "Plan." },
			{ key: "C", text: "Debug." },
			{ key: "D", text: "Tab." },
		],
		correct: "A",
		explanation:
			"Inline Edit (Cmd+K): surgical edits at the cursor. Use when you can point at what needs to change, fits in one sentence and one location, doesn't cross files. Flow: Select → Cmd+K → describe → accept.",
		distractorRationales: {
			B: "Plan is for ambiguous, cross-cutting work.",
			C: "Debug is purpose-built for failure diagnosis.",
			D: "Tab is autocomplete.",
		},
		studyTags: ["inline-edit", "cmd-k"],
	},
	{
		id: "fnd-cm-4",
		topic: "cursor-modes",
		difficulty: "medium",
		stem: "Per the 'Which mode, quickly' picker: 'If requirements are ambiguous or cross-cutting' — which mode?",
		choices: [
			{ key: "A", text: "Ask." },
			{ key: "B", text: "Tab." },
			{ key: "C", text: "Plan." },
			{ key: "D", text: "Inline Edit." },
		],
		correct: "C",
		explanation:
			"From the picker: 'If requirements are ambiguous or cross-cutting → reach for Plan.' Plan is research → questions → editable plan → execute, with explicit human review of the plan before code.",
		distractorRationales: {
			A: "Ask is for understanding existing code, not planning new work.",
			B: "Tab is mechanical.",
			D: "Inline Edit is for one-sentence changes.",
		},
		studyTags: ["plan", "modes"],
	},
	{
		id: "fnd-cm-5",
		topic: "cursor-modes",
		difficulty: "medium",
		stem: "Per the picker: 'If tests are red or the terminal threw an error' — which mode?",
		choices: [
			{ key: "A", text: "Ask." },
			{ key: "B", text: "Agent." },
			{ key: "C", text: "Debug." },
			{ key: "D", text: "Tab." },
		],
		correct: "C",
		explanation:
			"Debug mode is purpose-built error diagnosis: trigger 'Debug with AI' from the failure output. The cheatsheet calls Debug mode 'underused' and notes: 'reach for it before opening Ask' on test failures.",
		distractorRationales: {
			A: "Ask is fine but Debug is the cheatsheet's recommendation.",
			B: "Agent is for fixing — Debug is for diagnosing first.",
			D: "Tab can't help with errors.",
		},
		studyTags: ["debug", "modes"],
	},
	{
		id: "fnd-cm-6",
		topic: "cursor-modes",
		difficulty: "medium",
		stem: "Per the cheatsheet, what's the keyboard shortcut to switch chat mode (Ask · Agent · Plan · Debug)?",
		choices: [
			{ key: "A", text: "Cmd+M." },
			{ key: "B", text: "Shift+Tab." },
			{ key: "C", text: "Cmd+Shift+P." },
			{ key: "D", text: "Cmd+/." },
		],
		correct: "B",
		explanation:
			"Shift+Tab cycles the chat mode. The cheatsheet shows it next to Ask, Agent, and Plan as the entry to each.",
		distractorRationales: {
			A: "Not bound.",
			C: "Command palette.",
			D: "Toggles inline suggestions.",
		},
		studyTags: ["shortcut", "shift-tab"],
	},
	{
		id: "fnd-cm-7",
		topic: "cursor-modes",
		difficulty: "medium",
		stem: "Watch-out for Agent — what does the cheatsheet emphasize?",
		choices: [
			{ key: "A", text: "Always pin a single model." },
			{ key: "B", text: "Say what NOT to touch. Checkpoint any wrong turn." },
			{ key: "C", text: "Disable @-mentions." },
			{ key: "D", text: "Run only one tool call per session." },
		],
		correct: "B",
		explanation:
			"Agent's watch-out: 'say what NOT to touch. Checkpoint any wrong turn.' Constraints prevent overshoot; checkpoints are cheap rollback when it does happen.",
		distractorRationales: {
			A: "Model selection is independent.",
			C: "@-mentions are core to scoping.",
			D: "Iteration is the strength.",
		},
		studyTags: ["agent", "checkpoints", "constraints"],
	},
	{
		id: "fnd-cm-8",
		topic: "cursor-modes",
		difficulty: "medium",
		stem: "Per the picker: 'If the outcome is clear and it spans files' — which mode?",
		choices: [
			{ key: "A", text: "Inline Edit." },
			{ key: "B", text: "Tab." },
			{ key: "C", text: "Agent." },
			{ key: "D", text: "Ask." },
		],
		correct: "C",
		explanation:
			"From the picker. Agent's sweet spot is multi-file work with a clear outcome — give it a spec (failing test, types, behavior) and let it iterate.",
		distractorRationales: {
			A: "Inline Edit doesn't cross files.",
			B: "Tab is single-line.",
			D: "Ask can't edit.",
		},
		studyTags: ["agent", "modes"],
	},
	{
		id: "fnd-cm-9",
		topic: "cursor-modes",
		difficulty: "medium",
		stem: "Per the picker: 'If you need 20+ files of context at once' — which combo?",
		choices: [
			{ key: "A", text: "Ask + Plan." },
			{ key: "B", text: "Tab + Inline Edit." },
			{ key: "C", text: "Agent + Max Mode." },
			{ key: "D", text: "Plan + Debug." },
		],
		correct: "C",
		explanation:
			"From the picker: 'If you need 20+ files of context at once → reach for Agent + Max Mode.' Max Mode raises the context-window ceiling without changing the model's quality.",
		distractorRationales: {
			A: "Doesn't address context ceiling.",
			B: "Tab and Inline Edit don't span files.",
			D: "Plan + Debug doesn't touch context budget.",
		},
		studyTags: ["max-mode", "agent"],
	},
	{
		id: "fnd-cm-10",
		topic: "cursor-modes",
		difficulty: "hard",
		stem: "The cheatsheet's closing line says 'Context is a budget.' Which @-mention does NOT appear in the cheatsheet's list of context surfaces?",
		choices: [
			{ key: "A", text: "@file." },
			{ key: "B", text: "@folder." },
			{ key: "C", text: "@symbol." },
			{ key: "D", text: "@user." },
		],
		correct: "D",
		explanation:
			"The cheatsheet lists: @file, @folder, @symbol, @terminal, @past chats, @branch. There's no @user. Adding @-mentions is how you spend the context budget intentionally.",
		distractorRationales: {
			A: "Listed.",
			B: "Listed.",
			C: "Listed.",
		},
		studyTags: ["@-mentions", "context-budget"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 08 · Cursor ↔ JetBrains
// Source: cheatsheets/cursor-vs-jetbrains.pdf
// ──────────────────────────────────────────────────────────────────────

const CURSOR_JETBRAINS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-cj-1",
		topic: "cursor-vs-jetbrains",
		difficulty: "easy",
		stem: "What is the JetBrains equivalent of Cursor's Agent mode?",
		choices: [
			{ key: "A", text: "AI Assistant chat." },
			{ key: "B", text: "Junie." },
			{ key: "C", text: "Local History." },
			{ key: "D", text: "Code With Me." },
		],
		correct: "B",
		explanation:
			"Junie is JetBrains' agent — a separate product from AI Assistant. Reads, edits, runs terminal, iterates. Closer to Cursor's Agent than AI Assistant chat is.",
		distractorRationales: {
			A: "AI Assistant is closer to Ask + Cmd+K.",
			C: "Local History is rollback, not agent.",
			D: "Pair-programming feature, not AI.",
		},
		studyTags: ["junie", "mapping"],
	},
	{
		id: "fnd-cj-2",
		topic: "cursor-vs-jetbrains",
		difficulty: "easy",
		stem: "What is the JetBrains equivalent of Cursor's Ask mode?",
		choices: [
			{ key: "A", text: "Junie." },
			{ key: "B", text: "AI Assistant chat (read-only side panel)." },
			{ key: "C", text: "Refactor This." },
			{ key: "D", text: "Run Configuration." },
		],
		correct: "B",
		explanation:
			"AI Assistant chat is JB's side-panel Q&A — read-only unless you trigger an AI Action from it. Closest to Cursor's Ask.",
		distractorRationales: {
			A: "Junie is the agent (Cursor Agent equivalent).",
			C: "Refactor This is structural editing, not chat.",
			D: "Build/run system, unrelated.",
		},
		studyTags: ["ai-assistant", "ask", "mapping"],
	},
	{
		id: "fnd-cj-3",
		topic: "cursor-vs-jetbrains",
		difficulty: "medium",
		stem: "What's the cross-tool, repo-root config file the cheatsheet recommends because both Cursor and Junie pick it up?",
		choices: [
			{ key: "A", text: ".cursor/rules/*.mdc." },
			{ key: "B", text: "AGENTS.md." },
			{ key: "C", text: ".idea/workspace.xml." },
			{ key: "D", text: ".vscode/settings.json." },
		],
		correct: "B",
		explanation:
			"AGENTS.md sits at the repo root, plain Markdown, tool-agnostic — Cursor reads it, Junie reads it. The cheatsheet calls it 'the most portable surface.'",
		distractorRationales: {
			A: ".mdc is Cursor-specific.",
			C: "JetBrains workspace config, not AI rules.",
			D: "VS Code settings.",
		},
		studyTags: ["agents-md", "portability"],
	},
	{
		id: "fnd-cj-4",
		topic: "cursor-vs-jetbrains",
		difficulty: "medium",
		stem: "Cursor's .cursor/rules/ (.mdc files) — what's the JetBrains equivalent and the gotcha?",
		choices: [
			{ key: "A", text: "Custom project instructions in Settings → AI Assistant → Project Prompts; format and activation rules differ, no exact mdc equivalent." },
			{ key: "B", text: "JetBrains supports .mdc natively." },
			{ key: "C", text: "There is no equivalent — JetBrains has no rules surface at all." },
			{ key: "D", text: "AGENTS.md replaces both — they're identical." },
		],
		correct: "A",
		explanation:
			"JB's equivalent is Custom Project Instructions under AI Assistant settings. File format and activation rules differ — no exact .mdc equivalent. The cheatsheet's recommendation: use AGENTS.md for portability.",
		distractorRationales: {
			B: "JB doesn't natively support .mdc.",
			C: "Equivalent exists — different shape.",
			D: "AGENTS.md is portable but isn't identical to .mdc.",
		},
		studyTags: ["rules", "mapping"],
	},
	{
		id: "fnd-cj-5",
		topic: "cursor-vs-jetbrains",
		difficulty: "medium",
		stem: "How do you trigger the equivalent of Cursor's Cmd+K (Inline Edit) in JetBrains?",
		choices: [
			{ key: "A", text: "Cmd+K (same shortcut)." },
			{ key: "B", text: "Select code → Alt+Enter → AI Actions → 'Edit with AI.'" },
			{ key: "C", text: "Right-click → Refactor → Rename." },
			{ key: "D", text: "Cmd+Shift+I." },
		],
		correct: "B",
		explanation:
			"JetBrains: Select code → Alt+Enter → AI Actions → 'Edit with AI.' Same surgical spirit, different keystroke path. Cmd+K isn't bound to AI in JB.",
		distractorRationales: {
			A: "Same shortcut doesn't carry over.",
			C: "Standard refactor, not AI edit.",
			D: "Not the AI edit binding.",
		},
		studyTags: ["inline-edit", "alt-enter"],
	},
	{
		id: "fnd-cj-6",
		topic: "cursor-vs-jetbrains",
		difficulty: "medium",
		stem: "Per the gotchas, the spend model differs between Cursor and JetBrains. What's the difference?",
		choices: [
			{ key: "A", text: "JetBrains has cheaper output tokens." },
			{ key: "B", text: "JB has no Auto-router discount, no in-house Composer 2 — JB AI is subscription+quota; the model picker is the whole control. Max Mode shows up as a 'long context' toggle on some models." },
			{ key: "C", text: "JetBrains charges per file." },
			{ key: "D", text: "JetBrains is free for AI features." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's gotcha: JetBrains has no Auto-router discount and no Composer 2. JB AI is subscription+quota. Max Mode equivalent shows up as 'long context' on some models.",
		distractorRationales: {
			A: "Pricing structure differs broadly; output tokens aren't always cheaper.",
			C: "Per-file billing isn't the model.",
			D: "Subscription, not free.",
		},
		studyTags: ["spend", "mapping"],
	},
	{
		id: "fnd-cj-7",
		topic: "cursor-vs-jetbrains",
		difficulty: "medium",
		stem: "Per the cheatsheet, AI Assistant and Junie are…",
		choices: [
			{ key: "A", text: "The same product with two names." },
			{ key: "B", text: "Bundled but separate — AI Assistant is chat + AI Actions + inline completion (most like Cursor's Ask + Cmd+K); Junie is the agent." },
			{ key: "C", text: "Competing third-party plugins." },
			{ key: "D", text: "Available only on Ultimate licenses." },
		],
		correct: "B",
		explanation:
			"From the 'Two JetBrains products, one IDE' callout: bundled but separate. AI Assistant ≈ Ask + Cmd+K. Junie ≈ Agent. Reads AGENTS.md.",
		distractorRationales: {
			A: "Distinct products with distinct surfaces.",
			C: "Both are JetBrains-published.",
			D: "Licensing isn't the cheatsheet's framing.",
		},
		studyTags: ["junie", "ai-assistant"],
	},
	{
		id: "fnd-cj-8",
		topic: "cursor-vs-jetbrains",
		difficulty: "medium",
		stem: "MCP servers — how does JetBrains support them?",
		choices: [
			{ key: "A", text: "Not supported." },
			{ key: "B", text: "Native MCP client in both AI Assistant and Junie. Same config pattern as Cursor (UI to add servers differs)." },
			{ key: "C", text: "Only via a third-party plugin." },
			{ key: "D", text: "Only on Linux." },
		],
		correct: "B",
		explanation:
			"JetBrains supports MCP natively in both AI Assistant and Junie. Same config pattern as Cursor; the UI to add servers differs.",
		distractorRationales: {
			A: "Supported.",
			C: "Native support.",
			D: "Cross-platform.",
		},
		studyTags: ["mcp", "mapping"],
	},
	{
		id: "fnd-cj-9",
		topic: "cursor-vs-jetbrains",
		difficulty: "medium",
		stem: "Per the gotchas, hooks + checkpoints diverge. What's the cheatsheet's recommendation?",
		choices: [
			{ key: "A", text: "Re-implement Cursor's stop-hook in JetBrains." },
			{ key: "B", text: "The stop-hook TDD loop is Cursor-specific — use Junie's plan + retry budget instead. For rollback, JB's Local History is richer than Cursor checkpoints." },
			{ key: "C", text: "Avoid TDD on JetBrains entirely." },
			{ key: "D", text: "Use Git only — no IDE rollback." },
		],
		correct: "B",
		explanation:
			"From the gotcha: stop-hook is Cursor-specific. Use Junie's plan + retry budget for the same intent. For rollback, JB's Local History is actually richer than Cursor's checkpoints.",
		distractorRationales: {
			A: "Not directly portable.",
			C: "TDD is fine on JB — just via Junie's mechanism.",
			D: "JB's Local History is the better rollback.",
		},
		studyTags: ["hooks", "local-history"],
	},
	{
		id: "fnd-cj-10",
		topic: "cursor-vs-jetbrains",
		difficulty: "hard",
		stem: "A team uses both Cursor and JetBrains. The cheatsheet says: which surface should they invest most in for portable shared standards?",
		choices: [
			{ key: "A", text: ".cursor/rules/" },
			{ key: "B", text: "AGENTS.md (good news: Junie picks it up at the repo root — one file, two tools)." },
			{ key: "C", text: ".idea/jetbrains-rules.md." },
			{ key: "D", text: "User Rules in personal IDE settings." },
		],
		correct: "B",
		explanation:
			"AGENTS.md is the most portable surface — Junie reads it; Cursor reads it. One file, two tools. The cheatsheet recommends keeping team standards there for cross-IDE shops.",
		distractorRationales: {
			A: "Cursor-only.",
			C: "Made-up location.",
			D: "Personal — not team-shared.",
		},
		studyTags: ["agents-md", "portability"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 09 · Rules & Repo Config
// Source: cheatsheets/rules-and-repo-config.pdf
// ──────────────────────────────────────────────────────────────────────

const RULES_REPO_CONFIG_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-rr-1",
		topic: "rules-and-repo-config",
		difficulty: "easy",
		stem: "What does Always Apply do for a .cursor/rules/ rule?",
		choices: [
			{ key: "A", text: "Activates only when @-mentioned." },
			{ key: "B", text: "Activates every chat session, unconditionally." },
			{ key: "C", text: "Activates only on file save." },
			{ key: "D", text: "Activates on the next IDE restart." },
		],
		correct: "B",
		explanation:
			"Always Apply (alwaysApply: true) activates every chat session, unconditionally. Use for team-specific standards (TypeScript, bun, vitest). Note: every teammate consumes context on every chat — keep short.",
		distractorRationales: {
			A: "That's Manual.",
			C: "No save-trigger.",
			D: "Restart-trigger doesn't exist.",
		},
		studyTags: ["always-apply", "rule-activation"],
	},
	{
		id: "fnd-rr-2",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "Apply Intelligently — when does it activate, and what's the silent failure mode?",
		choices: [
			{ key: "A", text: "When Agent reads the description and judges it relevant. Without a description, the rule silently does nothing." },
			{ key: "B", text: "On every keystroke." },
			{ key: "C", text: "When tests fail." },
			{ key: "D", text: "Never — it's deprecated." },
		],
		correct: "A",
		explanation:
			"Apply Intelligently (alwaysApply: false, no globs): Agent reads the rule's description and decides if it's relevant. The cheatsheet's note: 'without a description, the rule silently does nothing.'",
		distractorRationales: {
			B: "Not a keystroke trigger.",
			C: "Test-state independent.",
			D: "Active rule type.",
		},
		studyTags: ["apply-intelligently", "description"],
	},
	{
		id: "fnd-rr-3",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "File-Scoped (glob) rules activate when…",
		choices: [
			{ key: "A", text: "Random — non-deterministic activation." },
			{ key: "B", text: "When files matching the glob are part of the conversation." },
			{ key: "C", text: "When the user explicitly types the rule name." },
			{ key: "D", text: "When git status shows changes." },
		],
		correct: "B",
		explanation:
			"File-Scoped rules use globs (e.g., 'src/api/**/*.ts') and activate when matching files are in the conversation context. Narrowest-scope rule type.",
		distractorRationales: {
			A: "Globs are deterministic.",
			C: "That's Manual.",
			D: "Git-state independent.",
		},
		studyTags: ["file-scoped", "globs"],
	},
	{
		id: "fnd-rr-4",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "Manual (@-mention) rules activate when…",
		choices: [
			{ key: "A", text: "Files match a glob." },
			{ key: "B", text: "You pull the rule in by name with @rule-name in Agent chat." },
			{ key: "C", text: "Always, on every chat." },
			{ key: "D", text: "When Agent decides via the rule's description." },
		],
		correct: "B",
		explanation:
			"Manual rules require explicit @-mention. The cheatsheet calls them 'saved playbooks' — step-by-step workflows or runbooks you pull in on demand.",
		distractorRationales: {
			A: "That's File-Scoped.",
			C: "That's Always Apply.",
			D: "That's Apply Intelligently.",
		},
		studyTags: ["manual", "at-mention"],
	},
	{
		id: "fnd-rr-5",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "Per the cheatsheet's two-question flow: 'Need to work across multiple AI tools?' What's the answer?",
		choices: [
			{ key: "A", text: ".cursor/rules/" },
			{ key: "B", text: "AGENTS.md — plain Markdown at repo root, tool-agnostic (Cursor, Claude Code, Codex, Copilot)." },
			{ key: "C", text: "User Rules." },
			{ key: "D", text: "Team Rules in Enterprise admin panel." },
		],
		correct: "B",
		explanation:
			"AGENTS.md is the cross-tool answer. Plain Markdown, repo root, tool-agnostic. Read by Cursor, Claude Code, Codex, Copilot, and Junie.",
		distractorRationales: {
			A: ".cursor/rules/ is Cursor-only.",
			C: "User Rules are personal, not team.",
			D: "Team Rules apply within Cursor only.",
		},
		studyTags: ["agents-md", "cross-tool"],
	},
	{
		id: "fnd-rr-6",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "Per the two-question flow: 'Need conditional activation?' What's the answer?",
		choices: [
			{ key: "A", text: "AGENTS.md — supports glob-scoped rules." },
			{ key: "B", text: ".cursor/rules/ — .mdc files with frontmatter; glob-scoped, agent-decided, or manual triggers." },
			{ key: "C", text: "Always-apply only — there's no conditional support." },
			{ key: "D", text: "User Rules with @-mention." },
		],
		correct: "B",
		explanation:
			".cursor/rules/ supports the conditional triggers (glob-scoped, agent-decided via description, manual @-mention). AGENTS.md is plain Markdown — no frontmatter conditions.",
		distractorRationales: {
			A: "AGENTS.md doesn't support conditions.",
			C: "Cursor supports conditional activation.",
			D: "User Rules don't have project-scoped conditional triggers like rules.",
		},
		studyTags: ["mdc", "frontmatter"],
	},
	{
		id: "fnd-rr-7",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "Per the cheatsheet's best practices: 'When to add a rule?'",
		choices: [
			{ key: "A", text: "Pre-emptively — write rules before any code." },
			{ key: "B", text: "Agent makes the same mistake twice — write the correction as a rule, not before." },
			{ key: "C", text: "Whenever a teammate joins." },
			{ key: "D", text: "Once per quarter, regardless of triggers." },
		],
		correct: "B",
		explanation:
			"Earn your rules: 'When Agent makes the same mistake twice — write the correction as a rule, not before.' Pre-emptive rules accumulate noise without solving real failures.",
		distractorRationales: {
			A: "Premature; bloats system prompt.",
			C: "Not a useful trigger.",
			D: "Calendar isn't the heuristic.",
		},
		studyTags: ["best-practices", "earn"],
	},
	{
		id: "fnd-rr-8",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "Per the cheatsheet, what's the rule precedence hierarchy?",
		choices: [
			{ key: "A", text: "User > project > team." },
			{ key: "B", text: "Team rules (Enterprise) > project rules (.cursor/rules/) > user rules (your prefs). Higher tier wins on conflict." },
			{ key: "C", text: "Project > team > user." },
			{ key: "D", text: "User Rules always win." },
		],
		correct: "B",
		explanation:
			"Hierarchy from the cheatsheet: team (Enterprise) > project (.cursor/rules/) > user (personal prefs). Higher tier wins on conflict.",
		distractorRationales: {
			A: "Inverted — team wins, not user.",
			C: "Misordered.",
			D: "User Rules are lowest priority.",
		},
		studyTags: ["hierarchy"],
	},
	{
		id: "fnd-rr-9",
		topic: "rules-and-repo-config",
		difficulty: "medium",
		stem: "An important constraint the cheatsheet calls out: rules apply to which surfaces?",
		choices: [
			{ key: "A", text: "Every Cursor surface — Tab, Cmd+K, Agent." },
			{ key: "B", text: "Agent chat only. They don't affect Inline Edit (Cmd+K) or Cursor Tab." },
			{ key: "C", text: "Tab autocomplete only." },
			{ key: "D", text: "Only when AI Assistant is open in a side panel." },
		],
		correct: "B",
		explanation:
			"Important: rules apply to Agent chat only. Cmd+K (Inline Edit) and Tab don't pick up rules. Plan accordingly when designing rule content.",
		distractorRationales: {
			A: "Common misconception; cheatsheet explicitly excludes Tab/Cmd+K.",
			C: "Inverse of true.",
			D: "AI Assistant is JetBrains terminology.",
		},
		studyTags: ["agent-only", "cmd-k", "tab"],
	},
	{
		id: "fnd-rr-10",
		topic: "rules-and-repo-config",
		difficulty: "hard",
		stem: "Per the cheatsheet, what's the fast way to draft a new rule?",
		choices: [
			{ key: "A", text: "Open Settings → Rules → New." },
			{ key: "B", text: "Use /create-rule <your instruction> in Agent chat — it drafts the .mdc file for you." },
			{ key: "C", text: "Edit ~/.cursor/global.mdc directly." },
			{ key: "D", text: "Run a CLI installer." },
		],
		correct: "B",
		explanation:
			"From the cheatsheet's closing line: 'Create rules fast with /create-rule <your instruction> in Agent chat — it drafts the .mdc file for you.' Bootstraps frontmatter and structure for you.",
		distractorRationales: {
			A: "Slower; ad-hoc UI.",
			C: "Manual editing works but isn't the fast path the cheatsheet calls out.",
			D: "Not the workflow.",
		},
		studyTags: ["create-rule"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 10 · Keyboard Shortcuts
// Source: cheatsheets/keyboard-shortcuts.pdf
// ──────────────────────────────────────────────────────────────────────

const KEYBOARD_SHORTCUTS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-ks-1",
		topic: "keyboard-shortcuts",
		difficulty: "easy",
		stem: "What does Cmd+K do in Cursor?",
		choices: [
			{ key: "A", text: "Open Ask chat." },
			{ key: "B", text: "Inline Edit at the cursor or selection." },
			{ key: "C", text: "Open Agent chat." },
			{ key: "D", text: "Toggle inline suggestions." },
		],
		correct: "B",
		explanation:
			"Cmd+K is Inline Edit — surgical edit at the cursor or selection. Single file, no chat history. The fastest way to point at something and rewrite it in place.",
		distractorRationales: {
			A: "That's Cmd+L.",
			C: "That's Cmd+I.",
			D: "That's Cmd+/.",
		},
		studyTags: ["cmd-k", "inline-edit"],
	},
	{
		id: "fnd-ks-2",
		topic: "keyboard-shortcuts",
		difficulty: "easy",
		stem: "Cmd+L opens which chat surface?",
		choices: [
			{ key: "A", text: "Agent." },
			{ key: "B", text: "Ask — read-only Q&A about the codebase." },
			{ key: "C", text: "Plan." },
			{ key: "D", text: "Debug." },
		],
		correct: "B",
		explanation:
			"Cmd+L opens Ask. Read-only — the model sees your code but can't change it. Best before you write.",
		distractorRationales: {
			A: "Cmd+I.",
			C: "Plan is reached via Shift+Tab from a chat.",
			D: "Triggered from failure output.",
		},
		studyTags: ["cmd-l", "ask"],
	},
	{
		id: "fnd-ks-3",
		topic: "keyboard-shortcuts",
		difficulty: "easy",
		stem: "Cmd+I opens which chat surface?",
		choices: [
			{ key: "A", text: "Ask." },
			{ key: "B", text: "Inline Edit." },
			{ key: "C", text: "Agent — autonomous mode." },
			{ key: "D", text: "Plan." },
		],
		correct: "C",
		explanation:
			"Cmd+I opens Agent (autonomous mode). Multi-file edits, terminal commands, iteration. The most powerful surface, the most expensive.",
		distractorRationales: {
			A: "Cmd+L.",
			B: "Cmd+K.",
			D: "Plan is via Shift+Tab.",
		},
		studyTags: ["cmd-i", "agent"],
	},
	{
		id: "fnd-ks-4",
		topic: "keyboard-shortcuts",
		difficulty: "medium",
		stem: "Cmd+K vs Cmd+L vs Cmd+I — per the cheatsheet, which is the most powerful and most expensive?",
		choices: [
			{ key: "A", text: "Cmd+K — Inline Edit." },
			{ key: "B", text: "Cmd+L — Ask." },
			{ key: "C", text: "Cmd+I — Agent." },
			{ key: "D", text: "All three are equal." },
		],
		correct: "C",
		explanation:
			"From the cheatsheet's callout: 'Cmd+I Agent. Multi-file edits, terminal commands, iteration. The most powerful, the most expensive.'",
		distractorRationales: {
			A: "Cmd+K is surgical and cheap.",
			B: "Cmd+L is read-only.",
			D: "Distinct in cost and power.",
		},
		studyTags: ["agent", "cost"],
	},
	{
		id: "fnd-ks-5",
		topic: "keyboard-shortcuts",
		difficulty: "medium",
		stem: "Which @-mention attaches the latest terminal output to the chat?",
		choices: [
			{ key: "A", text: "@file." },
			{ key: "B", text: "@symbol." },
			{ key: "C", text: "@terminal." },
			{ key: "D", text: "@docs." },
		],
		correct: "C",
		explanation:
			"@terminal attaches the latest terminal output. Useful when you want to feed an error message or test output into the chat without copy-pasting.",
		distractorRationales: {
			A: "Specific file.",
			B: "Function/class/type.",
			D: "Public documentation source.",
		},
		studyTags: ["@terminal"],
	},
	{
		id: "fnd-ks-6",
		topic: "keyboard-shortcuts",
		difficulty: "medium",
		stem: "Per the cheatsheet, the @-mention 'use sparingly' is which one?",
		choices: [
			{ key: "A", text: "@file." },
			{ key: "B", text: "@codebase — broad codebase search (use sparingly)." },
			{ key: "C", text: "@docs." },
			{ key: "D", text: "@past chats." },
		],
		correct: "B",
		explanation:
			"@codebase pulls a broad RAG-style search across the whole repo. The cheatsheet labels it 'use sparingly' — burns context budget fast and dilutes signal when narrower @-mentions would suffice.",
		distractorRationales: {
			A: "Targeted; cheap.",
			C: "Targeted; cheap.",
			D: "Useful but not the sparing-use one.",
		},
		studyTags: ["@codebase", "context-budget"],
	},
	{
		id: "fnd-ks-7",
		topic: "keyboard-shortcuts",
		difficulty: "medium",
		stem: "What does /restore do in chat?",
		choices: [
			{ key: "A", text: "Restart Cursor." },
			{ key: "B", text: "List checkpoints inline (Agent's safety net)." },
			{ key: "C", text: "Clear the chat." },
			{ key: "D", text: "Reload the file from disk." },
		],
		correct: "B",
		explanation:
			"/restore lists checkpoints inline. Click a checkpoint to preview that state; Restore snaps files back. Cheap to use, expensive to skip.",
		distractorRationales: {
			A: "Different action.",
			C: "/clear.",
			D: "Editor-level action.",
		},
		studyTags: ["restore", "checkpoint"],
	},
	{
		id: "fnd-ks-8",
		topic: "keyboard-shortcuts",
		difficulty: "medium",
		stem: "Per the cheatsheet, what does /clear do?",
		choices: [
			{ key: "A", text: "Wipes checkpoints permanently." },
			{ key: "B", text: "Fresh chat without losing checkpoints." },
			{ key: "C", text: "Disables Agent mode." },
			{ key: "D", text: "Forces a model swap." },
		],
		correct: "B",
		explanation:
			"/clear starts a fresh chat without losing checkpoints. Useful when the conversation has anchored on a wrong assumption — start fresh, keep your rollback.",
		distractorRationales: {
			A: "Inverse — checkpoints survive.",
			C: "Mode-independent.",
			D: "Doesn't touch model selection.",
		},
		studyTags: ["clear", "fresh-chat"],
	},
	{
		id: "fnd-ks-9",
		topic: "keyboard-shortcuts",
		difficulty: "medium",
		stem: "Cmd+Shift+L does what?",
		choices: [
			{ key: "A", text: "Locks the editor." },
			{ key: "B", text: "Adds the current selection to chat as context." },
			{ key: "C", text: "Logs out of Cursor." },
			{ key: "D", text: "Toggles light mode." },
		],
		correct: "B",
		explanation:
			"Cmd+Shift+L adds the current selection to chat as context. Faster than copy-pasting or @-mentioning a whole file when you want exactly the highlighted region.",
		distractorRationales: {
			A: "Not bound.",
			C: "Not bound.",
			D: "Not bound.",
		},
		studyTags: ["cmd-shift-l", "selection"],
	},
	{
		id: "fnd-ks-10",
		topic: "keyboard-shortcuts",
		difficulty: "hard",
		stem: "The cheatsheet's closing tip: 'If you can name it, you can bind it.' Where do you bind a custom shortcut?",
		choices: [
			{ key: "A", text: "Cmd+K → bind." },
			{ key: "B", text: "Settings → Keyboard Shortcuts (after finding the command via Cmd+Shift+P)." },
			{ key: "C", text: ".cursor/rules/keyboard.mdc." },
			{ key: "D", text: "AGENTS.md." },
		],
		correct: "B",
		explanation:
			"Cmd+Shift+P opens the command palette — every command Cursor exposes is searchable. Once you find the command, bind a key under Settings → Keyboard Shortcuts.",
		distractorRationales: {
			A: "Inline Edit doesn't manage shortcuts.",
			C: "Rules don't bind keys.",
			D: "AGENTS.md is content, not bindings.",
		},
		studyTags: ["custom-shortcuts"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 11 · TDD with Agent
// Source: cheatsheets/tdd-with-agent.pdf
// ──────────────────────────────────────────────────────────────────────

const TDD_WITH_AGENT_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-tw-1",
		topic: "tdd-with-agent",
		difficulty: "easy",
		stem: "What is the recommended prompt to give Agent in the TDD-with-Agent loop?",
		choices: [
			{ key: "A", text: "'Write tests and the implementation.'" },
			{ key: "B", text: "'Implement the production code to make these tests pass. Do NOT modify the test files.'" },
			{ key: "C", text: "'Refactor the tests until they pass.'" },
			{ key: "D", text: "'Skip failing tests.'" },
		],
		correct: "B",
		explanation:
			"From the cheatsheet: 'Implement the production code to make these tests pass. Do NOT modify the test files.' The capitalised NOT is intentional — it's the constraint that pins the test as the spec.",
		distractorRationales: {
			A: "Tests already exist and were committed in step 2.",
			C: "Test mutation defeats the loop.",
			D: "Skipping = no signal.",
		},
		studyTags: ["prompt", "tdd"],
	},
	{
		id: "fnd-tw-2",
		topic: "tdd-with-agent",
		difficulty: "easy",
		stem: "Per the cheatsheet's 7-step flow, which step comes BEFORE telling Agent to implement?",
		choices: [
			{ key: "A", text: "Run the tests once to make sure they pass." },
			{ key: "B", text: "Commit the tests as a named rollback point ('tests: add failing X')." },
			{ key: "C", text: "Disable the test runner." },
			{ key: "D", text: "Switch to Plan mode." },
		],
		correct: "B",
		explanation:
			"Step 2 is 'Commit the tests' — named rollback point. Step 3 is 'Tell Agent to implement.' Committing the failing tests means you can always git-checkout back to the spec if Agent goes off the rails.",
		distractorRationales: {
			A: "Inverts — tests should be failing.",
			C: "The runner is the loop.",
			D: "Mode-independent step.",
		},
		studyTags: ["commit-tests", "tdd-flow"],
	},
	{
		id: "fnd-tw-3",
		topic: "tdd-with-agent",
		difficulty: "medium",
		stem: "What does the .cursor/hooks.json stop hook do in the TDD loop?",
		choices: [
			{ key: "A", text: "Stops Agent from ever running the tests." },
			{ key: "B", text: "Runs after Agent stops — runs `bun test`, and if any test fails, sends a follow-up message to Agent with the failure output." },
			{ key: "C", text: "Stops the IDE from launching." },
			{ key: "D", text: "Disables checkpoints." },
		],
		correct: "B",
		explanation:
			"The stop hook fires after Agent finishes a turn. The script runs the tests; if any fail, the output is fed back to Agent as a new message it didn't type. Closes the loop without manual copy-paste.",
		distractorRationales: {
			A: "It triggers them — that's the point.",
			C: "Hook scope is per-Agent-stop.",
			D: "Checkpoints are unaffected.",
		},
		studyTags: ["stop-hook", "test-loop"],
	},
	{
		id: "fnd-tw-4",
		topic: "tdd-with-agent",
		difficulty: "medium",
		stem: "What does loop_limit do in the cheatsheet's hooks.json?",
		choices: [
			{ key: "A", text: "Caps the number of tests Agent can run." },
			{ key: "B", text: "Caps how many times the stop-hook can re-feed Agent before bailing (default 5)." },
			{ key: "C", text: "Sets a token budget per turn." },
			{ key: "D", text: "Limits the number of files Agent can read." },
		],
		correct: "B",
		explanation:
			"loop_limit prevents infinite back-and-forth. After the cap, the loop bails out so a stuck Agent doesn't burn budget forever. Default in the cheatsheet's example: 5.",
		distractorRationales: {
			A: "Not a test count.",
			C: "Not a token cap.",
			D: "Unrelated to file reads.",
		},
		studyTags: ["loop-limit"],
	},
	{
		id: "fnd-tw-5",
		topic: "tdd-with-agent",
		difficulty: "medium",
		stem: "Per the cheatsheet, what is a GOOD fit for the TDD-with-Agent pattern?",
		choices: [
			{ key: "A", text: "UI tweaks and styling." },
			{ key: "B", text: "Exploratory work where intent isn't fixed." },
			{ key: "C", text: "Well-scoped features with clear behavior; codebases with healthy coverage; refactors where you can write characterization tests first." },
			{ key: "D", text: "Anything where tests can't capture intent." },
		],
		correct: "C",
		explanation:
			"From the ✓ Good fit list: well-scoped features, healthy coverage, refactor-with-characterization-tests. Tests must be able to capture intent for the loop to converge.",
		distractorRationales: {
			A: "Listed as ✗ (screenshot review is the loop instead).",
			B: "Listed as ✗.",
			D: "Listed as ✗.",
		},
		studyTags: ["good-fit"],
	},
	{
		id: "fnd-tw-6",
		topic: "tdd-with-agent",
		difficulty: "medium",
		stem: "Which is a POOR fit for TDD-with-Agent per the cheatsheet?",
		choices: [
			{ key: "A", text: "Backend feature with clear input/output contracts." },
			{ key: "B", text: "UI tweaks and styling — screenshot review is the loop, not test failures." },
			{ key: "C", text: "Library refactor with characterization tests." },
			{ key: "D", text: "JSON parser." },
		],
		correct: "B",
		explanation:
			"From ✗ Poor fit: 'UI tweaks and styling (screenshot review is the loop). Anything where tests can't capture intent.' Visual correctness needs eyes, not assertions.",
		distractorRationales: {
			A: "Good fit.",
			C: "Good fit.",
			D: "Good fit (clear behavior + easy tests).",
		},
		studyTags: ["poor-fit", "ui"],
	},
	{
		id: "fnd-tw-7",
		topic: "tdd-with-agent",
		difficulty: "medium",
		stem: "What's a 'Watch for' the cheatsheet flags in TDD-with-Agent?",
		choices: [
			{ key: "A", text: "Tests too small to matter." },
			{ key: "B", text: "Flaky tests (random failures become 'bugs'); coupled tests (fix A, break B); large suites re-running every iteration." },
			{ key: "C", text: "Agent refusing to read tests." },
			{ key: "D", text: "Hooks running too fast." },
		],
		correct: "B",
		explanation:
			"From ⚠ Watch for: flaky tests pollute the signal (Agent chases ghosts), coupled tests cause whack-a-mole, and large suites re-running every iteration tank latency and cost.",
		distractorRationales: {
			A: "Test size isn't the documented concern.",
			C: "Agent reads tests fine.",
			D: "Speed isn't a problem.",
		},
		studyTags: ["flaky-tests", "coupled-tests"],
	},
	{
		id: "fnd-tw-8",
		topic: "tdd-with-agent",
		difficulty: "medium",
		stem: "The cheatsheet calls TDD-with-Agent 'portable across runners.' Which command set does it list?",
		choices: [
			{ key: "A", text: "bun test · npm test · npx jest --no-coverage · python -m pytest · go test ./..." },
			{ key: "B", text: "Only bun test is supported." },
			{ key: "C", text: "Only Vitest is supported." },
			{ key: "D", text: "Cursor handles all runners automatically — no config needed." },
		],
		correct: "A",
		explanation:
			"The cheatsheet's portability note: structure stays the same; swap the test command. Listed: bun test, npm test, npx jest --no-coverage, python -m pytest, go test ./...",
		distractorRationales: {
			B: "Cheatsheet shows portability across many.",
			C: "Multi-runner.",
			D: "You configure the command in test-loop.ts.",
		},
		studyTags: ["portability", "runners"],
	},
	{
		id: "fnd-tw-9",
		topic: "tdd-with-agent",
		difficulty: "medium",
		stem: "Per the cheatsheet, where do .cursor/hooks.json and .cursor/hooks/test-loop.ts live, and how should they be managed?",
		choices: [
			{ key: "A", text: "User-level only — never in the repo." },
			{ key: "B", text: "Both files in the repo, version-controlled — they ship with the project so the team gets the loop on clone." },
			{ key: "C", text: "Generated on first run; ignored by git." },
			{ key: "D", text: "Symlinks to ~/.cursor/." },
		],
		correct: "B",
		explanation:
			"The cheatsheet's note: 'Two files, both version-controlled.' Commit hooks.json and test-loop.ts so every team mate gets the same TDD loop on clone.",
		distractorRationales: {
			A: "User-level isn't shared.",
			C: "Auto-generation isn't the model.",
			D: "Wouldn't survive cross-platform.",
		},
		studyTags: ["version-control", "team"],
	},
	{
		id: "fnd-tw-10",
		topic: "tdd-with-agent",
		difficulty: "hard",
		stem: "Per the cheatsheet, what is the LAST step of the 7-step flow, and why is it called out?",
		choices: [
			{ key: "A", text: "Push to remote." },
			{ key: "B", text: "Review the diff. The review is the point. Slow down." },
			{ key: "C", text: "Run lint." },
			{ key: "D", text: "Update the test names." },
		],
		correct: "B",
		explanation:
			"Step 7: 'Review the diff. The review is the point. Slow down.' Test-green doesn't equal correct; the human-in-the-loop is the calibration.",
		distractorRationales: {
			A: "Push isn't the cheatsheet's emphasis.",
			C: "Lint is independent.",
			D: "Test names should already be set in step 1.",
		},
		studyTags: ["review", "human-in-loop"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// 12 · Debugging Workflows
// Source: cheatsheets/debugging-workflows.pdf
// ──────────────────────────────────────────────────────────────────────

const DEBUGGING_WORKFLOWS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-db-1",
		topic: "debugging-workflows",
		difficulty: "easy",
		stem: "Per the 'Trace it forward' flow, what should you ask the model BEFORE asking for a fix?",
		choices: [
			{ key: "A", text: "Generate a unit test for the function." },
			{ key: "B", text: "Walk me through how this gets called and what state it touches — find the wrong assumption first." },
			{ key: "C", text: "Refactor the code to be cleaner." },
			{ key: "D", text: "Switch to a bigger model." },
		],
		correct: "B",
		explanation:
			"Trace it forward: paste the failing call + stack trace into Ask, and ask the model to walk through how it's called and what state it touches. The cheatsheet's note: 'fixing before tracing leads to whack-a-mole.'",
		distractorRationales: {
			A: "Test generation is downstream of understanding.",
			C: "Refactor doesn't diagnose.",
			D: "Model size doesn't substitute for tracing.",
		},
		studyTags: ["trace-forward"],
	},
	{
		id: "fnd-db-2",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "When tests just started failing on a previously-green branch, which flow does the cheatsheet recommend?",
		choices: [
			{ key: "A", text: "Trace it forward." },
			{ key: "B", text: "Diff it red→green: git diff against last green commit; paste diff + failure into Agent; constrain to revert/patch within the diff." },
			{ key: "C", text: "Reproduce, then fix." },
			{ key: "D", text: "Bisect by hand." },
		],
		correct: "B",
		explanation:
			"Diff it red→green is the right tool when you have a known-good commit and a recent diff. The cheatsheet's watch-out: 'let Agent rewrite half the file and you've lost the bisect signal.'",
		distractorRationales: {
			A: "Useful but heavier than diff-bound.",
			C: "Reproduce-then-fix is for can't-see-the-bug situations.",
			D: "Bisect is for when other flows have failed twice.",
		},
		studyTags: ["diff-red-green"],
	},
	{
		id: "fnd-db-3",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "When a bug is reported but you can't see it locally, the cheatsheet says…",
		choices: [
			{ key: "A", text: "Just patch the suspected line." },
			{ key: "B", text: "Spend the first 10 minutes on a failing test, not on a fix. If you can't reproduce, the report is incomplete — go back." },
			{ key: "C", text: "Ask the reporter for a screen recording." },
			{ key: "D", text: "Ship a feature flag." },
		],
		correct: "B",
		explanation:
			"From Reproduce-then-fix: spend the first 10 min on a failing test that captures the bug. Once red, switch to TDD-with-Agent. The cheatsheet's emphasis: 'fixing what you can't reproduce wastes everyone's time.'",
		distractorRationales: {
			A: "Patching without repro is whack-a-mole.",
			C: "Recording is helpful but the cheatsheet's specific advice is 'failing test first.'",
			D: "Workaround, not a fix.",
		},
		studyTags: ["reproduce", "failing-test"],
	},
	{
		id: "fnd-db-4",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "Print, observe, prune — what's the rule about adding logs via Agent?",
		choices: [
			{ key: "A", text: "Add as many as needed; leave them in production." },
			{ key: "B", text: "Ask Agent for instrumentation only — log statements, not fixes. Run, capture output, paste back. Then have Agent rip the logs out at the end." },
			{ key: "C", text: "Logs are forbidden in modern debugging." },
			{ key: "D", text: "Use the model's internal logs — they auto-stream." },
		],
		correct: "B",
		explanation:
			"The flow: instrument-only, observe, paste output back, then prune. The cheatsheet's watch-out: 'leaving log statements in. Have Agent rip them out at the end.'",
		distractorRationales: {
			A: "Leaving logs in is the anti-pattern.",
			C: "Logs are essential for state/timing.",
			D: "Models don't have observability into your runtime.",
		},
		studyTags: ["instrumentation", "prune"],
	},
	{
		id: "fnd-db-5",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "When AI guesses the wrong cause repeatedly, what does the cheatsheet recommend?",
		choices: [
			{ key: "A", text: "Try the same prompt again with a bigger model." },
			{ key: "B", text: "git bisect — do it yourself, faster than convincing the agent. Land on the offending commit, then narrow to a hunk and paste that into Ask." },
			{ key: "C", text: "Add more @-mentions." },
			{ key: "D", text: "Reboot the IDE." },
		],
		correct: "B",
		explanation:
			"Bisect by hand: when AI is repeatedly wrong, the manual git bisect is faster than continuing to negotiate. Once you have the offending commit, narrow to a hunk and feed the focused diff back to Ask.",
		distractorRationales: {
			A: "Anti-pattern: 'Same prompt, twice' is on the anti-patterns list.",
			C: "More context isn't always the fix.",
			D: "Joke distractor.",
		},
		studyTags: ["bisect"],
	},
	{
		id: "fnd-db-6",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "Per the cheatsheet, Cursor's Debug mode is…",
		choices: [
			{ key: "A", text: "A clone of Ask with a different icon." },
			{ key: "B", text: "Purpose-built failure helper — trigger from the error itself ('Debug with AI' on red output); more focused than Ask; sees the failure context automatically." },
			{ key: "C", text: "An external tool that needs separate install." },
			{ key: "D", text: "Read-write — can edit files like Agent." },
		],
		correct: "B",
		explanation:
			"Debug mode is a purpose-built failure helper. It auto-attaches the failure context. Read-only — switch to Agent when you've found the fix. The cheatsheet calls it underused.",
		distractorRationales: {
			A: "Distinct mode with auto-context.",
			C: "Native to Cursor.",
			D: "Read-only.",
		},
		studyTags: ["debug-mode"],
	},
	{
		id: "fnd-db-7",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "From the triage table: 'Behavior is wrong but no error.' Which flow?",
		choices: [
			{ key: "A", text: "Bisect manually." },
			{ key: "B", text: "Ask first — have the model trace the data path." },
			{ key: "C", text: "Plan Mode." },
			{ key: "D", text: "Debug mode." },
		],
		correct: "B",
		explanation:
			"From the triage table: 'Behavior is wrong but no error → Ask first — have the model trace the data path.' Without an error, you don't have an entry point — Ask helps surface where the data diverges.",
		distractorRationales: {
			A: "Bisect is for when you have a known-good baseline.",
			C: "Plan is for state-leak Heisenbugs.",
			D: "Debug needs a failure event.",
		},
		studyTags: ["triage", "no-error"],
	},
	{
		id: "fnd-db-8",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "From the triage table: 'Heisenbug — passes alone, fails together.' Which flow?",
		choices: [
			{ key: "A", text: "Debug Mode." },
			{ key: "B", text: "Plan Mode — state-leak hunt needs strategy first." },
			{ key: "C", text: "Tab autocomplete." },
			{ key: "D", text: "Inline Edit." },
		],
		correct: "B",
		explanation:
			"Heisenbugs are state-leak hunts that need strategy before code. Plan Mode is the right surface: research, questions, editable plan, then execute.",
		distractorRationales: {
			A: "Debug needs a localized failure point; Heisenbug doesn't have one.",
			C: "Tab can't help.",
			D: "Inline Edit is single-shot.",
		},
		studyTags: ["heisenbug", "plan"],
	},
	{
		id: "fnd-db-9",
		topic: "debugging-workflows",
		difficulty: "medium",
		stem: "An anti-pattern the cheatsheet calls out: 'Same prompt, twice.' Why is it bad?",
		choices: [
			{ key: "A", text: "It's never bad — repetition helps." },
			{ key: "B", text: "If a fix attempt failed, change the prompt or the flow — not just the model. Same prompt = same problem." },
			{ key: "C", text: "It violates the API rate limit." },
			{ key: "D", text: "It triggers a re-bill." },
		],
		correct: "B",
		explanation:
			"From anti-patterns: 'Same prompt, twice. If a fix attempt failed, change the prompt or the flow — not just the model.' Models are deterministic-ish given the same input; without changing the input, you're hoping for a different output.",
		distractorRationales: {
			A: "It is bad — diagnosed in the cheatsheet.",
			C: "Rate limits are independent.",
			D: "Billing isn't the diagnosis.",
		},
		studyTags: ["anti-pattern", "same-prompt"],
	},
	{
		id: "fnd-db-10",
		topic: "debugging-workflows",
		difficulty: "hard",
		stem: "The cheatsheet's closing line: 'The diff is the spec.' What's the implication?",
		choices: [
			{ key: "A", text: "Tests don't matter; only diffs do." },
			{ key: "B", text: "Every debug session should end with a smaller, narrower diff than you'd write by hand. If Agent's patch is larger than yours would be, ask why before you accept." },
			{ key: "C", text: "Agent should always rewrite the file." },
			{ key: "D", text: "Spec docs are obsolete." },
		],
		correct: "B",
		explanation:
			"The closing principle: a debug fix should be SMALLER than your hand-written one — if Agent's patch is larger, that's a signal to question it. The diff size is a quality metric for the fix.",
		distractorRationales: {
			A: "Tests still matter; diffs measure surgical-ness.",
			C: "Inverse — bigger rewrites hide bugs.",
			D: "Specs still matter — diff is a comparison anchor.",
		},
		studyTags: ["diff-as-spec", "review"],
	},
];

// ──────────────────────────────────────────────────────────────────────
// Bank assembly
// ──────────────────────────────────────────────────────────────────────

export const FUNDAMENTALS_QUESTION_BANK: FundamentalsQuestion[] = [
	...AI_FUNDAMENTALS_QUESTIONS,
	...AI_TERMINOLOGY_QUESTIONS,
	...CONTEXT_PROMPTS_QUESTIONS,
	...PROMPT_PATTERNS_QUESTIONS,
	...MODELS_SPEND_QUESTIONS,
	...TASK_DECOMPOSITION_QUESTIONS,
	...CURSOR_MODES_QUESTIONS,
	...CURSOR_JETBRAINS_QUESTIONS,
	...RULES_REPO_CONFIG_QUESTIONS,
	...KEYBOARD_SHORTCUTS_QUESTIONS,
	...TDD_WITH_AGENT_QUESTIONS,
	...DEBUGGING_WORKFLOWS_QUESTIONS,
];

export function getFundamentalsQuestionById(
	id: string,
): FundamentalsQuestion | undefined {
	return FUNDAMENTALS_QUESTION_BANK.find((q) => q.id === id);
}

export function getFundamentalsQuestionsByTopic(
	topic: FundamentalsTopic,
): FundamentalsQuestion[] {
	return FUNDAMENTALS_QUESTION_BANK.filter((q) => q.topic === topic);
}

export function shuffle<T>(arr: T[]): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

export function pickRandomFundamentalsQuestions(
	pool: FundamentalsQuestion[],
	count: number,
): FundamentalsQuestion[] {
	return shuffle(pool).slice(0, Math.min(count, pool.length));
}

// Even-split mock: round-robin across topics that have questions, then
// shuffle the final order. Fundamentals doesn't have exam-weight tables
// like the cert track does — every topic counts the same.
export function composeFundamentalsMock(targetCount = 30): FundamentalsQuestion[] {
	const byTopic = new Map<FundamentalsTopic, FundamentalsQuestion[]>();
	for (const q of FUNDAMENTALS_QUESTION_BANK) {
		const arr = byTopic.get(q.topic) ?? [];
		arr.push(q);
		byTopic.set(q.topic, arr);
	}
	const topics = Array.from(byTopic.keys());
	const shuffled = new Map<FundamentalsTopic, FundamentalsQuestion[]>();
	for (const t of topics) shuffled.set(t, shuffle(byTopic.get(t) ?? []));

	const picks: FundamentalsQuestion[] = [];
	let idx = 0;
	while (picks.length < targetCount) {
		let progressed = false;
		for (const t of topics) {
			const pool = shuffled.get(t)!;
			if (idx < pool.length) {
				picks.push(pool[idx]);
				progressed = true;
				if (picks.length >= targetCount) break;
			}
		}
		if (!progressed) break;
		idx += 1;
	}
	return shuffle(picks);
}
