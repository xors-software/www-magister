// PostHog product analytics. We use it to answer:
//   - Are people actually drilling? (signed_in, quiz_started, quiz_completed)
//   - Are they finishing what they start? (per-quiz funnel)
//   - Are they passing it around? (referrer + UTM, captured by autocapture)
//   - Which questions are bad? (question_reported, complements the
//     question_reports DB table)
//   - Which cheatsheets / scenarios are they actually opening?
//
// Initialization is idempotent and a no-op when NEXT_PUBLIC_POSTHOG_KEY
// is unset — local dev still works without setting up a project. Once
// Railway env vars are wired, prod starts capturing automatically.

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics(): void {
	if (initialized) return;
	if (typeof window === "undefined") return;
	if (!POSTHOG_KEY) {
		// Quiet in dev — only warn so it's discoverable but not noisy.
		console.info("[analytics] PostHog not configured (NEXT_PUBLIC_POSTHOG_KEY missing) — events will be no-ops.");
		initialized = true;
		return;
	}
	posthog.init(POSTHOG_KEY, {
		api_host: POSTHOG_HOST,
		capture_pageview: "history_change",
		capture_pageleave: true,
		// We're not running ads or building tracking pixels — autocapture
		// of clicks/changes is fine for this kind of internal tool, but
		// keep dom_event_tagging off to reduce payload size.
		autocapture: true,
		person_profiles: "identified_only",
		// Don't load remote feature-flag config; we're not using flags yet
		// and it saves a network round-trip on first paint.
		advanced_disable_feature_flags: true,
	});
	initialized = true;
}

// Identify the current user. Call after a successful sign-in or whenever
// /auth/me resolves a user. Safe to call repeatedly — PostHog dedupes.
export function identifyUser(user: { id: string; email: string; displayName: string | null }): void {
	if (!POSTHOG_KEY || typeof window === "undefined") return;
	posthog.identify(user.id, {
		email: user.email,
		name: user.displayName ?? undefined,
	});
}

// Clear the identity on sign-out so anonymous activity from the next
// person on the same device isn't attributed to the previous user.
export function resetAnalytics(): void {
	if (!POSTHOG_KEY || typeof window === "undefined") return;
	posthog.reset();
}

// Typed wrapper to keep event names consistent across the app. Add new
// events here so the schema is self-documenting in one place.
export type AnalyticsEvent =
	| { name: "signed_in"; properties?: { method?: "google" | "password_local" | "password_xors" } }
	| { name: "signed_out" }
	| { name: "quiz_started"; properties: { mode: string; count: number; track: "claude-code" | "ai-fundamentals" } }
	| { name: "quiz_completed"; properties: { mode: string; total: number; track: "claude-code" | "ai-fundamentals"; correct?: number; durationMs?: number } }
	| { name: "question_answered"; properties: { questionId: string; correct: boolean; track: "claude-code" | "ai-fundamentals" } }
	| { name: "question_reported"; properties: { questionId: string; hasReason: boolean } }
	| { name: "scenario_viewed"; properties: { scenarioId: string } }
	| { name: "cheatsheet_opened"; properties: { slug: string } }
	| { name: "session_deck_opened"; properties: { slug: string; ext: "pdf" | "pptx" } }
	| { name: "primer_opened"; properties: { slug: string } };

export function track(event: AnalyticsEvent): void {
	if (!POSTHOG_KEY || typeof window === "undefined") return;
	posthog.capture(event.name, "properties" in event ? event.properties : undefined);
}
