"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, fetchMe } from "@/lib/auth";

type DomainScore = { domain: string; correct: number; total: number; percent: number };
type ScenarioScore = { scenario: string; correct: number; total: number; percent: number };
type Missed = {
	id: string;
	stem: string;
	domain: string;
	scenario: string;
	selected: "A" | "B" | "C" | "D" | null;
	correct: "A" | "B" | "C" | "D";
	explanation: string;
	studyTags: string[];
};
type Results = {
	totalCorrect: number;
	totalQuestions: number;
	percent: number;
	estimatedExamScore: number;
	passLikely: boolean;
	examReady: boolean;
	durationSeconds: number;
	byDomain: DomainScore[];
	byScenario: ScenarioScore[];
	weakestDomains: string[];
	weakestScenarios: string[];
	missedQuestions: Missed[];
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

function fmtDuration(sec: number) {
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	return `${m}m ${s}s`;
}

function colorFor(pct: number) {
	if (pct >= 95) return "#22c55e";
	if (pct >= 80) return "#84cc16";
	if (pct >= 70) return "#F5B800";
	if (pct >= 50) return "#f59e0b";
	return "#ef4444";
}

export default function ResultsPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [results, setResults] = useState<Results | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		(async () => {
			const me = await fetchMe();
			if (!me) {
				router.push(`/login?next=/claude-code/quiz/${params.id}/results`);
				return;
			}
			try {
				const res = await apiFetch(`/cert/quiz/${params.id}/results`);
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
					<Link href="/claude-code/quiz" className="font-sans text-[13px] text-[#F5B800] hover:underline">Start a new drill →</Link>
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

	const headlineColor = colorFor(results.percent);
	const passColor = results.examReady ? "#22c55e" : results.passLikely ? "#F5B800" : "#ef4444";
	const passLabel = results.examReady
		? "Exam-ready"
		: results.passLikely
			? "Likely to pass"
			: "Not yet ready";

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] pb-20">
			<nav className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[820px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</Link>
					<div className="flex gap-3">
						<Link href="/claude-code/quiz" className="font-sans text-[13px] text-[#888] hover:text-white">New drill</Link>
						<Link href="/claude-code/dashboard" className="font-sans text-[13px] text-[#888] hover:text-white">Dashboard</Link>
					</div>
				</div>
			</nav>

			<div className="max-w-[820px] mx-auto px-6 py-10">
				<div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-8 mb-8">
					<div className="flex items-baseline gap-3 mb-2">
						<span
							className="font-mono text-[12px] font-semibold uppercase tracking-wider"
							style={{ color: passColor }}
						>
							{passLabel}
						</span>
						<span className="font-sans text-xs text-[#555]">{fmtDuration(results.durationSeconds)}</span>
					</div>
					<div className="flex items-end gap-6">
						<div>
							<div className="font-mono text-[64px] font-bold leading-none" style={{ color: headlineColor }}>
								{Math.round(results.percent)}%
							</div>
							<div className="font-sans text-[13px] text-[#888] mt-2">
								{results.totalCorrect} of {results.totalQuestions} correct
							</div>
						</div>
						<div className="ml-auto text-right">
							<div className="font-sans text-[11px] text-[#555] uppercase tracking-wider">Estimated exam score</div>
							<div className="font-mono text-[28px] font-bold text-white">{results.estimatedExamScore}</div>
							<div className="font-sans text-[11px] text-[#555]">pass = 720 · target = 950</div>
						</div>
					</div>
					<div className="mt-6 h-2 rounded-full bg-[#1a1a1a] overflow-hidden relative">
						<div
							className="absolute inset-y-0 left-0"
							style={{ width: `${results.percent}%`, backgroundColor: headlineColor }}
						/>
						<div className="absolute inset-y-0" style={{ left: "72%", width: 1, backgroundColor: "#444" }} />
						<div className="absolute inset-y-0" style={{ left: "95%", width: 1, backgroundColor: "#22c55e" }} />
					</div>
					<div className="flex justify-between font-mono text-[10px] text-[#555] mt-1">
						<span>0</span>
						<span style={{ marginLeft: "67%" }}>720 pass</span>
						<span>950 target</span>
					</div>
				</div>

				<section className="mb-10">
					<h2 className="font-serif text-[22px] text-white tracking-[-0.01em] mb-4">By domain</h2>
					<div className="grid sm:grid-cols-2 gap-3">
						{results.byDomain.map((d) => (
							<div
								key={d.domain}
								className="rounded-xl border p-4"
								style={{
									borderColor: d.total > 0 ? `${colorFor(d.percent)}30` : "#1a1a1a",
									backgroundColor: d.total > 0 ? `${colorFor(d.percent)}08` : "#0d0d0d",
								}}
							>
								<div className="flex items-baseline justify-between mb-1">
									<span className="font-mono text-[12px] font-bold text-[#888]">{d.domain}</span>
									<span className="font-mono text-[14px] font-bold" style={{ color: colorFor(d.percent) }}>
										{d.total === 0 ? "—" : `${Math.round(d.percent)}%`}
									</span>
								</div>
								<div className="font-sans text-[13px] text-white mb-2">{DOMAIN_LABELS[d.domain]}</div>
								<div className="font-sans text-[11px] text-[#555]">
									{d.total === 0 ? "Not in this drill" : `${d.correct}/${d.total} correct`}
								</div>
							</div>
						))}
					</div>
				</section>

				<section className="mb-10">
					<h2 className="font-serif text-[22px] text-white tracking-[-0.01em] mb-4">By scenario</h2>
					<div className="grid sm:grid-cols-2 gap-3">
						{results.byScenario.map((s) => (
							<div
								key={s.scenario}
								className="rounded-xl border p-4"
								style={{
									borderColor: s.total > 0 ? `${colorFor(s.percent)}30` : "#1a1a1a",
									backgroundColor: s.total > 0 ? `${colorFor(s.percent)}08` : "#0d0d0d",
								}}
							>
								<div className="flex items-baseline justify-between mb-1">
									<span className="font-sans text-[13px] text-white">{SCENARIO_LABELS[s.scenario]}</span>
									<span className="font-mono text-[14px] font-bold" style={{ color: colorFor(s.percent) }}>
										{s.total === 0 ? "—" : `${Math.round(s.percent)}%`}
									</span>
								</div>
								<div className="font-sans text-[11px] text-[#555]">
									{s.total === 0 ? "Not in this drill" : `${s.correct}/${s.total} correct`}
								</div>
							</div>
						))}
					</div>
				</section>

				{results.missedQuestions.length > 0 && (
					<section className="mb-10">
						<h2 className="font-serif text-[22px] text-white tracking-[-0.01em] mb-4">
							Missed ({results.missedQuestions.length})
						</h2>
						<div className="space-y-3">
							{results.missedQuestions.map((m) => (
								<div key={m.id} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
									<div className="flex flex-wrap gap-1.5 mb-3">
										<span className="px-2 py-0.5 rounded font-mono text-[10px] font-medium border border-[#222] text-[#888]">{m.domain}</span>
										<span className="px-2 py-0.5 rounded font-mono text-[10px] font-medium border border-[#222] text-[#888]">{SCENARIO_LABELS[m.scenario]}</span>
									</div>
									<div className="font-sans text-[14px] text-[#ddd] leading-[1.6] mb-3">{m.stem}</div>
									<div className="font-sans text-[12px] text-[#888] mb-2">
										You picked <span className="text-red-400 font-mono font-bold">{m.selected ?? "—"}</span> · Correct{" "}
										<span className="text-green-400 font-mono font-bold">{m.correct}</span>
									</div>
									<div className="font-sans text-[13px] text-[#bbb] leading-[1.6]">{m.explanation}</div>
									{(() => {
										const visible = m.studyTags.filter(
											(t) => !/^task[-_ ]?\d/i.test(t),
										);
										return visible.length > 0 ? (
											<div className="flex flex-wrap gap-1.5 mt-3">
												{visible.map((t) => (
													<span key={t} className="px-2 py-0.5 rounded font-mono text-[10px] text-[#666] border border-[#222]">{t}</span>
												))}
											</div>
										) : null;
									})()}
								</div>
							))}
						</div>
					</section>
				)}

				<section className="rounded-2xl border border-[#F5B800]/30 bg-[#F5B800]/5 p-6">
					<h3 className="font-serif text-[18px] text-white mb-3">What to do next</h3>
					{results.weakestDomains.length > 0 && (
						<div className="mb-3">
							<div className="font-sans text-[12px] text-[#888] uppercase tracking-wider mb-1">Weakest domains</div>
							<div className="flex flex-wrap gap-2">
								{results.weakestDomains.map((d) => (
									<Link
										key={d}
										href={`/claude-code/quiz?prefill=domain:${d}`}
										className="px-3 py-1 rounded-full font-mono text-[12px] text-[#F5B800] border border-[#F5B800]/40 hover:bg-[#F5B800]/10"
									>
										{d}: {DOMAIN_LABELS[d]}
									</Link>
								))}
							</div>
						</div>
					)}
					{results.weakestScenarios.length > 0 && (
						<div className="mb-4">
							<div className="font-sans text-[12px] text-[#888] uppercase tracking-wider mb-1">Weakest scenarios</div>
							<div className="flex flex-wrap gap-2">
								{results.weakestScenarios.map((s) => (
									<Link
										key={s}
										href={`/claude-code/scenarios/${s}`}
										className="px-3 py-1 rounded-full font-sans text-[12px] text-[#F5B800] border border-[#F5B800]/40 hover:bg-[#F5B800]/10"
									>
										Read: {SCENARIO_LABELS[s]}
									</Link>
								))}
							</div>
						</div>
					)}
					<div className="flex flex-wrap gap-3">
						<Link href="/claude-code/quiz" className="px-4 py-2 rounded-lg bg-[#F5B800] text-black font-sans text-sm font-bold">
							Run another drill
						</Link>
						<Link href="/claude-code/dashboard" className="px-4 py-2 rounded-lg border border-[#F5B80055] text-[#F5B800] font-sans text-sm font-semibold hover:bg-[#F5B800]/10">
							View dashboard
						</Link>
					</div>
				</section>
			</div>
		</main>
	);
}
