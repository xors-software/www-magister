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
