import db from "./db";

export interface Message {
	id: number;
	sessionId: string;
	role: "student" | "tutor";
	content: string;
	diagrams: string[];
	diagnostic: DiagnosticSnapshot | null;
	createdAt: string;
}

export interface DiagnosticSnapshot {
	understanding: string[];
	gaps: string[];
	misconceptions: string[];
	confidence: number;
	engagement: "high" | "medium" | "low";
	nextAction: string;
}

export interface Session {
	id: string;
	courseId: string;
	studentName: string;
	status: "active" | "completed";
	startedAt: string;
	completedAt: string | null;
}

function generateId(): string {
	return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function rowToSession(row: Record<string, unknown>): Session {
	return {
		id: row.id as string,
		courseId: row.course_id as string,
		studentName: row.student_name as string,
		status: row.status as "active" | "completed",
		startedAt: row.started_at as string,
		completedAt: (row.completed_at as string) || null,
	};
}

function rowToMessage(row: Record<string, unknown>): Message {
	return {
		id: row.id as number,
		sessionId: row.session_id as string,
		role: row.role as "student" | "tutor",
		content: row.content as string,
		diagrams: row.diagrams ? JSON.parse(row.diagrams as string) : [],
		diagnostic: row.diagnostic ? JSON.parse(row.diagnostic as string) : null,
		createdAt: row.created_at as string,
	};
}

export function createSession(courseId: string, studentName: string): Session {
	const id = generateId();
	const now = new Date().toISOString();
	db.query(
		"INSERT INTO sessions (id, course_id, student_name, status, started_at) VALUES (?, ?, ?, 'active', ?)",
	).run(id, courseId, studentName, now);
	return { id, courseId, studentName, status: "active", startedAt: now, completedAt: null };
}

export function getSession(id: string): Session | null {
	const row = db.query("SELECT * FROM sessions WHERE id = ?").get(id) as Record<string, unknown> | null;
	return row ? rowToSession(row) : null;
}

export function completeSession(id: string): Session | null {
	const now = new Date().toISOString();
	db.query("UPDATE sessions SET status = 'completed', completed_at = ? WHERE id = ?").run(now, id);
	return getSession(id);
}

export function getSessionsByCourse(courseId: string): Session[] {
	const rows = db.query(
		"SELECT * FROM sessions WHERE course_id = ? ORDER BY started_at DESC",
	).all(courseId) as Record<string, unknown>[];
	return rows.map(rowToSession);
}

export function getAllSessions(): Session[] {
	const rows = db.query("SELECT * FROM sessions ORDER BY started_at DESC").all() as Record<string, unknown>[];
	return rows.map(rowToSession);
}

export function addMessage(
	sessionId: string,
	role: "student" | "tutor",
	content: string,
	diagrams: string[] = [],
	diagnostic: DiagnosticSnapshot | null = null,
): Message {
	const now = new Date().toISOString();
	const diagramsJson = diagrams.length > 0 ? JSON.stringify(diagrams) : null;
	const diagnosticJson = diagnostic ? JSON.stringify(diagnostic) : null;

	const result = db.query(
		"INSERT INTO messages (session_id, role, content, diagrams, diagnostic, created_at) VALUES (?, ?, ?, ?, ?, ?)",
	).run(sessionId, role, content, diagramsJson, diagnosticJson, now);

	return {
		id: Number(result.lastInsertRowid),
		sessionId,
		role,
		content,
		diagrams,
		diagnostic,
		createdAt: now,
	};
}

export function getMessages(sessionId: string): Message[] {
	const rows = db.query(
		"SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC",
	).all(sessionId) as Record<string, unknown>[];
	return rows.map(rowToMessage);
}

export function getLatestDiagnostic(sessionId: string): DiagnosticSnapshot | null {
	const row = db.query(
		"SELECT diagnostic FROM messages WHERE session_id = ? AND diagnostic IS NOT NULL ORDER BY id DESC LIMIT 1",
	).get(sessionId) as Record<string, unknown> | null;
	if (!row?.diagnostic) return null;
	return JSON.parse(row.diagnostic as string);
}
