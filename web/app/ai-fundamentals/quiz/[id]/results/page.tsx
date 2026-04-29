"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, fetchMe } from "@/lib/auth";

type TopicScore = { topic: string; correct: number; total: number; percent: number };
type Missed = {
	id: string;
	stem: string;
	topic: string;
	selected: "A" | "B" | "C" | "D" | null;
	correct: "A" | "B" | "C" | "D";
	explanation: string;
	studyTags: string[];
};
type Results = {
	totalCorrect: number;
	totalQuestions: number;
	percent: number;
	durationSeconds: number;
	byTopic: TopicScore[];
	weakestTopics: string[];
	missedQuestions: Missed[];
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

function fmtDuration(sec: number) {
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	return `${m}m ${s}s`;
}

function colorFor(pct: number) {
	if (pct >= 95) return "#22c55e";
	if (pct >= 80) return "#84cc16";
	if (pct >= 70) return "#ec4899";
	if (pct >= 50) return "#f59e0b";
	return "#ef4444";
}

export default function FundamentalsResultsPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [results, setResults] = useState<Results | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		(async () => {
			const me = await fetchMe();
			if (!me) {
				router.push(`/login?next=/ai-fundamentals/quiz/${params.id}/results`);
				return;
			}
			try {
				const res = await apiFetch(`/fundamentals/quiz/${params.id}/results`);
				const data = await res.json();
				if (data.error) setError(data.error);
				else setResults(data);
			} catch {
				setError("Failed to load results.");
			}
		})();
	}, [params.id, router]);

	if (error) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4 text-center">
				<div>
					<div className="font-serif text-[24px] text-white mb-2">No results yet</div>
					<div className="font-sans text-[14px] text-[#888] mb-6">{error}</div>
					<Link href="/ai-fundamentals/quiz" className="font-sans text-[13px] text-[#ec4899] hover:underline">Start a new drill →</Link>
				</div>
			</main>
		);
	}

	if (!results) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Loading…</div>
			</main>
		);
	}

	const score = colorFor(results.percent);

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8]">
			<div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[760px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/ai-fundamentals" className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">AI Fundamentals</span>
					</Link>
					<div className="flex gap-3">
						<Link href="/ai-fundamentals/quiz" className="font-sans text-[13px] text-[#888] hover:text-white">New drill</Link>
						<Link href="/ai-fundamentals/dashboard" className="font-sans text-[13px] text-[#888] hover:text-white">Dashboard</Link>
					</div>
				</div>
			</div>

			<div className="max-w-[760px] mx-auto px-6 py-12">
				<div className="text-center mb-12">
					<div className="font-mono text-[12px] text-[#666] mb-2 uppercase tracking-wider">Drill complete</div>
					<div className="flex items-baseline justify-center gap-3 mb-3">
						<span className="font-serif text-[72px] font-bold leading-none" style={{ color: score }}>
							{Math.round(results.percent)}%
						</span>
					</div>
					<div className="font-sans text-[15px] text-[#888]">
						{results.totalCorrect} / {results.totalQuestions} correct · {fmtDuration(results.durationSeconds)}
					</div>
				</div>

				<section className="mb-10">
					<h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[#666] mb-3">By topic</h2>
					<div className="space-y-1.5">
						{results.byTopic
							.filter((t) => t.total > 0)
							.map((t) => (
								<div key={t.topic} className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-3 flex items-center gap-3">
									<div className="flex-1 min-w-0">
										<div className="font-sans text-[13px] font-medium text-white truncate">
											{TOPIC_LABELS[t.topic] || t.topic}
										</div>
										<div className="mt-1 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
											<div className="h-full" style={{ width: `${t.percent}%`, backgroundColor: colorFor(t.percent) }} />
										</div>
									</div>
									<span className="font-mono text-[12px] tabular-nums shrink-0" style={{ color: colorFor(t.percent) }}>
										{t.correct}/{t.total}
									</span>
								</div>
							))}
					</div>
				</section>

				{results.weakestTopics.length > 0 && (
					<section className="mb-10">
						<h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[#666] mb-3">Where to focus next</h2>
						<div className="flex flex-wrap gap-2">
							{results.weakestTopics.map((t) => (
								<Link
									key={t}
									href={`/ai-fundamentals/quiz?prefill=topic:${t}`}
									className="px-3 py-1.5 rounded-lg border border-[#ec489940] bg-[#ec48990D] font-sans text-[13px] text-[#ec4899] hover:bg-[#ec489918]"
								>
									{TOPIC_LABELS[t] || t} →
								</Link>
							))}
						</div>
					</section>
				)}

				{results.missedQuestions.length > 0 && (
					<section className="mb-10">
						<h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[#666] mb-3">
							Missed ({results.missedQuestions.length})
						</h2>
						<div className="space-y-3">
							{results.missedQuestions.map((m) => (
								<div key={m.id} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
									<div className="font-sans text-[11px] text-[#666] mb-2 uppercase tracking-wider">
										{TOPIC_LABELS[m.topic] || m.topic} · answer: {m.correct}
									</div>
									<div className="font-serif text-[15px] text-white leading-[1.55] mb-2">{m.stem}</div>
									<div className="font-sans text-[13px] text-[#aaa] leading-[1.6]">{m.explanation}</div>
								</div>
							))}
						</div>
					</section>
				)}

				<div className="flex gap-3 justify-center mt-10">
					<Link href="/ai-fundamentals/quiz" className="px-4 py-2 rounded-lg bg-[#ec4899] text-white font-sans text-sm font-bold">
						New drill
					</Link>
					<Link href="/ai-fundamentals/dashboard" className="px-4 py-2 rounded-lg border border-[#ec489955] text-[#ec4899] font-sans text-sm font-semibold hover:bg-[#ec4899]/10">
						Dashboard →
					</Link>
				</div>
			</div>
		</main>
	);
}
