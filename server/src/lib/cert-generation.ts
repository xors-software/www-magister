// Adaptive question generation via Claude.
//
// After a quiz finishes, we look at the user's weakest (domain × scenario)
// intersections and ask Claude to produce fresh MC questions targeted at
// those weak spots. New questions are stored in `generated_questions` and
// surface in subsequent drills via cert-quizzes.ts.
//
// We use tool_use with a strict JSON schema so the output is parseable,
// and we read the underlying scenario markdown as grounding context to keep
// the generated questions tied to the actual exam material.

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	DOMAIN_LABELS,
	SCENARIO_LABELS,
	type CertDomain,
	type CertQuestion,
	type ScenarioId,
} from "./cert-types";
import { sql } from "./pg";
import type { QuizResults } from "./cert-types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCENARIO_FILES: Record<ScenarioId, string> = {
	"customer-support": "scenario-1-customer-support.md",
	"code-generation": "scenario-2-claude-code.md",
	"multi-agent-research": "scenario-3-multi-agent-research.md",
	"developer-productivity": "scenario-4-developer-productivity.md",
	"ci-cd": "scenario-5-ci-cd.md",
	"structured-extraction": "scenario-6-structured-extraction.md",
};

// Read the scenario MD. Tries server/scenarios/ first (bundled with the
// server deploy) then falls back to web/public/scenarios/ for local
// monorepo dev. Limit to a reasonable size — the deep-dives are ~30k chars;
// we trim to stay well under context budget.
function readScenarioContent(scenario: ScenarioId, maxChars = 18000): string {
	const candidates = [
		// server/scenarios/ — copy bundled into the server build for prod.
		join(import.meta.dir, "../../scenarios", SCENARIO_FILES[scenario]),
		// web/public/scenarios/ — when running from the monorepo root.
		join(
			import.meta.dir,
			"../../../web/public/scenarios",
			SCENARIO_FILES[scenario],
		),
	];
	for (const path of candidates) {
		try {
			const text = readFileSync(path, "utf-8");
			return text.length <= maxChars ? text : text.slice(0, maxChars);
		} catch {
			// try next path
		}
	}
	console.warn(`[cert] scenario file not found for ${scenario}`);
	return `(Scenario content not available for ${scenario}.)`;
}

const QUESTION_TOOL = {
	name: "submit_questions",
	description:
		"Return a batch of multiple-choice questions for the Anthropic Claude Code certification. Each question must follow the schema exactly: a stem, four choices labelled A-D, the correct letter, an explanation, and a per-distractor rationale.",
	input_schema: {
		type: "object" as const,
		properties: {
			questions: {
				type: "array",
				items: {
					type: "object",
					properties: {
						stem: {
							type: "string",
							description:
								"The question stem. Should be 2-5 sentences, present a concrete scenario, and end with a question.",
						},
						choices: {
							type: "array",
							minItems: 4,
							maxItems: 4,
							items: {
								type: "object",
								properties: {
									key: { type: "string", enum: ["A", "B", "C", "D"] },
									text: { type: "string" },
								},
								required: ["key", "text"],
							},
						},
						correct: { type: "string", enum: ["A", "B", "C", "D"] },
						explanation: {
							type: "string",
							description:
								"Why the correct answer is right. Cite the exam pattern or task ID where applicable. 2-4 sentences.",
						},
						distractor_rationales: {
							type: "object",
							description:
								"Per-distractor rationale: keys are the wrong choice letters, values explain why that option is wrong. Include all three wrong choices.",
							additionalProperties: { type: "string" },
						},
						study_tags: {
							type: "array",
							items: { type: "string" },
							description:
								"Short concept tags (e.g. 'tool-descriptions', 'Task-2.1', 'no-sentiment'). 2-5 tags.",
						},
						tasks: {
							type: "array",
							items: { type: "string" },
							description:
								"Exam task IDs the question maps to (e.g. '1.4', '2.1', '5.6').",
						},
						difficulty: {
							type: "string",
							enum: ["easy", "medium", "hard"],
						},
					},
					required: [
						"stem",
						"choices",
						"correct",
						"explanation",
						"distractor_rationales",
						"study_tags",
						"tasks",
						"difficulty",
					],
				},
			},
		},
		required: ["questions"],
	},
};

