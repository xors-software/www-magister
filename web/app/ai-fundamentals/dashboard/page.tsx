"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, fetchMe, logout, type User } from "@/lib/auth";

type TopicScore = { topic: string; correct: number; total: number; percent: number };
type Stats = {
	totalQuizzes: number;
	totalAnswered: number;
	totalCorrect: number;
	rolling: { date: string; percent: number }[];
	byTopic: TopicScore[];
	bestPercent: number;
	latestPercent: number;
};

const TOPIC_LABELS: Record<string, string> = {
	"ai-fundamentals": "AI Fundamentals",
	"ai-terminology": "AI Terminology",
	"context-and-prompts": "Context & Prompts",
	"prompt-patterns": "Prompt Patterns",
	"models-and-spend": "Models & Spend",
	"task-decomposition": "Task Decomposition",
	"cursor-modes": "Cursor Modes",
	"cursor-vs-jetbrains": "Cursor vs JetBrains",
	"rules-and-repo-config": "Rules & Repo Config",
	"keyboard-shortcuts": "Keyboard Shortcuts",
	"tdd-with-agent": "TDD with Agent Mode",
	"debugging-workflows": "Debugging Workflows",
};

function colorFor(pct: number) {
	if (pct >= 95) return "#22c55e";
	if (pct >= 80) return "#84cc16";
	if (pct >= 70) return "#ec4899";
	if (pct >= 50) return "#f59e0b";
	return "#ef4444";
}

export default function FundamentalsDashboard() {
	const router = useRouter();
	const [stats, setStats] = useState<Stats | null>(null);
	const [me, setMe] = useState<User | null>(null);

	useEffect(() => {
		(async () => {
			const user = await fetchMe();
			if (!user) {
				router.push("/login?next=/ai-fundamentals/dashboard");
				return;
			}
			setMe(user);
			const res = await apiFetch("/fundamentals/stats");
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

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8]">
			<div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[1000px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/ai-fundamentals" className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">AI Fundamentals</span>
					</Link>
					<div className="flex items-center gap-4">
						<Link href="/ai-fundamentals/quiz" className="font-sans text-[13px] text-[#ec4899] hover:underline">New drill</Link>
						{me && (
							<>
								<span className="font-sans text-[12px] text-[#666]">{me.displayName || me.email}</span>
								<button type="button" onClick={handleLogout} className="font-sans text-[12px] text-[#555] hover:text-white">Sign out</button>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="max-w-[1000px] mx-auto px-6 py-10">
				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-2">Your dashboard</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8">
					Per-topic accuracy across your AI Fundamentals drills.
				</p>

				{stats.totalQuizzes === 0 ? (
					<div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-8 text-center">
						<div className="font-serif text-[20px] text-white mb-2">No drills yet</div>
						<div className="font-sans text-[14px] text-[#888] mb-6 max-w-md mx-auto">
							Start with a Quick Quiz to feel the format, then drill the topics where you want sharper recall.
						</div>
						<Link href="/ai-fundamentals/quiz" className="inline-block px-6 py-3 rounded-xl bg-[#ec4899] text-white font-sans text-sm font-bold">
							Start your first drill →
						</Link>
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
							<div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
								<div className="font-sans text-[11px] text-[#666] uppercase tracking-wider mb-1">Drills</div>
								<div className="font-serif text-[28px] font-bold text-white">{stats.totalQuizzes}</div>
							</div>
							<div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
								<div className="font-sans text-[11px] text-[#666] uppercase tracking-wider mb-1">Answered</div>
								<div className="font-serif text-[28px] font-bold text-white">{stats.totalAnswered}</div>
							</div>
							<div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
								<div className="font-sans text-[11px] text-[#666] uppercase tracking-wider mb-1">Best</div>
								<div className="font-serif text-[28px] font-bold" style={{ color: colorFor(stats.bestPercent) }}>
									{Math.round(stats.bestPercent)}%
								</div>
							</div>
							<div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
								<div className="font-sans text-[11px] text-[#666] uppercase tracking-wider mb-1">Latest</div>
								<div className="font-serif text-[28px] font-bold" style={{ color: colorFor(stats.latestPercent) }}>
									{Math.round(stats.latestPercent)}%
								</div>
							</div>
						</div>

						<section className="mb-10">
							<h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[#666] mb-3">By topic (cumulative)</h2>
							<div className="space-y-1.5">
								{stats.byTopic
									.filter((t) => t.total > 0)
									.map((t) => (
										<div key={t.topic} className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-3 flex items-center gap-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-baseline justify-between gap-3">
													<Link href={`/ai-fundamentals/quiz?prefill=topic:${t.topic}`} className="font-sans text-[13px] font-medium text-white hover:text-[#ec4899] truncate">
														{TOPIC_LABELS[t.topic] || t.topic}
													</Link>
													<span className="font-mono text-[12px] tabular-nums shrink-0" style={{ color: colorFor(t.percent) }}>
														{t.correct}/{t.total}
													</span>
												</div>
												<div className="mt-1 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
													<div className="h-full" style={{ width: `${t.percent}%`, backgroundColor: colorFor(t.percent) }} />
												</div>
											</div>
										</div>
									))}
								{stats.byTopic.every((t) => t.total === 0) && (
									<div className="font-sans text-[13px] text-[#666]">Drill any topic to start populating the breakdown.</div>
								)}
							</div>
						</section>
					</>
				)}
			</div>
		</main>
	);
}
