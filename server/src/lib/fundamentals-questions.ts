// Seed question bank for the AI Fundamentals track.
//
// Lifted from the conceptual content of the twelve cheatsheets on the
// /ai-fundamentals page. Three topics seeded for the pilot launch
// (ai-fundamentals, ai-terminology, prompt-patterns); the remaining nine
// topics are intentionally empty so the engine surfaces them as
// "coming soon" rather than serving partial coverage.

import type {
	FundamentalsQuestion,
	FundamentalsTopic,
} from "./fundamentals-types";

const AI_FUNDAMENTALS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-af-1",
		topic: "ai-fundamentals",
		difficulty: "easy",
		stem: "An engineer says 'the model just remembered what I told it last week.' Why is that statement almost always wrong for a stateless API call?",
		choices: [
			{ key: "A", text: "The model has a 24-hour memory cache and last week is outside it." },
			{ key: "B", text: "Each API request is independent; the model has no state between calls unless you re-send the prior conversation as context." },
			{ key: "C", text: "The model remembers user IDs but forgets timestamps." },
			{ key: "D", text: "The vendor stores conversation history and replays it on the next call automatically." },
		],
		correct: "B",
		explanation:
			"LLM APIs are stateless. The illusion of memory comes from the client (or wrapping product) re-sending prior messages in the prompt. The model itself doesn't persist anything across requests.",
		distractorRationales: {
			A: "There is no time-based memory cache; behavior would be identical 1 second or 1 month later.",
			C: "User IDs are not special — the model only sees what's in the prompt.",
			D: "Some products do this, but the model's apparent memory is the consequence, not the cause — and it's not automatic at the API level.",
		},
		studyTags: ["statelessness", "context-window"],
	},
	{
		id: "fnd-af-2",
		topic: "ai-fundamentals",
		difficulty: "easy",
		stem: "What is a 'token' in the context of an LLM, and why does it matter for cost?",
		choices: [
			{ key: "A", text: "A token is one character; cost is per character." },
			{ key: "B", text: "A token is one word; cost is per word." },
			{ key: "C", text: "A token is a chunk of text (~3-4 chars on average for English); inputs and outputs are billed by token count." },
			{ key: "D", text: "A token is one API call; cost is per request regardless of length." },
		],
		correct: "C",
		explanation:
			"Tokens are the unit of text the model reads and writes — typically subword chunks. Pricing is per million input tokens and per million output tokens, so prompt length and response length both drive cost.",
		distractorRationales: {
			A: "Closer to wrong than right — characters vary per token; English averages roughly 4 chars/token.",
			B: "Words don't map 1:1 to tokens; common words may be one token, rare/long words multiple.",
			D: "Per-request flat pricing isn't how token-based APIs work.",
		},
		studyTags: ["tokens", "cost"],
	},
	{
		id: "fnd-af-3",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "You ask the model the same question twice with default settings and get two slightly different answers. What's the most accurate explanation?",
		choices: [
			{ key: "A", text: "The model is broken — same input must give same output." },
			{ key: "B", text: "Sampling is non-deterministic by default; even at temperature 0 some providers don't guarantee bit-exact reproducibility." },
			{ key: "C", text: "The vendor randomly swaps in a different model on each call." },
			{ key: "D", text: "The model learned new information between the two calls." },
		],
		correct: "B",
		explanation:
			"LLMs sample the next token from a probability distribution. Default temperature/top-p produce variation. Even at temperature 0 (greedy), batched inference and floating-point non-associativity mean providers usually don't promise bit-exact reproducibility.",
		distractorRationales: {
			A: "Stochastic sampling is the design, not a bug.",
			C: "Vendors don't silently swap models for the same model ID.",
			D: "The model's weights are frozen; it does not learn between calls.",
		},
		studyTags: ["determinism", "temperature", "sampling"],
	},
	{
		id: "fnd-af-4",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "A model confidently states a fake court case citation in a legal memo. Which framing best describes what happened?",
		choices: [
			{ key: "A", text: "The model lied on purpose." },
			{ key: "B", text: "The model has a bug specific to legal content." },
			{ key: "C", text: "The model generated text that pattern-matches the shape of a citation without grounding to a real source — a hallucination." },
			{ key: "D", text: "The court case was deleted from the model's training data." },
		],
		correct: "C",
		explanation:
			"LLMs predict plausible next tokens given the prompt. With no retrieval/grounding step, the output looks structurally correct (a citation has a name, year, court) without being verifiable against reality. Mitigation: tool use / RAG with authoritative sources.",
		distractorRationales: {
			A: "Lying implies intent; the model has no intent — just a probability distribution.",
			B: "Hallucination is a general failure mode, not domain-specific.",
			D: "Deletion isn't how it works — and the model never had a verified citation index in the first place.",
		},
		studyTags: ["hallucination", "grounding", "rag"],
	},
	{
		id: "fnd-af-5",
		topic: "ai-fundamentals",
		difficulty: "medium",
		stem: "Your team wants the LLM to answer questions using last week's internal incident reports. Which approach fits best?",
		choices: [
			{ key: "A", text: "Fine-tune the base model weekly on every new report." },
			{ key: "B", text: "Retrieve relevant report passages at query time and pass them to the model as context (RAG)." },
			{ key: "C", text: "Wait for the next model release and hope the vendor included your reports." },
			{ key: "D", text: "Restart the model so it sees the new files on disk." },
		],
		correct: "B",
		explanation:
			"RAG is the right tool when knowledge is fresh, private, or volatile. Fine-tuning bakes information into weights — slow, expensive, hard to update, and prone to forgetting. Retrieval keeps facts external, cheap to refresh, and easy to cite.",
		distractorRationales: {
			A: "Weekly fine-tunes are expensive, slow to iterate, and unnecessary for fact lookup.",
			C: "Vendor models won't have your private data.",
			D: "There's no 'restart' that gives the model file access; the model only sees what's in the prompt.",
		},
		studyTags: ["rag", "fine-tuning", "context"],
	},
];

