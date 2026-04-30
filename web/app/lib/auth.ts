// Client-side helpers for the cookie-based session auth.
//
// All API calls go through Next.js's /api/* rewrite (see next.config.js),
// so they're same-origin from the browser's POV. That keeps the session
// cookie working under SameSite=Lax across all browsers, including the
// strict ones (Safari ITP, Brave, Firefox) that block third-party cookies.

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

export type LoginResult = { user: User; newAccount: boolean };

export async function login(
	email: string,
	password: string,
	displayName?: string,
): Promise<LoginResult> {
	const res = await apiFetch("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password, displayName }),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || "Login failed");
	}
	const data = await res.json();
	return { user: data.user, newAccount: !!data.newAccount };
}

export async function logout(): Promise<void> {
	await apiFetch("/auth/logout", { method: "POST" });
}

export async function requestPasswordReset(email: string): Promise<void> {
	// Server always returns 200 regardless of whether the email is known —
	// don't leak account existence on the client either. We discard the body.
	await apiFetch("/auth/forgot-password", {
		method: "POST",
		body: JSON.stringify({ email }),
	});
}

export async function resetPassword(token: string, password: string): Promise<void> {
	const res = await apiFetch("/auth/reset-password", {
		method: "POST",
		body: JSON.stringify({ token, password }),
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || "Reset failed");
	}
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
