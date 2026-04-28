// Client-side helpers for the cookie-based session auth.
//
// All Reps API requests MUST include credentials so the session cookie
// rides along on cross-origin calls. Use `apiFetch` everywhere.

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
	return fetch(`${API}${path}`, {
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
