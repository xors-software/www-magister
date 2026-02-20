import type { Problem, Topic } from "./problems";

export interface KnowledgeGap {
	concept: string;
	severity: "critical" | "moderate" | "minor";
	evidence: string;
	identifiedAt: string;
}

export interface Misconception {
	description: string;
	evidence: string;
	identifiedAt: string;
}

export interface DiagnosticSnapshot {
	understanding: string[];
	gaps: string[];
	misconceptions: string[];
	confidence: number;
	engagement: "high" | "medium" | "low";
	nextAction: string;
}

export interface Message {
	role: "student" | "tutor";
	content: string;
	diagrams?: string[];
	timestamp: string;
	diagnostic?: DiagnosticSnapshot;
}

export interface ProblemAttempt {
	problem: Problem;
	messages: Message[];
	status: "in-progress" | "solved" | "moved-on";
	diagnostics: DiagnosticSnapshot[];
	startedAt: string;
	completedAt?: string;
}

export interface Session {
	id: string;
	studentName: string;
	gradeLevel: number;
	topic: Topic;
	status: "active" | "completed";
	currentProblemIndex: number;
	attempts: ProblemAttempt[];
	knowledgeGaps: KnowledgeGap[];
	misconceptions: Misconception[];
	startedAt: string;
	completedAt?: string;
}

export interface HandoffArtifact {
	sessionId: string;
	studentName: string;
	gradeLevel: number;
	topic: string;
	sessionDuration: string;
	summary: string;
	problemsAttempted: {
		question: string;
		status: "solved" | "moved-on" | "in-progress";
		messageCount: number;
	}[];
	knowledgeGaps: KnowledgeGap[];
	misconceptions: Misconception[];
	priorities: string[];
	suggestedApproach: string;
	strengthsObserved: string[];
}

const sessions = new Map<string, Session>();

function generateId(): string {
	return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(
	studentName: string,
	gradeLevel: number,
	topic: Topic,
): Session {
	const session: Session = {
		id: generateId(),
		studentName,
		gradeLevel,
		topic,
		status: "active",
		currentProblemIndex: 0,
		attempts: [],
		knowledgeGaps: [],
		misconceptions: [],
		startedAt: new Date().toISOString(),
	};
	sessions.set(session.id, session);
	return session;
}

export function getSession(id: string): Session | undefined {
	return sessions.get(id);
}

export function updateSession(id: string, updates: Partial<Session>): Session | undefined {
	const session = sessions.get(id);
	if (!session) return undefined;
	Object.assign(session, updates);
	return session;
}

export function addMessage(sessionId: string, message: Message): Session | undefined {
	const session = sessions.get(sessionId);
	if (!session) return undefined;

	const currentAttempt = session.attempts[session.currentProblemIndex];
	if (currentAttempt) {
		currentAttempt.messages.push(message);
		if (message.diagnostic) {
			currentAttempt.diagnostics.push(message.diagnostic);
		}
	}
	return session;
}

export function startProblemAttempt(sessionId: string, problem: Problem): Session | undefined {
	const session = sessions.get(sessionId);
	if (!session) return undefined;

	const attempt: ProblemAttempt = {
		problem,
		messages: [],
		status: "in-progress",
		diagnostics: [],
		startedAt: new Date().toISOString(),
	};
	session.attempts.push(attempt);
	session.currentProblemIndex = session.attempts.length - 1;
	return session;
}

export function addKnowledgeGap(sessionId: string, gap: KnowledgeGap): void {
	const session = sessions.get(sessionId);
	if (!session) return;
	const exists = session.knowledgeGaps.some(
		(g) => g.concept.toLowerCase() === gap.concept.toLowerCase(),
	);
	if (!exists) {
		session.knowledgeGaps.push(gap);
	}
}

export function addMisconception(sessionId: string, misconception: Misconception): void {
	const session = sessions.get(sessionId);
	if (!session) return;
	session.misconceptions.push(misconception);
}

export function getAllSessions(): Session[] {
	return Array.from(sessions.values());
}
