import Anthropic from "@anthropic-ai/sdk";
import type { Problem } from "./problems";
import type {
	DiagnosticSnapshot,
	HandoffArtifact,
	KnowledgeGap,
	Message,
	Misconception,
	Session,
} from "./sessions";

const client = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

const SOCRATIC_SYSTEM_PROMPT = `You are Magister, a Socratic math tutor designed for hybrid high-dosage tutoring sessions. You work with students in 25-minute blocks, diagnosing exactly where they're stuck through questioning — never lecturing.

CORE PRINCIPLES:
1. NEVER give the answer directly. Guide the student through questions.
2. When a student makes an error, ask "What was your thinking here?" or similar before correcting.
3. Identify the SPECIFIC misconception or gap — not just that they're wrong.
4. Provide scaffolded hints: first conceptual, then procedural, then specific. Never skip levels.
5. Track what the student understands AND what they don't.
6. Be warm, encouraging, and patient. Many of these students are behind grade level and may feel frustrated.

DIAGNOSTIC APPROACH:
- When presenting a new problem, ask the student what they notice or how they'd start.
- When they make errors, trace back to the ROOT CAUSE through questioning.
- Distinguish between careless arithmetic errors and conceptual misunderstandings.
- Note prerequisite gaps (e.g., they struggle with equations because they don't understand inverse operations).
- If a student gets stuck, don't immediately hint. Ask what they know about the concept first.

COMMUNICATION STYLE:
- Use simple, clear language appropriate for grades 6-8.
- Keep responses SHORT — 2-3 sentences max, then ask a question. Never lecture.
- Never use jargon without explaining it.
- Celebrate effort and progress, not just correctness.
- Use the student's name occasionally.

SCAFFOLDING PROTOCOL:
If the student is stuck, follow this escalation:
1. First: Ask what they know about the concept ("What do you know about [topic]?")
2. Second: Give a conceptual hint ("Think about what operation undoes addition...")
3. Third: Give a procedural hint ("Try subtracting 7 from both sides.")
4. Fourth: Walk through the first step together, then let them continue.
Never jump to step 4 immediately.

IMPORTANT:
- You have the correct answer and solution steps. Use them to GUIDE, never to reveal.
- When the student arrives at the correct answer, confirm it and briefly explain why the approach worked.
- If the student is clearly guessing randomly, gently redirect to the underlying concept.
- After confirming a correct answer, indicate that you're ready to move on.

VISUAL EXPLANATIONS:
When a concept would benefit from a visual, include an SVG diagram in your response wrapped in <diagram> tags. Use these for:
- Geometry problems: draw the shape with labeled sides, angles, and relevant measurements
- Number lines: show positions of fractions or decimals
- Fraction models: draw bar or area models showing parts
- Equation balance: show a visual balance beam for both sides of an equation
- Area/volume: draw the shape with dimensions labeled

SVG rules:
- Use a viewBox of "0 0 400 250" (or taller if needed)
- Use these colors: #4f9cf7 (blue accent), #22c55e (green/correct), #ef4444 (red/error), #e8e8e8 (text), #2a2a2a (lines), #141414 (fill)
- Set font-family to sans-serif, font fills to #e8e8e8
- Keep diagrams simple and clear — no decoration, just the math
- Only include a diagram when it genuinely aids understanding, not on every message

Example:
<diagram>
<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,200 350,200 350,50" fill="none" stroke="#4f9cf7" stroke-width="2"/>
  <text x="200" y="220" fill="#e8e8e8" font-family="sans-serif" font-size="14" text-anchor="middle">8</text>
  <text x="365" y="130" fill="#e8e8e8" font-family="sans-serif" font-size="14">6</text>
  <text x="190" y="115" fill="#22c55e" font-family="sans-serif" font-size="14" text-anchor="middle">c = ?</text>
</svg>
</diagram>

MATH NOTATION:
When writing math expressions in your conversational text, wrap them in $$ delimiters for display math or $ for inline math so the frontend can render them with KaTeX.
Examples: $3x + 7 = 22$ or $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

RESPONSE FORMAT:
After your conversational message (and any diagrams), ALWAYS include a diagnostic block on a new line in exactly this format:

<diagnostic>
{"understanding":["concepts demonstrated"],"gaps":["gaps identified"],"misconceptions":["misconceptions observed"],"confidence":50,"engagement":"medium","nextAction":"what to do next","problemSolved":false}
</diagnostic>

Set "problemSolved" to true ONLY when the student has clearly arrived at and stated the correct answer. The confidence score (0-100) reflects how well the student seems to understand the current concept.`;

