// Postgres client + schema bootstrap.
//
// Schema is created on first connect; safe to re-run (CREATE TABLE IF NOT
// EXISTS). Add new migrations as additional `runMigrations` blocks rather
// than mutating existing ones, so the schema converges across deployments.

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error(
		"DATABASE_URL is required. Set it in server/.env (Postgres connection string).",
	);
}

export const sql = postgres(DATABASE_URL, {
	max: 8,
	idle_timeout: 30,
	connect_timeout: 10,
	// Railway requires SSL; node-postgres style works fine with porsager/postgres.
	ssl: "prefer",
});

let migrated = false;

export async function runMigrations(): Promise<void> {
	if (migrated) return;
	await sql`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			display_name TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS auth_sessions (
			token TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			expires_at TIMESTAMPTZ NOT NULL
		)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS quizzes (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			config JSONB NOT NULL,
			question_ids TEXT[] NOT NULL,
			current_index INT NOT NULL DEFAULT 0,
			started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			completed_at TIMESTAMPTZ,
			time_limit_seconds INT
		)
	`;
	await sql`
		CREATE INDEX IF NOT EXISTS quizzes_user_idx ON quizzes(user_id, started_at DESC)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS quiz_answers (
			quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
			question_id TEXT NOT NULL,
			selected TEXT,
			correct BOOLEAN NOT NULL,
			time_ms INT,
			answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (quiz_id, question_id)
		)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS generated_questions (
			id TEXT PRIMARY KEY,
			scenario TEXT NOT NULL,
			domain TEXT NOT NULL,
			tasks TEXT[] NOT NULL DEFAULT '{}',
			mode TEXT NOT NULL DEFAULT 'canonical',
			difficulty TEXT NOT NULL DEFAULT 'medium',
			stem TEXT NOT NULL,
			choices JSONB NOT NULL,
			correct TEXT NOT NULL,
			explanation TEXT NOT NULL,
			distractor_rationales JSONB NOT NULL,
			study_tags TEXT[] NOT NULL DEFAULT '{}',
			generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			generated_for_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
			generation_context JSONB,
			human_rated INT
		)
	`;
	await sql`
		CREATE INDEX IF NOT EXISTS generated_questions_scope_idx
			ON generated_questions(scenario, domain, generated_for_user_id)
	`;
	migrated = true;
}
