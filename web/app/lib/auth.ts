// Client-side auth helpers. Magister now defers identity to api.xors.xyz
// (see lib/xors.ts) — these helpers wrap the small Magister API surface
// that survives that change: /api/auth/me (resolve current user) and
// /api/auth/logout (clear the session cookie locally).
//
// All API calls go through Next.js's /api/* rewrite (see next.config.js)
// so they're same-origin from the browser's POV and the xors_session
// cookie rides along under SameSite=Lax.

export type User = {
	id: string;
	email: string;
	displayName: string | null;
};

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	if (init.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	return fetch(`/api${path}`, {
		...init,
		credentials: "include",
		headers,
	});
}

export async function fetchMe(): Promise<User | null> {
	try {
		const res = await apiFetch("/auth/me");
		if (!res.ok) return null;
		const data = await res.json();
		return data.user ?? null;
	} catch {
		return null;
	}
}

export async function logout(): Promise<void> {
	await apiFetch("/auth/logout", { method: "POST" });
}

// ---- Local-password sign-in + recovery codes ----
//
// Coexists with the centralized xors flow during the migration window.
// Recovery codes only ever apply to local Magister accounts; xors-side
// users sign in via Google OAuth or password and recover via xors's
// own email-based reset.

export type LoginResult = { authMethod: "local" | "xors" };

export async function login(email: string, password: string): Promise<LoginResult> {
	const res = await apiFetch("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || "Sign-in failed");
	}
	const data = await res.json();
	return { authMethod: data.authMethod };
}

export interface RecoveryCodesStatus {
	hasCodes: boolean;
	generatedAt: string | null;
	unusedCount: number;
	usedCount: number;
}

export async function getRecoveryCodesStatus(): Promise<RecoveryCodesStatus | null> {
	const res = await apiFetch("/auth/recovery-codes/status");
	if (!res.ok) return null;
	return (await res.json()) as RecoveryCodesStatus;
}

export async function generateRecoveryCodes(): Promise<string[]> {
	const res = await apiFetch("/auth/recovery-codes/generate", { method: "POST" });
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || "Couldn't generate recovery codes");
	}
	const data = (await res.json()) as { codes: string[] };
	return data.codes;
}

export async function resetWithRecoveryCode(
	email: string,
	code: string,
	password: string,
): Promise<void> {
	const res = await apiFetch("/auth/recovery-code-reset", {
		method: "POST",
		body: JSON.stringify({ email, code, password }),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || "Reset failed");
	}
}