function buildConversationMessages(
	session: Session,
	currentProblem: Problem,
	messages: Message[],
): Anthropic.MessageParam[] {
	const result: Anthropic.MessageParam[] = [];

	result.push({
		role: "user",
		content: `[SYSTEM CONTEXT — not visible to student]
Student: ${session.studentName}, Grade ${session.gradeLevel}
Topic: ${currentProblem.topic} / ${currentProblem.subtopic}
Difficulty: ${currentProblem.difficulty}

Current Problem: ${currentProblem.question}
Correct Answer: ${currentProblem.correctAnswer}
Solution Steps: ${currentProblem.solutionSteps.join(" → ")}
Common Misconceptions to Watch For: ${currentProblem.commonMisconceptions.join("; ")}
Prerequisites: ${currentProblem.prerequisites.join(", ")}

${session.knowledgeGaps.length > 0 ? `Known gaps from earlier in session: ${session.knowledgeGaps.map((g) => g.concept).join(", ")}` : ""}
${session.misconceptions.length > 0 ? `Known misconceptions: ${session.misconceptions.map((m) => m.description).join(", ")}` : ""}

Present this problem to the student now. Remember: ask them what they notice or how they'd approach it. Do NOT show them the answer or solution steps.`,
	});

	result.push({
		role: "assistant",
		content:
			messages.length > 0
				? messages[0].role === "tutor"
					? messages[0].content
					: `Let's work on this next problem, ${session.studentName}.\n\n**${currentProblem.question}**\n\nWhat do you think? How would you start working on this?`
				: `Let's work on this next problem, ${session.studentName}.\n\n**${currentProblem.question}**\n\nWhat do you think? How would you start working on this?`,
	});

	for (let i = messages[0]?.role === "tutor" ? 1 : 0; i < messages.length; i++) {
		const msg = messages[i];
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

function stripDiagnosticFromResponse(text: string): string {
	return text
		.replace(/<diagnostic>[\s\S]*?<\/diagnostic>/g, "")
		.replace(/<diagram>[\s\S]*?<\/diagram>/g, "")
		.trim();
}

function isProblemSolved(text: string): boolean {
	const match = text.match(/<diagnostic>\s*([\s\S]*?)\s*<\/diagnostic>/);
	if (!match) return false;
	try {
		const data = JSON.parse(match[1]);
		return data.problemSolved === true;
	} catch {
		return false;
	}
}

export async function getTutorResponse(
	session: Session,
	currentProblem: Problem,
	conversationMessages: Message[],
): Promise<{
	content: string;
	diagrams: string[];
	diagnostic?: DiagnosticSnapshot;
	problemSolved: boolean;
}> {
	const messages = buildConversationMessages(
		session,
		currentProblem,
		conversationMessages,
	);

	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 1200,
		system: SOCRATIC_SYSTEM_PROMPT,
		messages,
	});

	const rawContent =
		response.content[0].type === "text" ? response.content[0].text : "";
	const diagnostic = parseDiagnostic(rawContent);
	const solved = isProblemSolved(rawContent);
	const diagrams = extractDiagrams(rawContent);
	const content = stripDiagnosticFromResponse(rawContent);

	return { content, diagrams, diagnostic, problemSolved: solved };
}

export async function getIntroMessage(
	session: Session,
	problem: Problem,
): Promise<{ content: string; diagrams: string[]; diagnostic?: DiagnosticSnapshot }> {
	const messages: Anthropic.MessageParam[] = [
		{
			role: "user",
			content: `[SYSTEM CONTEXT — not visible to student]
Student: ${session.studentName}, Grade ${session.gradeLevel}
Topic: ${problem.topic} / ${problem.subtopic}
Difficulty: ${problem.difficulty}

Current Problem: ${problem.question}
Correct Answer: ${problem.correctAnswer}
Solution Steps: ${problem.solutionSteps.join(" → ")}
Common Misconceptions to Watch For: ${problem.commonMisconceptions.join("; ")}
Prerequisites: ${problem.prerequisites.join(", ")}

This is the START of a new tutoring session. Warmly greet the student by name, present the problem, and ask them how they'd approach it. Keep it brief and encouraging. Do NOT reveal the answer.`,
		},
	];

	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 400,
		system: SOCRATIC_SYSTEM_PROMPT,
		messages,
	});

	const rawContent =
		response.content[0].type === "text" ? response.content[0].text : "";
	const diagnostic = parseDiagnostic(rawContent);
	const diagrams = extractDiagrams(rawContent);
	const content = stripDiagnosticFromResponse(rawContent);

	return { content, diagrams, diagnostic };
}

