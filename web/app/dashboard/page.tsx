"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, fetchMe, logout, type User } from "@/lib/auth";

type DomainScore = { domain: string; correct: number; total: number; percent: number };
type ScenarioScore = { scenario: string; correct: number; total: number; percent: number };
type Stats = {
	totalQuizzes: number;
	totalAnswered: number;
	totalCorrect: number;
	rolling: { date: string; percent: number }[];
	byDomain: DomainScore[];
	byScenario: ScenarioScore[];
	bestEstimatedExamScore: number;
	latestEstimatedExamScore: number;
};

const DOMAIN_LABELS: Record<string, string> = {
	D1: "Agentic Architecture & Orchestration",
	D2: "Tool Design & MCP Integration",
	D3: "Claude Code Configuration & Workflows",
	D4: "Prompt Engineering & Structured Output",
	D5: "Context Management & Reliability",
};

const SCENARIO_LABELS: Record<string, string> = {
	"customer-support": "Customer Support",
	"code-generation": "Code Generation",
	"multi-agent-research": "Multi-Agent Research",
	"developer-productivity": "Developer Productivity",
	"ci-cd": "CI/CD",
	"structured-extraction": "Structured Extraction",
};

function colorFor(pct: number) {
	if (pct >= 95) return "#22c55e";
	if (pct >= 80) return "#84cc16";
	if (pct >= 70) return "#F5B800";
	if (pct >= 50) return "#f59e0b";
	return "#ef4444";
}

