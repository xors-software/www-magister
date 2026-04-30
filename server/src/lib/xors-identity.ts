// Bridge between the centralized XORS identity service (api.xors.xyz)
// and Magister's local data model.
//
// Background: Magister used to have its own users table with email +
// password. Now api.xors.xyz owns identity for all the XORS apps —
// Magister keeps a thin local users row only as the FK target for its
// own data (quizzes, generated_questions, etc.). On every authenticated
// request we:
//
//   1. Read the `xors_session` cookie set by web/app/oauth/route.ts.
//   2. Hit api.xors.xyz/api/users/viewer with that as `X-API-KEY` to
//      resolve the current user.
//   3. Find the local Magister row by xors_user_id, falling back to
//      email for legacy rows that predate this change. Stamp the
//      xors_user_id on legacy hits so step (3) finds them next time.
//   4. Create a new local row if neither lookup matches.
//
// The local row mirrors a small subset of viewer fields (email,
// display name) — kept in sync on each successful viewer fetch so
// renames at the xors level eventually propagate.

import { sql } from "./pg";
import { getUserBySession, readSessionToken } from "./auth";

const XORS_API_URL =
	process.env.XORS_API_URL ||
	process.env.NEXT_PUBLIC_XORS_API_URL ||
	"https://api.xors.xyz";

const XORS_SESSION_COOKIE_NAME = "xors_session";

export interface MagisterUser {
	// Magister-internal id used by every FK in the local schema. NEVER the
	// xors viewer.id directly — keeping a stable indirection means we
	// could swap providers later without rewriting every quizzes.user_id.
	id: string;
	email: string;
	displayName: string | null;
	createdAt: string;
	xorsUserId: string;
}

interface XorsViewer {
	id: string;
	email?: string;
	username?: string | null;
	level?: string | number | null;
}

function generateLocalUserId(): string {
	return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// Pull the xors_session cookie out of a Cookie header. Mirrors the
// parseCookies helper in lib/auth.ts but lives here to avoid making the
// xors flow depend on the (soon-to-be-deprecated) password auth module.
function readXorsSessionCookie(headers: Headers): string | null {
	const raw = headers.get("cookie");
	if (!raw) return null;
	for (const piece of raw.split(";")) {
		const eq = piece.indexOf("=");
		if (eq === -1) continue;
		const k = piece.slice(0, eq).trim();
		if (k !== XORS_SESSION_COOKIE_NAME) continue;
		const v = piece.slice(eq + 1).trim();
		try {
			return decodeURIComponent(v);
		} catch {
			return v;
		}
	}
	return null;
}

async function fetchXorsViewer(sessionKey: string): Promise<XorsViewer | null> {
	if (!sessionKey) return null;
	try {
		const res = await fetch(`${XORS_API_URL}/api/users/viewer`, {
			method: "GET",
			headers: { "X-API-KEY": sessionKey, "Content-Type": "application/json" },
		});
		if (!res.ok) return null;
		const body = (await res.json()) as { viewer?: XorsViewer };
		const v = body.viewer;
		if (!v || typeof v.id !== "string") return null;
		return v;
	} catch (err) {
		console.error(
			"[xors] viewer fetch failed:",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}

interface LocalUserRow {
	id: string;
	email: string;
	display_name: string | null;
	created_at: string;
	xors_user_id: string | null;
}

function rowToUser(r: LocalUserRow): MagisterUser {
	return {
		id: r.id,
		email: r.email,
		displayName: r.display_name,
		createdAt: r.created_at,
		// The cast is safe because every code path that returns a
		// MagisterUser has just ensured xors_user_id is set.
		xorsUserId: r.xors_user_id as string,
	};
}

/**
 * Find or create the local Magister user backing the given xors viewer.
 *
 * Order:
 *   1. Lookup by xors_user_id — the steady-state path.
 *   2. Lookup by email — finds legacy rows from before this column
 *      existed. We stamp the xors_user_id during the same call so the
 *      next request takes path (1).
 *   3. Insert a fresh row.
 *
 * The viewer's email is also written through to keep the local copy
 * fresh in case it changed at the xors level.
 */
async function upsertFromViewer(viewer: XorsViewer): Promise<MagisterUser> {
	const email = (viewer.email ?? "").toLowerCase();
	const displayName = viewer.username ?? null;

	// 1. By xors_user_id (steady state)
	const bySub = await sql<LocalUserRow[]>`
		SELECT id, email, display_name, created_at, xors_user_id
		FROM users WHERE xors_user_id = ${viewer.id}
	`;
	if (bySub.length > 0) {
		const r = bySub[0];
		// Refresh email/display_name lazily if they drifted at xors.
		if (email && (r.email !== email || r.display_name !== displayName)) {
			await sql`
				UPDATE users SET email = ${email}, display_name = ${displayName}
				WHERE id = ${r.id}
			`;
			r.email = email;
			r.display_name = displayName;
		}
		return rowToUser(r);
	}

	// 2. By email (legacy migration path)
	if (email) {
		const byEmail = await sql<LocalUserRow[]>`
			SELECT id, email, display_name, created_at, xors_user_id
			FROM users WHERE email = ${email}
		`;
		if (byEmail.length > 0) {
			const r = byEmail[0];
			await sql`
				UPDATE users
				SET xors_user_id = ${viewer.id},
				    display_name = COALESCE(${displayName}, display_name)
				WHERE id = ${r.id}
			`;
			r.xors_user_id = viewer.id;
			if (displayName) r.display_name = displayName;
			return rowToUser(r);
		}
	}

	// 3. Fresh row
	const id = generateLocalUserId();
	const inserted = await sql<LocalUserRow[]>`
		INSERT INTO users (id, email, display_name, xors_user_id)
		VALUES (${id}, ${email}, ${displayName}, ${viewer.id})
		RETURNING id, email, display_name, created_at, xors_user_id
	`;
	return rowToUser(inserted[0]);
}

/**
 * Resolve the current user. Two paths during the migration window:
 *
 *   1. xors_session cookie → fetch viewer from api.xors.xyz, upsert local
 *      (the steady-state for all post-migration users).
 *   2. reps_session cookie → fall back to the legacy local auth_sessions
 *      lookup (for users who pre-date xors centralization and haven't
 *      been manually migrated yet).
 *
 * If both are present, xors wins. Returns null if neither resolves —
 * routes that require auth then 401.
 */
export async function resolveCurrentUser(
	headers: Headers,
): Promise<MagisterUser | null> {
	// 1. xors path
	const sessionKey = readXorsSessionCookie(headers);
	if (sessionKey) {
		const viewer = await fetchXorsViewer(sessionKey);
		if (viewer) {
			try {
				return await upsertFromViewer(viewer);
			} catch (err) {
				console.error(
					"[xors] local user upsert failed for viewer",
					viewer.id,
					err instanceof Error ? err.message : err,
				);
				// Fall through to local — better than 401'ing if local works.
			}
		}
	}

	// 2. legacy local path
	const repsToken = readSessionToken(headers);
	if (!repsToken) return null;
	const localUser = await getUserBySession(repsToken);
	if (!localUser) return null;
	return {
		id: localUser.id,
		email: localUser.email,
		displayName: localUser.displayName,
		createdAt: localUser.createdAt,
		// Legacy users don't have a xors id yet — they sign in with their
		// local password, never having authenticated via xors. The empty
		// string is a flag the rest of the app can ignore (nothing reads
		// xorsUserId outside this module).
		xorsUserId: "",
	};
}