export async function generateHandoff(
	session: Session,
): Promise<HandoffArtifact> {
	const transcript = session.attempts
		.map((attempt, i) => {
			const msgs = attempt.messages
				.map(
					(m) =>
						`${m.role === "student" ? session.studentName : "Tutor"}: ${m.content}`,
				)
				.join("\n");
			return `--- Problem ${i + 1}: ${attempt.problem.question} (${attempt.status}) ---\n${msgs}`;
		})
		.join("\n\n");

	const gapsJson = JSON.stringify(session.knowledgeGaps);
	const misconceptionsJson = JSON.stringify(session.misconceptions);

	const allDiagnostics = session.attempts.flatMap((a) => a.diagnostics);
	const latestDiagnostics = allDiagnostics.slice(-5);

	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 1500,
		system: `You are generating a handoff artifact for a human tutor. This document must be concise, actionable, and specific. The human tutor will use this to make their 25-minute session as productive as possible.

Write in a professional but warm tone. Be specific — cite exact moments from the transcript as evidence. Prioritize ruthlessly — the tutor only has 25 minutes.

Respond in this exact JSON format (no markdown, no wrapping):
{
  "summary": "2-3 sentence overview of the session",
  "priorities": ["Top priority for the tutor", "Second priority", "Third priority"],
  "suggestedApproach": "Specific suggestion for how the tutor should open their session",
  "strengthsObserved": ["Strengths the student showed"],
  "knowledgeGaps": [{"concept": "...", "severity": "critical|moderate|minor", "evidence": "specific quote or moment"}],
  "misconceptions": [{"description": "...", "evidence": "specific quote or moment"}]
}`,
		messages: [
			{
				role: "user",
				content: `Generate a tutor handoff artifact for this AI tutoring session.

Student: ${session.studentName}, Grade ${session.gradeLevel}
Topic: ${session.topic}
Session duration: ${getSessionDuration(session)}
Problems attempted: ${session.attempts.length}

Transcript:
${transcript}

Gaps identified during session: ${gapsJson}
Misconceptions identified: ${misconceptionsJson}
Recent diagnostic snapshots: ${JSON.stringify(latestDiagnostics)}`,
			},
		],
	});

	const rawContent =
		response.content[0].type === "text" ? response.content[0].text : "";

	try {
		const data = JSON.parse(rawContent);
		return {
			sessionId: session.id,
			studentName: session.studentName,
			gradeLevel: session.gradeLevel,
			topic: session.topic,
			sessionDuration: getSessionDuration(session),
			summary: data.summary || "",
			problemsAttempted: session.attempts.map((a) => ({
				question: a.problem.question,
				status: a.status,
				messageCount: a.messages.length,
			})),
			knowledgeGaps: (data.knowledgeGaps || []).map(
				(g: { concept: string; severity: string; evidence: string }) => ({
					concept: g.concept,
					severity: g.severity as KnowledgeGap["severity"],
					evidence: g.evidence,
					identifiedAt: new Date().toISOString(),
				}),
			),
			misconceptions: (data.misconceptions || []).map(
				(m: { description: string; evidence: string }) => ({
					description: m.description,
					evidence: m.evidence,
					identifiedAt: new Date().toISOString(),
				}),
			),
			priorities: data.priorities || [],
			suggestedApproach: data.suggestedApproach || "",
			strengthsObserved: data.strengthsObserved || [],
		};
	} catch {
		return {
			sessionId: session.id,
			studentName: session.studentName,
			gradeLevel: session.gradeLevel,
			topic: session.topic,
			sessionDuration: getSessionDuration(session),
			summary: rawContent,
			problemsAttempted: session.attempts.map((a) => ({
				question: a.problem.question,
				status: a.status,
				messageCount: a.messages.length,
			})),
			knowledgeGaps: session.knowledgeGaps,
			misconceptions: session.misconceptions,
			priorities: [],
			suggestedApproach: "",
			strengthsObserved: [],
		};
	}
}

function getSessionDuration(session: Session): string {
	const start = new Date(session.startedAt).getTime();
	const end = session.completedAt
		? new Date(session.completedAt).getTime()
		: Date.now();
	const minutes = Math.round((end - start) / 60000);
	return `${minutes} min`;
}