const AI_TERMINOLOGY_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-at-1",
		topic: "ai-terminology",
		difficulty: "easy",
		stem: "What does 'context window' refer to?",
		choices: [
			{ key: "A", text: "The IDE pane where the chat appears." },
			{ key: "B", text: "The maximum number of tokens (input + output) the model can attend to in a single call." },
			{ key: "C", text: "The 30-day rolling history of a user's chats." },
			{ key: "D", text: "The browser tab where the model is running." },
		],
		correct: "B",
		explanation:
			"The context window is the model's working memory for a single request — measured in tokens. When the conversation plus tool outputs exceed it, content gets summarized, dropped, or compaction kicks in.",
		distractorRationales: {
			A: "Pane name, not a model property.",
			C: "Some products keep history, but that's product behavior — the context window is per-call.",
			D: "Models don't run in browser tabs.",
		},
		studyTags: ["context-window", "vocab"],
	},
	{
		id: "fnd-at-2",
		topic: "ai-terminology",
		difficulty: "easy",
		stem: "What is 'temperature' in an LLM API?",
		choices: [
			{ key: "A", text: "The GPU's physical temperature; higher means slower." },
			{ key: "B", text: "A sampling parameter (typically 0-1) that controls how much randomness is allowed when picking the next token." },
			{ key: "C", text: "The model's confidence score for each answer." },
			{ key: "D", text: "How much context the model gets per request." },
		],
		correct: "B",
		explanation:
			"Temperature scales the token-probability distribution before sampling. Low temperature → greedy/predictable. High temperature → diverse/creative. Use low for code, extraction, classification; higher for brainstorming.",
		distractorRationales: {
			A: "Hardware metric, unrelated to the API.",
			C: "Confidence is implicit in token probabilities, but temperature is a knob, not a measurement.",
			D: "That's context window, a different parameter.",
		},
		studyTags: ["temperature", "sampling", "vocab"],
	},
	{
		id: "fnd-at-3",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "What's the difference between 'fine-tuning' and 'in-context learning'?",
		choices: [
			{ key: "A", text: "They're synonyms." },
			{ key: "B", text: "Fine-tuning permanently updates the model's weights with new training data; in-context learning means showing examples in the prompt without changing the weights." },
			{ key: "C", text: "Fine-tuning is faster than in-context learning." },
			{ key: "D", text: "In-context learning requires GPUs; fine-tuning runs on CPU." },
		],
		correct: "B",
		explanation:
			"Fine-tuning produces a new model checkpoint with permanently shifted behavior — useful for stable, repeated tasks. In-context learning (few-shot) puts examples in the prompt; the model adapts behavior for that one call. Most product use cases want in-context first.",
		distractorRationales: {
			A: "They are conceptually opposite — one mutates the model, the other doesn't.",
			C: "Fine-tuning is much slower; needs hours/days of training.",
			D: "Both are GPU-bound; fine-tuning needs more.",
		},
		studyTags: ["fine-tuning", "few-shot", "vocab"],
	},
	{
		id: "fnd-at-4",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "What is an 'embedding'?",
		choices: [
			{ key: "A", text: "An iframe of the model in your web app." },
			{ key: "B", text: "A vector representation of text (or other data) where similar meanings are close in vector space." },
			{ key: "C", text: "A piece of text the user pinned to the chat." },
			{ key: "D", text: "The model's fine-tuned weights, exported as a file." },
		],
		correct: "B",
		explanation:
			"An embedding maps content to a high-dimensional vector. Cosine distance between vectors approximates semantic similarity, which is the foundation of vector search and most RAG implementations.",
		distractorRationales: {
			A: "Wrong type of 'embed' (iframe is HTML embedding).",
			C: "Pinning is a UI concept.",
			D: "Weights aren't embeddings — embeddings are model outputs over inputs.",
		},
		studyTags: ["embeddings", "rag", "vocab"],
	},
	{
		id: "fnd-at-5",
		topic: "ai-terminology",
		difficulty: "medium",
		stem: "A teammate uses the term 'agent' to describe something that just calls an LLM in a loop. What's missing from that definition for it to be an actual agent?",
		choices: [
			{ key: "A", text: "Nothing — any LLM call is an agent." },
			{ key: "B", text: "Tool use: an agent decides between actions, invokes tools, observes results, and iterates toward a goal." },
			{ key: "C", text: "A graphical avatar to represent the agent." },
			{ key: "D", text: "A separate fine-tuned model trained specifically for agent behavior." },
		],
		correct: "B",
		explanation:
			"An agent is an LLM in a loop with tools and the ability to act on observations. Plain prompt-in-text-out isn't an agent — it's a single-shot completion. The agentic loop is: think → act (tool call) → observe → repeat.",
		distractorRationales: {
			A: "Conflates 'using an LLM' with 'agent' — the loop+tools distinction matters.",
			C: "UI affordance, not part of the definition.",
			D: "You don't need a special model; capability comes from the loop and tools.",
		},
		studyTags: ["agents", "tool-use", "vocab"],
	},
];

