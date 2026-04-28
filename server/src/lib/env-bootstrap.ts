// Load server/.env into process.env, but prefer file values when the
// existing process value is empty. Bun's auto-loading respects an empty
// shell-exported var (the Claude for Desktop launcher sets
// ANTHROPIC_API_KEY="" globally, which silently breaks our setup).
//
// Imported once from the server entry before any module that depends
// on env reads it.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(import.meta.dir, "../../.env");

try {
	const text = readFileSync(envPath, "utf-8");
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, "");
		if (!process.env[key] || process.env[key] === "") {
			process.env[key] = value;
		}
	}
} catch (err) {
	// Best-effort; missing .env is fine if env is wired through some
	// other mechanism (Railway env vars, shell exports, etc).
}
