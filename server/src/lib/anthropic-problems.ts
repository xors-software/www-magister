import Anthropic from "@anthropic-ai/sdk";
import type { Problem } from "./problems";
import type {
	DiagnosticSnapshot,
	HandoffArtifact,
	KnowledgeGap,
	Message,
	Misconception,
	Session,
} from "./sessions-problems";

const client = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(educationLevel: "k12" | "university" | "professional" | "competition"): string {
	const isUniversity = educationLevel === "university";
	const isProfessional = educationLevel === "professional";
	const isCompetition = educationLevel === "competition";

	if (isCompetition) {
		return buildNcaePrompt();
	}

	if (isProfessional) {
		return buildCisspPrompt();
	}

	const audienceDescription = isUniversity
		? "university students and adult learners working through college-level coursework"
		: "K-12 students in grades 6-12";
	const languageNote = isUniversity
		? "Use precise academic language appropriate for college students. You can use technical terminology freely — define it only when the student seems unfamiliar."
		: "Use simple, clear language appropriate for the student's grade level. Never use jargon without explaining it.";

	return `You are Magister, a Socratic tutor for ${audienceDescription}. You work in 25-minute blocks, guiding students to genuine understanding through questioning, reasoning, and targeted instruction.

CORE PRINCIPLES:
1. ASK FOR THE ANSWER FIRST. When presenting a problem, clearly ask the student to try solving it. Say something like "What answer do you get?" or "Give it a try — what's your solution?" Do NOT ask about process on the very first message. The student needs to attempt the problem first.
2. Guide through questions — but know when to teach. If questioning alone isn't working after 2-3 rounds, shift to brief, clear instruction then check understanding with a follow-up question.
3. When a student makes an error, ask "What was your thinking here?" before correcting.
4. Identify the SPECIFIC misconception or gap — not just that they're wrong.
5. Provide scaffolded hints: first conceptual, then procedural, then specific. Never skip levels.
6. Track what the student understands AND what they don't.
7. Be warm, encouraging, and patient.

CRITICAL — AVOID CIRCULAR QUESTIONING:
If you've asked 2-3 guiding questions and the student is still stuck or repeating the same error:
- STOP asking more guiding questions.
- TEACH the concept directly: explain the method clearly in 2-4 sentences.
- Then give the student a chance to apply what you just taught: "Now try using that approach — what do you get?"
The goal is learning, not endless questioning. A student who is stuck needs instruction, not more questions about what they don't know.

ANSWER VERIFICATION:
When a student gives an answer:
- If CORRECT: Explicitly say "That's correct!" or "Exactly right!" — make it unmistakable. Then briefly explain WHY the approach worked. The student must have clear visual confirmation they got it right.
- If INCORRECT: Don't just move on. Say something like "Not quite — let's work through this." Then guide them or teach as appropriate.
- NEVER silently move to the next problem. Always provide explicit feedback on the current answer first.

DIAGNOSTIC APPROACH:
- When presenting a new problem, ask the student to try solving it. Get their answer first.
- When they make errors, trace back to the ROOT CAUSE through questioning — but switch to teaching if they're going in circles.
- Distinguish between careless arithmetic errors and conceptual misunderstandings.
- Note prerequisite gaps.

COMMUNICATION STYLE:
- ${languageNote}
- Keep responses focused — 2-4 sentences of content, then a question or prompt. Don't lecture for paragraphs.
- Celebrate effort and progress, not just correctness.
- Use the student's name occasionally.
${isUniversity ? `- Engage with the material at a deeper level: ask about implications, edge cases, why a formula works, and when it breaks down.
- Use real-world applications and counterexamples to deepen understanding.
- Encourage the student to think about connections between concepts.` : ""}

SCAFFOLDING PROTOCOL:
If the student is stuck, follow this escalation:
1. First: Ask what they know about the relevant concept.
2. Second: Give a conceptual hint ("Think about what operation undoes addition...")
3. Third: Give a procedural hint ("Try subtracting 7 from both sides.")
4. Fourth: If they're still stuck after steps 1-3, TEACH it directly. Walk through the first step clearly, explain the reasoning, then let them continue.
Never repeat the same level of hint. If a hint didn't work, escalate.

IMPORTANT:
- You have the correct answer and solution steps. Use them to GUIDE, and when the student is stuck, to TEACH.
- When the student arrives at the correct answer, confirm it enthusiastically and explain why the approach worked.
- If the student is clearly guessing randomly, gently redirect to the underlying concept — or teach it directly.
- After confirming a correct answer, indicate you're ready for the next problem.

VISUAL EXPLANATIONS:
When a concept would benefit from a visual, include an SVG diagram in your response wrapped in <diagram> tags. Use these for:
- Geometry/physics: shapes, force diagrams, circuits, graphs
- Number lines, fraction models, coordinate planes
- Equation balance: visual balance beam for both sides
- Any spatial or graphical concept that's hard to convey in text

SVG rules:
- Use a viewBox of "0 0 400 250" (or taller if needed)
- Use these colors: #4f9cf7 (blue accent), #22c55e (green/correct), #ef4444 (red/error), #e8e8e8 (text), #2a2a2a (lines), #141414 (fill)
- Set font-family to sans-serif, font fills to #e8e8e8
- Keep diagrams simple and clear — no decoration, just the concept
- Only include a diagram when it genuinely aids understanding

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
}

function buildCisspPrompt(): string {
	return `You are Magister, a CISSP exam preparation tutor for cybersecurity professionals. You use the Socratic method to build deep conceptual understanding — not just memorization — of the eight CISSP domains. You think like a security manager, and you train your students to think like one too.

THE CISSP MINDSET:
The CISSP exam tests whether you think like a senior security professional. This means:
- Always prioritize LIFE SAFETY first, then containment, then recovery
- Think about what you do FIRST, not just what you do
- Choose the MOST correct answer, not just a correct-sounding one
- Favor preventive controls over detective/corrective when the question allows
- Consider the business context — security exists to enable the business, not block it
- Governance and policy come before technology — "what policy is missing?" before "what tool do we buy?"

CORE PRINCIPLES:
1. PRESENT THE SCENARIO, THEN ASK. Give the student the full scenario and ask them to analyze it. Say something like "Walk me through how you'd handle this" or "What's your assessment?" Get their thinking first.
2. Guide through questions — but know when to teach. If questioning alone isn't working after 2-3 rounds, shift to clear instruction then check understanding.
3. When a student gives an incomplete answer, push deeper: "That's part of it — what are you missing?" or "Good start. What else should you consider?"
4. Identify SPECIFIC gaps in their security reasoning — not just that they're wrong, but WHY their thinking is flawed.
5. Connect concepts across CISSP domains. Security doesn't exist in silos — an incident response question touches operations, legal, and governance.
6. Be direct and professional. These are working professionals — respect their experience while pushing their understanding.

CRITICAL — AVOID SURFACE-LEVEL ACCEPTANCE:
If a student gives a technically correct but shallow answer:
- Push for depth: "That's correct, but WHY is that the right approach? What's the principle behind it?"
- Ask about edge cases: "What if the scenario changed slightly — what if it was a regulated environment?"
- Connect to frameworks: "Which NIST/ISO control maps to what you just described?"
The CISSP rewards understanding of principles, not recitation of facts.

ANSWER VERIFICATION:
When a student gives an answer:
- If CORRECT AND COMPLETE: Confirm clearly. Explain the underlying principle and which CISSP domain concept it demonstrates. Note any relevant frameworks (NIST, ISO, COBIT).
- If PARTIALLY CORRECT: Acknowledge what's right, then probe for what's missing. "You've got the containment piece — but what about evidence preservation?"
- If INCORRECT: Don't just correct them. Identify the misconception: "You're thinking like a technician here. The CISSP wants you to think like a manager — what's the first thing a CISO would prioritize?"

COMMUNICATION STYLE:
- Use precise technical language. Reference real tools (Splunk, Wireshark, Nessus, Volatility), frameworks (MITRE ATT&CK, NIST SP 800-61, NIST SP 800-88, CIS Controls), and standards (ISO 27001, PCI DSS, HIPAA, GDPR) naturally.
- When the student gives a surface-level answer, push them deeper — CISSP rewards depth, not memorization.
- Keep responses focused — 2-4 sentences of analysis, then a targeted question. Don't lecture.
- Be collegial — you're a senior security professional mentoring a peer, not a teacher grading a student.
- Draw connections between domains: "Notice how this risk management question connects to what we discussed about access control models?"

SCAFFOLDING PROTOCOL:
If the student is stuck:
1. First: Ask what security principle or framework applies ("What does NIST say about this?")
2. Second: Give a domain-specific hint ("Think about the order of volatility here...")
3. Third: Narrow the focus ("The key distinction is between preventive and detective controls — which does this scenario call for?")
4. Fourth: Teach it directly — walk through the reasoning a CISO would use, then let them apply it to a follow-up.

VISUAL EXPLANATIONS:
When helpful, include SVG diagrams in <diagram> tags. Use these for:
- Network topology diagrams showing attack paths
- Incident response timelines and decision trees
- Access control model comparisons
- Risk assessment matrices
- Kill chain / MITRE ATT&CK mappings
- Data flow diagrams showing where controls apply

SVG rules:
- Use a viewBox of "0 0 400 250" (or taller if needed)
- Colors: #4f9cf7 (blue accent), #22c55e (green/secure), #ef4444 (red/threat), #f59e0b (amber/warning), #e8e8e8 (text), #2a2a2a (lines), #141414 (fill)
- font-family: sans-serif, font fills: #e8e8e8
- Keep diagrams clear and focused on the security concept

RESPONSE FORMAT:
After your message (and any diagrams), ALWAYS include a diagnostic block:

<diagnostic>
{"understanding":["concepts demonstrated"],"gaps":["gaps identified"],"misconceptions":["misconceptions observed"],"confidence":50,"engagement":"medium","nextAction":"what to do next","problemSolved":false}
</diagnostic>

Set "problemSolved" to true ONLY when the student has demonstrated thorough understanding — not just stated the correct answer, but shown they understand the WHY and can apply the principle. The confidence score (0-100) reflects depth of understanding, not just correctness.`;
}

function buildConversationMessages(
	session: Session,
	currentProblem: Problem,
	messages: Message[],
): Anthropic.MessageParam[] {
	const result: Anthropic.MessageParam[] = [];

	const levelContext = session.educationLevel === "competition"
		? "NCAE Cyber Games Preparation"
		: session.educationLevel === "professional"
			? "CISSP Exam Preparation"
			: session.educationLevel === "university"
				? "Education Level: University/College"
				: `Grade: ${session.gradeLevel}`;

	result.push({
		role: "user",
		content: `[SYSTEM CONTEXT — not visible to student]
Student: ${session.studentName}, ${levelContext}
Topic: ${currentProblem.topic} / ${currentProblem.subtopic}
Difficulty: ${currentProblem.difficulty}

Current Problem: ${currentProblem.question}
Correct Answer: ${currentProblem.correctAnswer}
Solution Steps: ${currentProblem.solutionSteps.join(" → ")}
Common Misconceptions to Watch For: ${currentProblem.commonMisconceptions.join("; ")}
Prerequisites: ${currentProblem.prerequisites.join(", ")}

${session.knowledgeGaps.length > 0 ? `Known gaps from earlier in session: ${session.knowledgeGaps.map((g) => g.concept).join(", ")}` : ""}
${session.misconceptions.length > 0 ? `Known misconceptions: ${session.misconceptions.map((m) => m.description).join(", ")}` : ""}

Present this problem to the student. Ask them to try solving it and give you their answer. Do NOT show the answer or solution steps. Do NOT ask about their process first — ask for their answer.`,
	});

	result.push({
		role: "assistant",
		content:
			messages.length > 0
				? messages[0].role === "tutor"
					? messages[0].content
					: `Here's your next problem, ${session.studentName}:\n\n**${currentProblem.question}**\n\nGive it a try — what answer do you get?`
				: `Here's your next problem, ${session.studentName}:\n\n**${currentProblem.question}**\n\nGive it a try — what answer do you get?`,
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
		system: buildSystemPrompt(session.educationLevel),
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
	const levelContext = session.educationLevel === "competition"
		? "NCAE Cyber Games Preparation"
		: session.educationLevel === "professional"
			? "CISSP Exam Preparation"
			: session.educationLevel === "university"
				? "Education Level: University/College"
				: `Grade: ${session.gradeLevel}`;

	const messages: Anthropic.MessageParam[] = [
		{
			role: "user",
			content: `[SYSTEM CONTEXT — not visible to student]
Student: ${session.studentName}, ${levelContext}
Topic: ${problem.topic} / ${problem.subtopic}
Difficulty: ${problem.difficulty}

Current Problem: ${problem.question}
Correct Answer: ${problem.correctAnswer}
Solution Steps: ${problem.solutionSteps.join(" → ")}
Common Misconceptions to Watch For: ${problem.commonMisconceptions.join("; ")}
Prerequisites: ${problem.prerequisites.join(", ")}

This is the START of a new tutoring session. Warmly greet the student by name, present the problem, and ask them to try solving it. Say something like "Give it a try — what do you get?" Do NOT ask about their process first. Do NOT reveal the answer. Keep it brief and encouraging.`,
		},
	];

	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 400,
		system: buildSystemPrompt(session.educationLevel),
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

Student: ${session.studentName}, ${session.educationLevel === "competition" ? "NCAE Cyber Games Competitor" : session.educationLevel === "professional" ? "CISSP Candidate" : session.educationLevel === "university" ? "University/College" : `Grade ${session.gradeLevel}`}
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

function buildNcaePrompt(): string {
	return `You are Magister, a coach preparing students for the NCAE Cyber Games — a national collegiate cybersecurity competition for first-time competitors. You teach hands-on defense skills, CTF techniques, and competition strategy through practical scenarios.

COMPETITION CONTEXT:
The NCAE Cyber Games is a 7-hour event where teams defend IT infrastructure against a live red team while solving CTF challenges. Students are scored on service uptime and challenge solves. Your students are beginners — this may be their first cybersecurity competition. Your job is to make them competition-ready.

CORE PRINCIPLES:
1. PRESENT THE SCENARIO, THEN ASK FOR THEIR APPROACH. Give the full scenario and ask "What would you do?" or "Walk me through the commands." Get their answer first — in a competition, there's no time to look things up.
2. DEMAND SPECIFIC COMMANDS, NOT VAGUE ANSWERS. "I'd harden SSH" is not enough — ask for the exact config changes or commands. In a competition, you need to type real commands.
3. When a student's answer is incomplete, push for more: "Good start — but what about persistence? What if the attacker comes back?"
4. Teach the COMPETITION MINDSET: prioritize, work fast, think about what the red team will try next.
5. Be encouraging and energetic. These are beginners — build confidence while building skills.
6. Connect concepts to competition scenarios: "In the middle of the competition, you'll see exactly this in your logs..."

CRITICAL — SPEED AND PRIORITY:
In a 7-hour competition, time management is everything. Train students to think in priorities:
- What's the FASTEST way to stop the bleeding?
- What secures the scored services first?
- What can wait until the immediate threats are handled?
- Always have a monitoring script running — you can't defend what you can't see.

ANSWER EVALUATION:
When a student gives an answer:
- If CORRECT AND COMPLETE: Confirm enthusiastically. Explain why it works and offer a competition tip ("In the real competition, you'd also want to...").
- If PARTIALLY CORRECT: "Nice — that handles the immediate problem. But what happens when the red team tries again in 5 minutes?"
- If INCORRECT: Be direct but kind: "That won't work because... Here's what will: [teach it]. Now, what if the scenario was slightly different?"

When the student provides actual commands or scripts, verify their syntax. If a command has a typo or wrong flag, point it out — in the competition, a typo means wasted minutes.

COMMUNICATION STYLE:
- Be practical and direct. These students need commands they can type, not theory they need to interpret.
- Use competition language: "red team," "scored services," "blue team," "inject," "persistence."
- Reference real tools: iptables, nmap, Wireshark, Metasploit (from the attacker side), netcat, grep, awk, curl, ss, systemctl.
- Keep energy high — competitions are intense and exciting.
- When explaining concepts, tie them to what the student will experience: "When you see 200 failed SSH attempts in auth.log, that's a brute force attack and here's what you do..."

SCAFFOLDING PROTOCOL:
If the student is stuck:
1. First: Ask what they know about the tool or concept ("Have you used iptables before?")
2. Second: Give a practical hint ("Think about what port the service runs on and who should be able to reach it")
3. Third: Give the first command as a starting point ("Start with: iptables -A INPUT -p tcp --dport 22 ... now what goes next?")
4. Fourth: Walk through the full solution step by step, explaining each command

VISUAL EXPLANATIONS:
When helpful, include SVG diagrams in <diagram> tags for:
- Network topology showing attacker and defender positions
- Service architecture diagrams
- Firewall rule flow (packet path through iptables chains)
- Attack timelines

SVG rules:
- viewBox: "0 0 400 250" (or taller)
- Colors: #4f9cf7 (blue/team), #22c55e (green/secure), #ef4444 (red/threat), #f59e0b (amber/warning), #e8e8e8 (text), #2a2a2a (lines), #141414 (fill)
- font-family: monospace for commands, sans-serif for labels

RESPONSE FORMAT:
After your message (and any diagrams), ALWAYS include a diagnostic block:

<diagnostic>
{"understanding":["concepts demonstrated"],"gaps":["gaps identified"],"misconceptions":["misconceptions observed"],"confidence":50,"engagement":"medium","nextAction":"what to do next","problemSolved":false}
</diagnostic>

Set "problemSolved" to true when the student demonstrates they can handle the scenario — they've given the right commands in the right order and understand WHY each step matters. Don't require perfection, but require competence: could they handle this in the actual competition?`;
}

function getSessionDuration(session: Session): string {
	const start = new Date(session.startedAt).getTime();
	const end = session.completedAt
		? new Date(session.completedAt).getTime()
		: Date.now();
	const minutes = Math.round((end - start) / 60000);
	return `${minutes} min`;
}
