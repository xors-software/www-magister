"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, fetchMe, logout, type User } from "@/lib/auth";
import { identifyUser, resetAnalytics, track } from "@/lib/analytics";

type Scenario = { id: string; label: string; tagline: string; questionCount: number };
type Domain = { id: string; label: string; questionCount: number };

const SCENARIO_ACCENT: Record<string, string> = {
	"customer-support": "#4f9cf7",
	"code-generation": "#22c55e",
	"multi-agent-research": "#a855f7",
	"developer-productivity": "#f59e0b",
	"ci-cd": "#ef4444",
	"structured-extraction": "#06b6d4",
};

const DOMAIN_ACCENT: Record<string, string> = {
	D1: "#4f9cf7",
	D2: "#22c55e",
	D3: "#F5B800",
	D4: "#a855f7",
	D5: "#ef4444",
};

export default function QuizLauncher() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [me, setMe] = useState<User | null>(null);
	const [authChecked, setAuthChecked] = useState(false);
	const [mode, setMode] = useState<"quick" | "exam" | "scenario" | "domain" | "gotcha">("quick");
	const [scenarios, setScenarios] = useState<Scenario[]>([]);
	const [domains, setDomains] = useState<Domain[]>([]);
	const [scenario, setScenario] = useState<string>("customer-support");
	const [domain, setDomain] = useState<string>("D1");
	const [count, setCount] = useState(10);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchMe().then((user) => {
			if (!user) {
				router.push("/login?next=/claude-code/quiz");
				return;
			}
			setMe(user);
			setAuthChecked(true);
			identifyUser(user);
			// Fresh sign-in via OAuth: /oauth redirects here with
			// ?signed_in=google. Fire the event once, then strip the
			// param so a refresh doesn't re-fire.
			const signedInVia = searchParams.get("signed_in");
			if (signedInVia === "google") {
				track({ name: "signed_in", properties: { method: "google" } });
				const url = new URL(window.location.href);
				url.searchParams.delete("signed_in");
				router.replace(`${url.pathname}${url.search}`);
			}
		});
	}, [router, searchParams]);

	useEffect(() => {
		if (!authChecked) return;
		apiFetch("/cert/scenarios").then((r) => r.json()).then(setScenarios).catch(() => {});
		apiFetch("/cert/domains").then((r) => r.json()).then(setDomains).catch(() => {});
	}, [authChecked]);

	async function startQuiz() {
		setLoading(true);
		setError("");
		try {
			const body: Record<string, unknown> = { mode, count };
			if (mode === "exam") body.count = 50;
			if (mode === "scenario") body.scenario = scenario;
			if (mode === "domain") body.domain = domain;
			const res = await apiFetch("/cert/quiz", {
				method: "POST",
				body: JSON.stringify(body),
			});
			const data = await res.json();
			if (data.error) {
				setError(data.error);
				setLoading(false);
				return;
			}
			track({
				name: "quiz_started",
				properties: {
					mode,
					count: typeof body.count === "number" ? body.count : count,
					track: "claude-code",
				},
			});
			router.push(`/claude-code/quiz/${data.id}`);
		} catch {
			setError(
				"Couldn't reach the server. Refresh the page and try again — if it persists, ping the project owner.",
			);
			setLoading(false);
		}
	}

	async function handleLogout() {
		track({ name: "signed_out" });
		resetAnalytics();
		await logout();
		router.push("/login");
	}

	const modes: { id: typeof mode; label: string; sub: string; recommendedCount?: number }[] = [
		{ id: "quick", label: "Quick Quiz", sub: "10 random questions across all scenarios. Warm-up.", recommendedCount: 10 },
		{ id: "exam", label: "Mock Exam", sub: "50 questions, weighted by domain, 120-min timer." },
		{ id: "scenario", label: "Scenario Drill", sub: "Focus on one of the six exam scenarios.", recommendedCount: 10 },
		{ id: "domain", label: "Domain Drill", sub: "Focus on one of the five exam domains.", recommendedCount: 10 },
		{ id: "gotcha", label: "Gotcha Drill", sub: "Anti-patterns the exam likes to slip in as distractors.", recommendedCount: 10 },
	];

	if (!authChecked) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Checking session…</div>
			</main>
		);
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-[640px]">
				<div className="flex items-center justify-between mb-8">
					<Link href="/" className="block">
						<div className="flex items-center gap-2">
							<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
							<span className="text-[#333] font-sans text-xs">/</span>
							<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
						</div>
					</Link>
					{me && (
						<div className="flex items-center gap-3">
							<span className="font-sans text-[12px] text-[#666]">{me.displayName || me.email}</span>
							<Link href="/account/recovery-codes" className="font-sans text-[12px] text-[#555] hover:text-white">Recovery codes</Link>
							<button type="button" onClick={handleLogout} className="font-sans text-[12px] text-[#555] hover:text-white">Sign out</button>
						</div>
					)}
				</div>

				<h1 className="font-serif text-[32px] font-bold text-white leading-[1.2] tracking-[-0.02em] mb-2">
					Pick a drill
				</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8">
					Each mode is calibrated to the Anthropic Claude Code exam. The mock exam mirrors the real 50-question, 120-minute format.
				</p>

				<div className="grid sm:grid-cols-2 gap-2.5 mb-6">
					{modes.map((m) => {
						const active = mode === m.id;
						return (
							<button
								key={m.id}
								type="button"
								onClick={() => {
									setMode(m.id);
									if (m.recommendedCount) setCount(m.recommendedCount);
								}}
								className="text-left rounded-xl px-4 py-3.5 transition-all border"
								style={{
									backgroundColor: active ? "#F5B80015" : "#111",
									borderColor: active ? "#F5B80055" : "#1a1a1a",
								}}
							>
								<div className={`font-sans text-[14px] font-semibold ${active ? "text-white" : "text-[#ccc]"}`}>{m.label}</div>
								<div className="font-sans text-[12px] text-[#666] mt-1 leading-snug">{m.sub}</div>
							</button>
						);
					})}
				</div>

				{mode === "scenario" && (
					<div className="mb-6">
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-2">
							Scenario
						</label>
						<div className="grid gap-1.5">
							{scenarios.map((s) => {
								const active = scenario === s.id;
								const accent = SCENARIO_ACCENT[s.id] || "#F5B800";
								return (
									<button
										key={s.id}
										type="button"
										onClick={() => setScenario(s.id)}
										className="text-left px-3.5 py-2.5 rounded-lg flex items-center gap-3 border"
										style={{
											backgroundColor: active ? `${accent}15` : "#111",
											borderColor: active ? `${accent}50` : "#1a1a1a",
										}}
									>
										<span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
										<div className="flex-1 min-w-0">
											<div className={`font-sans text-[13px] font-medium ${active ? "text-white" : "text-[#ccc]"}`}>{s.label}</div>
											<div className="font-sans text-[11px] text-[#555] truncate">{s.tagline}</div>
										</div>
										<span className="font-mono text-[11px] text-[#555]">{s.questionCount}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{mode === "domain" && (
					<div className="mb-6">
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-2">
							Domain
						</label>
						<div className="grid gap-1.5">
							{domains.map((d) => {
								const active = domain === d.id;
								const accent = DOMAIN_ACCENT[d.id] || "#F5B800";
								return (
									<button
										key={d.id}
										type="button"
										onClick={() => setDomain(d.id)}
										className="text-left px-3.5 py-2.5 rounded-lg flex items-center gap-3 border"
										style={{
											backgroundColor: active ? `${accent}15` : "#111",
											borderColor: active ? `${accent}50` : "#1a1a1a",
										}}
									>
										<span
											className="w-9 h-9 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0"
											style={{ backgroundColor: active ? accent : "#1a1a1a", color: active ? "white" : "#555" }}
										>
											{d.id}
										</span>
										<div className="flex-1 min-w-0">
											<div className={`font-sans text-[13px] font-medium ${active ? "text-white" : "text-[#ccc]"}`}>{d.label}</div>
										</div>
										<span className="font-mono text-[11px] text-[#555]">{d.questionCount}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{mode !== "exam" && (
					<div className="mb-6">
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-2">
							Question count
						</label>
						<div className="flex gap-2">
							{[5, 10, 15, 20].map((n) => (
								<button
									key={n}
									type="button"
									onClick={() => setCount(n)}
									className="flex-1 py-2.5 rounded-lg font-sans text-sm font-semibold transition-all border"
									style={{
										backgroundColor: count === n ? "#F5B800" : "#111",
										color: count === n ? "black" : "#ccc",
										borderColor: count === n ? "#F5B800" : "#1a1a1a",
									}}
								>
									{n}
								</button>
							))}
						</div>
					</div>
				)}

				{error && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{error}
					</div>
				)}

				<button
					type="button"
					onClick={startQuiz}
					disabled={loading}
					className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Starting..." : mode === "exam" ? "Start mock exam (50 Q · 120 min)" : `Start ${count}-question drill`}
				</button>

				<div className="mt-6 text-center">
					<Link href="/claude-code/dashboard" className="font-sans text-[13px] text-[#888] hover:text-white">
						Or check your dashboard →
					</Link>
				</div>
			</div>
		</main>
	);
}
