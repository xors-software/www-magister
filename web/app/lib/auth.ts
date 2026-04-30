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
