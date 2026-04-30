import Anthropic from "@anthropic-ai/sdk";
import type { CourseMaterial } from "./courses";
import type { DiagnosticSnapshot, Message, Session } from "./sessions";

const client = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(courseName: string, materials: CourseMaterial[]): string {
	const materialsBlock = materials
		.map((m) => `### ${m.title}\n${m.content}`)
		.join("\n\n---\n\n");

	return `You are Reps, an AI tutor for the course "${courseName}". You help students understand the course materials through clear explanation and Socratic questioning.

COURSE MATERIALS:
${materialsBlock}

TOPIC RESTRICTION:
- You may ONLY discuss topics covered in the course materials above.
- If a student asks about something unrelated, respond warmly: "That's an interesting question, but it's outside what we're covering in this course. Let's stay focused on [relevant topic]. What would you like to explore next?"
- You may use general knowledge to enrich explanations of course topics, but never drift into unrelated subjects.

CORE PRINCIPLES:
1. Guide through questions — but know when to teach. If questioning alone isn't working after 2-3 rounds, shift to brief, clear instruction then check understanding with a follow-up question.
2. When a student makes an error, ask "What was your thinking here?" before correcting.
3. Identify the SPECIFIC misconception or gap — not just that they're wrong.
4. Provide scaffolded hints: first conceptual, then procedural, then specific. Never skip levels.
5. Track what the student understands AND what they don't.
6. Be warm, encouraging, and patient.

CRITICAL — AVOID CIRCULAR QUESTIONING:
If you've asked 2-3 guiding questions and the student is still stuck or repeating the same error:
- STOP asking more guiding questions.
- TEACH the concept directly: explain clearly in 2-4 sentences.
- Then give the student a chance to apply what you just taught.
The goal is learning, not endless questioning.

SESSION MEMORY:
You have access to the full conversation history. Use it to:
- Remember what the student already understands — don't re-explain mastered concepts.
- Track which topics/sections have been covered and which haven't.
- Build on previous explanations and questions — create a coherent learning arc.
- Reference earlier parts of the conversation: "Earlier you mentioned... let's connect that to..."

COMMUNICATION STYLE:
- Keep responses focused — 2-4 sentences of content, then a question or prompt. Don't lecture for paragraphs.
- Celebrate effort and progress, not just correctness.
- Use the student's name occasionally.
- Reference specific parts of the course materials when explaining.

SCAFFOLDING PROTOCOL:
If the student is stuck, follow this escalation:
1. Ask what they know about the relevant concept.
2. Give a conceptual hint.
3. Give a more specific hint referencing the materials.
4. If still stuck, TEACH it directly — walk through the concept clearly, then let them try.

VISUAL EXPLANATIONS:
When a concept would benefit from a visual, include an SVG diagram wrapped in <diagram> tags.
SVG rules:
- Use a viewBox of "0 0 400 250" (or taller if needed)
- Colors: #4f9cf7 (blue accent), #22c55e (green), #ef4444 (red), #e8e8e8 (text), #2a2a2a (lines), #141414 (fill)
- font-family: sans-serif, font fills: #e8e8e8
- Keep diagrams simple and clear

MATH NOTATION:
Wrap math in $$ for display math or $ for inline math (KaTeX).

RESPONSE FORMAT:
After your conversational message (and any diagrams), ALWAYS include a diagnostic block:

<diagnostic>
{"understanding":["concepts demonstrated"],"gaps":["gaps identified"],"misconceptions":["misconceptions observed"],"confidence":50,"engagement":"medium","nextAction":"what to do next"}
</diagnostic>

The confidence score (0-100) reflects how well the student understands the current concept.`;
}

function buildConversationMessages(
	session: Session,
	messages: Message[],
): Anthropic.MessageParam[] {
	const result: Anthropic.MessageParam[] = [];

	if (messages.length === 0) {
		result.push({
			role: "user",
			content: `[SYSTEM CONTEXT — not visible to student]
Student: ${session.studentName}
This is the START of a new tutoring session. Warmly greet the student by name, briefly introduce what the course covers (based on the materials), and ask what topic or concept they'd like to work on first. Keep it encouraging and brief.`,
		});
		return result;
	}

	for (const msg of messages) {
		result.push({
			role: msg.role === "student" ? "user" : "assistant",
			content: msg.content,
		});
	}

	return result;
}

function parseDiagnostic(text: string): DiagnosticSnapshot | undefined {
	const match = text.match(/<diagnostic>\s*([\s\S]*?)\s*<\/diagnostic>/);
	if (!match) return undefined;

	try {
		const data = JSON.parse(match[1]);
		return {
			understanding: data.understanding || [],
			gaps: data.gaps || [],
			misconceptions: data.misconceptions || [],
			confidence: data.confidence ?? 50,
			engagement: data.engagement || "medium",
			nextAction: data.nextAction || "",
		};
	} catch {
		return undefined;
	}
}

function extractDiagrams(text: string): string[] {
	const diagrams: string[] = [];
	const regex = /<diagram>\s*([\s\S]*?)\s*<\/diagram>/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		diagrams.push(match[1].trim());
	}
	return diagrams;
}

function stripMetaFromResponse(text: string): string {
	return text
		.replace(/<diagnostic>[\s\S]*?<\/diagnostic>/g, "")
		.replace(/<diagram>[\s\S]*?<\/diagram>/g, "")
		.trim();
}

export async function getTutorResponse(
	session: Session,
	courseName: string,
	materials: CourseMaterial[],
	conversationMessages: Message[],
): Promise<{
	content: string;
	diagrams: string[];
	diagnostic?: DiagnosticSnapshot;
}> {
	const messages = buildConversationMessages(session, conversationMessages);

	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 1200,
		system: buildSystemPrompt(courseName, materials),
		messages,
	});

	const rawContent =
		response.content[0].type === "text" ? response.content[0].text : "";
	const diagnostic = parseDiagnostic(rawContent);
	const diagrams = extractDiagrams(rawContent);
	const content = stripMetaFromResponse(rawContent);

	return { content, diagrams, diagnostic };
}

export async function getIntroMessage(
	session: Session,
	courseName: string,
	materials: CourseMaterial[],
): Promise<{ content: string; diagrams: string[]; diagnostic?: DiagnosticSnapshot }> {
	const messages = buildConversationMessages(session, []);

	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 400,
		system: buildSystemPrompt(courseName, materials),
		messages,
	});

	const rawContent =
		response.content[0].type === "text" ? response.content[0].text : "";
	const diagnostic = parseDiagnostic(rawContent);
	const diagrams = extractDiagrams(rawContent);
	const content = stripMetaFromResponse(rawContent);

	return { content, diagrams, diagnostic };
}
