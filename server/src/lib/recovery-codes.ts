// Self-serve password recovery via single-use codes.
//
// Flow:
//   1. Logged-in user visits /account/recovery-codes and clicks Generate.
//      Server hashes 8 fresh codes (replacing any previous set), returns
//      the plaintext list ONCE. User is told to save them.
//   2. If the user later forgets their password, /forgot-password's
//      "I have a recovery code" branch takes their email + a code + new
//      password. We find the user, brute-check the code against each of
//      their unused hashes, mark the matching one used, set the password,
//      kill all sessions. Generic error response on every failure path so
//      we don't leak which of email/code is wrong.
//
// Hashing: argon2id, same as passwords. Codes are 16 hex chars (~64 bits
// of entropy) so brute-forcing is infeasible at any reasonable rate
// limit. Verifying takes ~100ms per attempt because argon2id is slow on
// purpose; with up to 8 unused codes per user, a worst-case verify pass
// is ~800ms — acceptable for a flow that runs rarely.

import { sql } from "./pg";

const CODE_COUNT = 8;
const CODE_BYTES = 8; // 8 bytes → 16 hex chars → 64 bits of entropy
const MIN_PASSWORD_LEN = 8;

export type GenerateOutcome =
	| { kind: "ok"; codes: string[] }
	| { kind: "user_not_found" };

export type RecoveryResetOutcome =
	| { kind: "ok"; userId: string }
	// Single generic failure kind so the API can't be used to enumerate
	// which-of-email-or-code is wrong.
	| { kind: "invalid" }
	| { kind: "weak_password" };

function generateCode(): string {
	const bytes = new Uint8Array(CODE_BYTES);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateCodeId(): string {
	return `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Format a 16-char hex code as `xxxx-xxxx-xxxx-xxxx` for display.
// Verification accepts both formats — see normalizeCode.
export function formatCodeForDisplay(code: string): string {
	const bare = code.toLowerCase().replace(/[^0-9a-f]/g, "");
	if (bare.length !== CODE_BYTES * 2) return code;
	return `${bare.slice(0, 4)}-${bare.slice(4, 8)}-${bare.slice(8, 12)}-${bare.slice(12, 16)}`;
}

// Strip dashes and whitespace, lowercase. Users may paste either form.
function normalizeCode(code: string): string {
	return code.toLowerCase().replace(/[\s-]/g, "");
}

// Generate a fresh batch for the given user. Wipes any previous unused
// codes — only one set should be valid at a time, so a regenerate
// effectively invalidates the old (presumably misplaced) batch.
export async function generateRecoveryCodes(userId: string): Promise<GenerateOutcome> {
	const userRows = await sql<{ id: string }[]>`SELECT id FROM users WHERE id = ${userId}`;
	if (userRows.length === 0) return { kind: "user_not_found" };

	const codes: string[] = [];
	for (let i = 0; i < CODE_COUNT; i++) codes.push(generateCode());

	// Hash all codes outside the transaction (CPU-bound, no DB locks held).
	const hashed: { id: string; hash: string }[] = [];
	for (const code of codes) {
		const hash = await Bun.password.hash(code, { algorithm: "argon2id" });
		hashed.push({ id: generateCodeId(), hash });
	}

	await sql.begin(async (tx) => {
		// Wipe all previous codes (used or unused). A fresh batch is a
		// fresh start; old ones are no longer expected to work.
		await tx`DELETE FROM recovery_codes WHERE user_id = ${userId}`;
		for (const h of hashed) {
			await tx`
				INSERT INTO recovery_codes (id, user_id, code_hash)
				VALUES (${h.id}, ${userId}, ${h.hash})
			`;
		}
		await tx`UPDATE users SET recovery_codes_generated_at = NOW() WHERE id = ${userId}`;
	});

	return { kind: "ok", codes };
}

export interface RecoveryCodesStatus {
	hasCodes: boolean;
	generatedAt: string | null;
	unusedCount: number;
	usedCount: number;
}

export async function getRecoveryCodesStatus(userId: string): Promise<RecoveryCodesStatus> {
	const rows = await sql<{
		generated_at: string | null;
		unused: number;
		used: number;
	}[]>`
		SELECT
			u.recovery_codes_generated_at AS generated_at,
			COUNT(c.id) FILTER (WHERE c.used_at IS NULL)::int AS unused,
			COUNT(c.id) FILTER (WHERE c.used_at IS NOT NULL)::int AS used
		FROM users u
		LEFT JOIN recovery_codes c ON c.user_id = u.id
		WHERE u.id = ${userId}
		GROUP BY u.recovery_codes_generated_at
	`;
	if (rows.length === 0) {
		return { hasCodes: false, generatedAt: null, unusedCount: 0, usedCount: 0 };
	}
	const r = rows[0];
	return {
		hasCodes: r.unused > 0,
		generatedAt: r.generated_at,
		unusedCount: r.unused,
		usedCount: r.used,
	};
}

// Validate a code + email and reset the password atomically. Generic
// failure returned for every error path that touches user-controlled
// input, so callers can't distinguish "no such email" from "code didn't
// match" from "code already used".
export async function consumeRecoveryCodeAndResetPassword(
	email: string,
	code: string,
	newPassword: string,
): Promise<RecoveryResetOutcome> {
	if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LEN) {
		return { kind: "weak_password" };
	}
	const cleanedEmail = email.trim().toLowerCase();
	const cleanedCode = normalizeCode(code);
	if (cleanedCode.length !== CODE_BYTES * 2 || !/^[0-9a-f]+$/.test(cleanedCode)) {
		return { kind: "invalid" };
	}

	const userRows = await sql<{ id: string }[]>`
		SELECT id FROM users WHERE email = ${cleanedEmail}
	`;
	if (userRows.length === 0) return { kind: "invalid" };
	const userId = userRows[0].id;

	const codeRows = await sql<{ id: string; code_hash: string }[]>`
		SELECT id, code_hash FROM recovery_codes
		WHERE user_id = ${userId} AND used_at IS NULL
	`;
	if (codeRows.length === 0) return { kind: "invalid" };

	// Brute-check across the (≤ 8) unused codes. Bun.password.verify is
	// ~100ms per call so this is up to ~800ms; acceptable for a flow used
	// rarely.
	let matchedRowId: string | null = null;
	for (const row of codeRows) {
		try {
			if (await Bun.password.verify(cleanedCode, row.code_hash)) {
				matchedRowId = row.id;
				break;
			}
		} catch (err) {
			console.error(
				`[recovery] verify threw for code row ${row.id} — skipping. Hash may be corrupted.`,
				err instanceof Error ? err.message : err,
			);
		}
	}
	if (!matchedRowId) return { kind: "invalid" };

	const newHash = await Bun.password.hash(newPassword, { algorithm: "argon2id" });
	await sql.begin(async (tx) => {
		await tx`UPDATE recovery_codes SET used_at = NOW() WHERE id = ${matchedRowId}`;
		await tx`UPDATE users SET password_hash = ${newHash} WHERE id = ${userId}`;
		// Same hygiene as the magic-link reset — kick every existing session.
		await tx`DELETE FROM auth_sessions WHERE user_id = ${userId}`;
	});

	return { kind: "ok", userId };
}