export default function Dashboard() {
	const router = useRouter();
	const [stats, setStats] = useState<Stats | null>(null);
	const [me, setMe] = useState<User | null>(null);

	useEffect(() => {
		(async () => {
			const user = await fetchMe();
			if (!user) {
				router.push("/login?next=/dashboard");
				return;
			}
			setMe(user);
			const res = await apiFetch("/cert/stats");
			const data = await res.json();
			if (!data.error) setStats(data);
		})();
	}, [router]);

	async function handleLogout() {
		await logout();
		router.push("/login");
	}

	if (!stats) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Loading…</div>
			</main>
		);
	}

	const overall = stats.totalAnswered > 0 ? (stats.totalCorrect / stats.totalAnswered) * 100 : 0;
	const ready = stats.bestEstimatedExamScore >= 950;
	const passing = stats.bestEstimatedExamScore >= 720;

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] pb-20">
			<nav className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</Link>
					<div className="flex gap-3 items-center">
						<Link href="/quiz" className="font-sans text-[13px] text-[#F5B800] hover:underline">New drill</Link>
						<Link href="/scenarios" className="font-sans text-[13px] text-[#888] hover:text-white">Scenarios</Link>
						{me && (
							<>
								<span className="font-sans text-[12px] text-[#444]">·</span>
								<span className="font-sans text-[12px] text-[#666]">{me.displayName || me.email}</span>
								<button type="button" onClick={handleLogout} className="font-sans text-[12px] text-[#555] hover:text-white">Sign out</button>
							</>
						)}
					</div>
				</div>
			</nav>

			<div className="max-w-[1100px] mx-auto px-6 py-10">
				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-1">Your dashboard</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8">
					Pass = 720/1000. Ship-it threshold = 950 (95% on simulated mocks). Keep drilling weak domains until you cross both lines on a full mock exam.
				</p>

				{stats.totalQuizzes === 0 ? (
					<div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-10 text-center">
						<div className="font-serif text-[20px] text-white mb-2">No drills yet</div>
						<p className="font-sans text-[13px] text-[#888] mb-5 max-w-md mx-auto">
							Start with a 10-question Quick Quiz to feel out the format, then move to scenario drills, then a full Mock Exam when you're scoring 90%+.
						</p>
						<Link href="/quiz" className="inline-block px-6 py-3 rounded-xl bg-[#F5B800] text-black font-sans text-sm font-bold">
							Start your first drill
						</Link>
					</div>
				) : (
					<>
						<div className="grid md:grid-cols-3 gap-3 mb-8">
							<div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
								<div className="font-sans text-[11px] text-[#666] uppercase tracking-wider mb-1">Drills completed</div>
								<div className="font-mono text-[28px] font-bold text-white">{stats.totalQuizzes}</div>
								<div className="font-sans text-[11px] text-[#555] mt-1">{stats.totalAnswered} questions answered</div>
							</div>
							<div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
								<div className="font-sans text-[11px] text-[#666] uppercase tracking-wider mb-1">Career accuracy</div>
								<div className="font-mono text-[28px] font-bold" style={{ color: colorFor(overall) }}>{Math.round(overall)}%</div>
								<div className="font-sans text-[11px] text-[#555] mt-1">{stats.totalCorrect} correct</div>
							</div>
							<div
								className="rounded-2xl border p-5"
								style={{
									borderColor: ready ? "#22c55e40" : passing ? "#F5B80040" : "#1a1a1a",
									backgroundColor: ready ? "#22c55e0D" : passing ? "#F5B8000D" : "#0d0d0d",
								}}
							>
								<div className="font-sans text-[11px] text-[#666] uppercase tracking-wider mb-1">Best mock score</div>
								<div
									className="font-mono text-[28px] font-bold"
									style={{ color: ready ? "#22c55e" : passing ? "#F5B800" : "#888" }}
								>
									{stats.bestEstimatedExamScore || "—"}
								</div>
								<div className="font-sans text-[11px] text-[#555] mt-1">
									{ready ? "Ship it 🚀" : passing ? "Likely pass" : "Below 720"}
								</div>
							</div>
						</div>

						<section className="mb-10">
							<h2 className="font-serif text-[22px] text-white tracking-[-0.01em] mb-4">By domain</h2>
							<div className="space-y-2">
								{stats.byDomain.map((d) => (
									<div key={d.domain} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
										<div className="flex items-baseline justify-between mb-2">
											<div>
												<span className="font-mono text-[12px] font-bold text-[#888] mr-3">{d.domain}</span>
												<span className="font-sans text-[14px] text-white">{DOMAIN_LABELS[d.domain]}</span>
											</div>
											<div>
												<span className="font-mono text-[15px] font-bold" style={{ color: colorFor(d.percent) }}>
													{d.total === 0 ? "—" : `${Math.round(d.percent)}%`}
												</span>
												<span className="font-mono text-[11px] text-[#555] ml-2">{d.correct}/{d.total}</span>
											</div>
										</div>
										<div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
											<div className="h-full transition-all" style={{ width: `${d.percent}%`, backgroundColor: colorFor(d.percent) }} />
										</div>
									</div>
								))}
							</div>
						</section>

						<section className="mb-10">
							<h2 className="font-serif text-[22px] text-white tracking-[-0.01em] mb-4">By scenario</h2>
							<div className="grid sm:grid-cols-2 gap-3">
								{stats.byScenario.map((s) => (
									<div key={s.scenario} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
										<div className="flex items-baseline justify-between mb-2">
											<span className="font-sans text-[14px] text-white">{SCENARIO_LABELS[s.scenario]}</span>
											<span className="font-mono text-[14px] font-bold" style={{ color: colorFor(s.percent) }}>
												{s.total === 0 ? "—" : `${Math.round(s.percent)}%`}
											</span>
										</div>
										<div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden mb-2">
											<div className="h-full transition-all" style={{ width: `${s.percent}%`, backgroundColor: colorFor(s.percent) }} />
										</div>
										<div className="flex items-center justify-between">
											<span className="font-mono text-[11px] text-[#555]">{s.correct}/{s.total}</span>
											<Link href={`/scenarios/${s.scenario}`} className="font-sans text-[11px] text-[#888] hover:text-white">
												Read deep-dive →
											</Link>
										</div>
									</div>
								))}
							</div>
						</section>

						{stats.rolling.length > 1 && (
							<section className="mb-10">
								<h2 className="font-serif text-[22px] text-white tracking-[-0.01em] mb-4">Trend</h2>
								<div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
									<div className="flex items-end gap-1 h-32">
										{stats.rolling.map((r, i) => (
											<div key={i} className="flex-1 flex flex-col items-center justify-end">
												<div
													className="w-full rounded-t-sm transition-all"
													style={{ height: `${r.percent}%`, backgroundColor: colorFor(r.percent), minHeight: 2 }}
													title={`${Math.round(r.percent)}% on ${new Date(r.date).toLocaleString()}`}
												/>
											</div>
										))}
									</div>
									<div className="flex items-baseline justify-between mt-3 font-mono text-[10px] text-[#555]">
										<span>{stats.rolling.length} drills</span>
										<span>Latest: {Math.round(stats.rolling[stats.rolling.length - 1].percent)}%</span>
									</div>
								</div>
							</section>
						)}
					</>
				)}
			</div>
		</main>
	);
}