interface GeneratedRow {
	stem: string;
	choices: { key: "A" | "B" | "C" | "D"; text: string }[];
	correct: "A" | "B" | "C" | "D";
	explanation: string;
	distractor_rationales: Partial<Record<"A" | "B" | "C" | "D", string>>;
	study_tags: string[];
	tasks: string[];
	difficulty: "easy" | "medium" | "hard";
}

function buildPrompt(
	scenario: ScenarioId,
	domain: CertDomain,
	count: number,
	weakSpotHint?: string,
): { system: string; user: string } {
	const scenarioMd = readScenarioContent(scenario);
	const system = `You are an exam-question writer for the Anthropic Claude Code certification (a multiple-choice exam). The exam is built around six canonical scenarios; each question must be grounded in the corresponding scenario deep-dive.

Quality bar:
- Stems describe a concrete situation and end with a clear, single question.
- Exactly four choices labelled A-D. Distractors must be plausible, not obviously wrong.
- Distractors should embody real anti-patterns the exam guide flags ("improve the system prompt" when deterministic enforcement is needed; "use a bigger model" for attention dilution; "sentiment-based escalation"; "batch API for pre-merge"; "CLAUDE_HEADLESS env var", etc.).
- Explanations cite the exam pattern or task ID and are 2-4 sentences.
- Per-distractor rationales explain WHY that option is wrong, not just restate it.
- Avoid duplicating the wording of the seed-bank questions you've been trained around.
- Prefer "trick" questions where the stem already disqualifies a plausible distractor (e.g. mentioning that tool descriptions are well-defined rules out the "improve descriptions" answer).

You will be given (1) the full scenario deep-dive for context, (2) the target domain, and (3) the user's weak-spot signal. Generate exactly the requested number of fresh, high-quality questions and submit them via the submit_questions tool.`;
	const user = `Generate ${count} multiple-choice question(s) for:

SCENARIO: ${SCENARIO_LABELS[scenario]} (id: ${scenario})
DOMAIN: ${domain} — ${DOMAIN_LABELS[domain]}
${weakSpotHint ? `\nWEAK SPOT SIGNAL: ${weakSpotHint}\n` : ""}

Use the deep-dive below as the SOLE source of truth — do not invent exam patterns that don't appear in it. Vary difficulty (mix easy/medium/hard) and prefer the scenario's published gotchas/anti-patterns when picking distractors.

=== SCENARIO DEEP-DIVE ===
${scenarioMd}
=== END DEEP-DIVE ===

Submit exactly ${count} question(s) via submit_questions.`;
	return { system, user };
}

