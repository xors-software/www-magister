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

// Railway-managed Postgres requires SSL; the platform uses a self-signed
// cert chain for the proxy, so disable strict verification.
const isRailway =
	DATABASE_URL.includes(".rlwy.net") ||
	DATABASE_URL.includes(".railway.app") ||
	DATABASE_URL.includes(".railway.internal");
export const sql = postgres(DATABASE_URL, {
	max: 8,
	idle_timeout: 30,
	connect_timeout: 10,
	ssl: isRailway ? { rejectUnauthorized: false } : "prefer",
	// Suppress "relation already exists" NOTICE spam from idempotent migrations.
	onnotice: () => {},
});

let migrated = false;

// Retry on boot — Railway sometimes starts the app before the DB is fully
// reachable. We back off, then surface a clear error if every attempt fails.
export async function runMigrationsWithRetry(maxAttempts = 5): Promise<void> {
	let lastErr: unknown;
	for (let i = 1; i <= maxAttempts; i++) {
		try {
			await runMigrations();
			return;
		} catch (err) {
			lastErr = err;
			console.error(
				`[pg] migration attempt ${i}/${maxAttempts} failed:`,
				err instanceof Error ? err.message : err,
			);
			if (i < maxAttempts) {
				await new Promise((r) => setTimeout(r, 2000 * i));
			}
		}
	}
	throw lastErr instanceof Error
		? lastErr
		: new Error("Postgres migrations failed after retries");
}

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
	// Add password_hash column for existing deployments. Nullable so legacy
	// rows survive the migration; rows without a hash get one set on next
	// successful login (effectively a one-time grace).
	await sql`
		ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
	`;
	// Google OAuth: `google_sub` is Google's stable user ID (the `sub` claim
	// in the ID token). Nullable so password-only users coexist; users who
	// link Google get this set. Unique so two accounts can't claim the same
	// Google identity.
	await sql`
		ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE
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
	// `track` segments quizzes by certification/curriculum (claude-code,
	// ai-fundamentals, …). Default backfills existing rows to claude-code.
	await sql`
		ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'claude-code'
	`;
	await sql`
		CREATE INDEX IF NOT EXISTS quizzes_user_idx ON quizzes(user_id, started_at DESC)
	`;
	await sql`
		CREATE INDEX IF NOT EXISTS quizzes_user_track_idx ON quizzes(user_id, track, started_at DESC)
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
	// Single-use password reset tokens. We don't have email infra yet, so
	// the URL is logged to stdout — an admin watches Railway logs and shares
	// the link out of band (Slack/etc). Tokens expire after RESET_TTL_MIN.
	await sql`
		CREATE TABLE IF NOT EXISTS password_reset_tokens (
			token TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			expires_at TIMESTAMPTZ NOT NULL,
			used_at TIMESTAMPTZ
		)
	`;
	await sql`
		CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
			ON password_reset_tokens(user_id, created_at DESC)
	`;
	migrated = true;
}