const PROMPT_PATTERNS_QUESTIONS: FundamentalsQuestion[] = [
	{
		id: "fnd-pp-1",
		topic: "prompt-patterns",
		difficulty: "easy",
		stem: "Which prompt is most likely to produce a consistent, parseable JSON response?",
		choices: [
			{ key: "A", text: "'Give me the user info.'" },
			{ key: "B", text: "'Return the user as JSON with this exact schema: {\"id\": string, \"email\": string, \"role\": \"admin\"|\"member\"}. No prose, no markdown fences.'" },
			{ key: "C", text: "'Tell me about the user, structured if possible.'" },
			{ key: "D", text: "'Format your answer nicely.'" },
		],
		correct: "B",
		explanation:
			"Specify the schema, the allowed enum values, and explicitly forbid prose/fences. Vague phrasing ('structured if possible', 'nicely') leaves the model to guess and produces inconsistent output that breaks downstream parsers.",
		distractorRationales: {
			A: "No structure specified — output shape varies per call.",
			C: "'If possible' makes structure optional, which the model often interprets as 'skip it.'",
			D: "'Nicely' is undefined — Markdown? Sentences? Tables? You'll get any of them.",
		},
		studyTags: ["structured-output", "json", "specificity"],
	},
	{
		id: "fnd-pp-2",
		topic: "prompt-patterns",
		difficulty: "easy",
		stem: "Why is 'few-shot prompting' useful for classification tasks?",
		choices: [
			{ key: "A", text: "It physically retrains the model on your examples." },
			{ key: "B", text: "Showing 2-5 input/output examples lets the model infer the output shape, edge-case handling, and tone you want for similar inputs in the same call." },
			{ key: "C", text: "It tells the model your name." },
			{ key: "D", text: "It is required by every API." },
		],
		correct: "B",
		explanation:
			"Few-shot anchors the model to your specific decision boundary. For classification with non-obvious edge cases, examples beat prose every time — the model learns the rule by induction rather than by trying to interpret abstract instructions.",
		distractorRationales: {
			A: "Few-shot doesn't update weights — that's fine-tuning.",
			C: "Personalization is a different concept.",
			D: "Optional. Only useful when it changes behavior.",
		},
		studyTags: ["few-shot", "classification"],
	},
	{
		id: "fnd-pp-3",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "Your prompt asks the model to summarize a document and 'be sure not to miss anything important.' Outputs are inconsistent. What's the strongest fix?",
		choices: [
			{ key: "A", text: "Add 'please' to the prompt." },
			{ key: "B", text: "Define what 'important' means — list the categories of information you require (decisions, owners, deadlines, blockers) and ask for them as a structured output." },
			{ key: "C", text: "Switch to a smaller model for consistency." },
			{ key: "D", text: "Increase temperature to give the model more freedom." },
		],
		correct: "B",
		explanation:
			"Vague qualifiers like 'important' shift the model's interpretation each call. Replacing them with an explicit rubric (named fields, required categories) anchors the output. The fix is specificity, not politeness or randomness.",
		distractorRationales: {
			A: "Politeness has negligible effect on output quality.",
			C: "Smaller models tend to produce more variance, not less.",
			D: "Higher temperature increases inconsistency, not decreases it.",
		},
		studyTags: ["specificity", "structured-output", "summarization"],
	},
	{
		id: "fnd-pp-4",
		topic: "prompt-patterns",
		difficulty: "medium",
		stem: "When does a 'role' prompt ('You are a senior security reviewer…') actually help?",
		choices: [
			{ key: "A", text: "Always — roles unlock hidden capabilities." },
			{ key: "B", text: "Never — the model ignores roles." },
			{ key: "C", text: "When the role narrows the model's focus to a specific evaluative lens or vocabulary that would otherwise be one option among many." },
			{ key: "D", text: "Only with fine-tuned models." },
		],
		correct: "C",
		explanation:
			"Role prompts work as priming: 'security reviewer' biases the model toward security-relevant patterns and terms. They help when the task has a clear evaluative frame and the default behavior would be too generic. They don't unlock new capabilities.",
		distractorRationales: {
			A: "Roles bias behavior, they don't unlock capabilities the model doesn't have.",
			B: "Empirically false — role priming measurably shifts focus and tone.",
			D: "Works on base models too; not fine-tune-specific.",
		},
		studyTags: ["role-prompting", "priming"],
	},
	{
		id: "fnd-pp-5",
		topic: "prompt-patterns",
		difficulty: "hard",
		stem: "You're prompting an LLM to extract structured data from messy HTML. The model sometimes invents fields. Which mitigation is most reliable?",
		choices: [
			{ key: "A", text: "Add 'don't make things up' to the prompt." },
			{ key: "B", text: "Provide the explicit JSON schema, mark every field as required-or-null, and instruct: 'if a field is not literally present in the source, return null — never infer.'" },
			{ key: "C", text: "Run the prompt twice and pick the answer that appeared more often." },
			{ key: "D", text: "Lower temperature to 0 and assume the model will stop hallucinating." },
		],
		correct: "B",
		explanation:
			"Hallucinated fields come from ambiguity about whether 'missing' is allowed. Make 'absent' a first-class output (null) and explicitly forbid inference. Temperature 0 reduces variance but does not eliminate plausible-sounding inventions.",
		distractorRationales: {
			A: "Generic prohibition doesn't compete with the model's strong prior to fill in fields.",
			C: "Voting is expensive and only catches divergence — not consistent hallucinations.",
			D: "Helps but doesn't solve it; model can still produce confident wrong answers at temp 0.",
		},
		studyTags: ["extraction", "structured-output", "hallucination"],
	},
];

export const FUNDAMENTALS_QUESTION_BANK: FundamentalsQuestion[] = [
	...AI_FUNDAMENTALS_QUESTIONS,
	...AI_TERMINOLOGY_QUESTIONS,
	...PROMPT_PATTERNS_QUESTIONS,
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