export async function generateQuestions(
	scenario: ScenarioId,
	domain: CertDomain,
	count: number,
	options: { weakSpotHint?: string; userId?: string | null } = {},
): Promise<CertQuestion[]> {
	if (count <= 0) return [];
	const { system, user } = buildPrompt(scenario, domain, count, options.weakSpotHint);
	const response = await client.messages.create({
		model: "claude-sonnet-4-5-20250929",
		max_tokens: 4000,
		system,
		tools: [QUESTION_TOOL as unknown as Anthropic.Tool],
		tool_choice: { type: "tool", name: "submit_questions" },
		messages: [{ role: "user", content: user }],
	});

	const toolUse = response.content.find((c) => c.type === "tool_use");
	if (!toolUse || toolUse.type !== "tool_use") return [];
	const input = toolUse.input as { questions: GeneratedRow[] };
	const rows = input.questions ?? [];

	const generationContext = {
		weakSpotHint: options.weakSpotHint,
		generatedFor: { scenario, domain },
	};
	const inserted: CertQuestion[] = [];
	for (const row of rows) {
		// Validation: require exactly 4 choices, each shaped {key, text} with
		// distinct A-D keys and non-empty string text. We've seen the model
		// occasionally emit nested/object-shaped choices that would crash the
		// frontend renderer; reject anything that doesn't match the shape we
		// promise downstream. The render-time validator in cert-quizzes.ts
		// catches anything that still slips through.
		if (!Array.isArray(row.choices) || row.choices.length !== 4) continue;
		const keys = new Set<string>();
		let badShape = false;
		for (const c of row.choices) {
			if (!c || typeof c !== "object") { badShape = true; break; }
			if (typeof c.key !== "string" || typeof c.text !== "string" || c.text.length === 0) {
				badShape = true;
				break;
			}
			keys.add(c.key);
		}
		if (badShape) continue;
		if (keys.size !== 4 || !["A", "B", "C", "D"].every((k) => keys.has(k))) continue;
		if (!["A", "B", "C", "D"].includes(row.correct)) continue;

		const id = `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
		await sql`
			INSERT INTO generated_questions (
				id, scenario, domain, tasks, mode, difficulty,
				stem, choices, correct, explanation, distractor_rationales,
				study_tags, generated_for_user_id, generation_context
			) VALUES (
				${id}, ${scenario}, ${domain}, ${row.tasks ?? []}::text[], 'canonical', ${row.difficulty ?? "medium"},
				${row.stem}, ${JSON.stringify(row.choices)}::jsonb, ${row.correct},
				${row.explanation}, ${JSON.stringify(row.distractor_rationales ?? {})}::jsonb,
				${row.study_tags ?? []}::text[],
				${options.userId ?? null}, ${JSON.stringify(generationContext)}::jsonb
			)
		`;
		inserted.push({
			id,
			scenario,
			domain,
			tasks: row.tasks ?? [],
			mode: "canonical",
			difficulty: row.difficulty,
			stem: row.stem,
			choices: row.choices,
			correct: row.correct,
			explanation: row.explanation,
			distractorRationales: row.distractor_rationales,
			studyTags: row.study_tags ?? [],
		});
	}
	return inserted;
}

// Background hook called after a user finishes a quiz. Looks at their weakest
// domain/scenario pairs and queues up new generated questions targeted at
// those gaps. Failures are logged, never thrown — generation is best-effort.
export async function generateAdaptiveQuestionsAsync(
	userId: string,
	results: QuizResults,
): Promise<void> {
	// Pick the worst scenario × domain intersection that has at least one
	// missed question. Cap at 2 generation runs per quiz to control cost.
	const missesByPair = new Map<string, { scenario: ScenarioId; domain: CertDomain; count: number }>();
	for (const m of results.missedQuestions) {
		const key = `${m.scenario}::${m.domain}`;
		const existing = missesByPair.get(key);
		if (existing) existing.count += 1;
		else missesByPair.set(key, { scenario: m.scenario, domain: m.domain, count: 1 });
	}
	const ranked = Array.from(missesByPair.values()).sort((a, b) => b.count - a.count);
	const targets = ranked.slice(0, 2);
	for (const t of targets) {
		try {
			await generateQuestions(t.scenario, t.domain, 5, {
				userId,
				weakSpotHint: `User missed ${t.count} question(s) on (${t.scenario}, ${t.domain}) in their last drill. Surface a fresh angle on the same patterns rather than rehashing identical stems.`,
			});
		} catch (err) {
			console.error(
				`[cert] adaptive generation failed for ${t.scenario}/${t.domain}:`,
				err,
			);
		}
	}
}

// Manual trigger — also exposed via /cert/generate route below for ops.
export async function manualGenerate(
	scenario: ScenarioId,
	domain: CertDomain,
	count = 5,
): Promise<CertQuestion[]> {
	return generateQuestions(scenario, domain, count, {});
}
