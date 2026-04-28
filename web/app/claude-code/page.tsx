import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Reps — Pass the Anthropic Claude Code certification",
	description:
		"The fastest path to passing the Anthropic Claude Code certification. Drill the six exam scenarios, hit 95% on simulated mocks, and see exactly where you're weak.",
};

const SCENARIOS = [
	{ id: "customer-support", n: 1, title: "Customer Support Resolution", color: "#4f9cf7", focus: "Programmatic enforcement, structured handoffs, escalation calibration." },
	{ id: "code-generation", n: 2, title: "Code Generation with Claude Code", color: "#22c55e", focus: "CLAUDE.md hierarchy, slash commands, plan vs direct, iterative refinement." },
	{ id: "multi-agent-research", n: 3, title: "Multi-Agent Research", color: "#a855f7", focus: "Hub-and-spoke orchestration, parallel spawning, provenance preservation." },
	{ id: "developer-productivity", n: 4, title: "Developer Productivity", color: "#f59e0b", focus: "Built-in tool selection, MCP scoping, session management, context degradation." },
	{ id: "ci-cd", n: 5, title: "Claude Code in CI/CD", color: "#ef4444", focus: "Non-interactive CLI, structured output, multi-pass review, batch vs sync." },
	{ id: "structured-extraction", n: 6, title: "Structured Data Extraction", color: "#06b6d4", focus: "tool_use + JSON schema, validation/retry, batch correlation, provenance." },
];

const MODES = [
	{ title: "Mock exam", body: "50 questions, 120-minute timer, weighted by domain like the real thing. Hit 95% before you book the test." },
	{ title: "Scenario drills", body: "Lock onto one of the six scenarios. Repeat until pattern-matching is automatic." },
	{ title: "Domain drills", body: "Target your weakest domain (D1–D5). The dashboard tells you which one to fix next." },
	{ title: "Gotcha drills", body: "The anti-patterns the exam slips in as distractors: sentiment-based escalation, CLAUDE_HEADLESS, batch-for-pre-merge, bigger-model-fixes-dilution." },
	{ title: "Socratic tutor", body: "When MC drilling isn't enough, the AI tutor walks you through the underlying concept and pushes back on shallow answers." },
	{ title: "Read the scenarios", body: "All six exam-guide deep-dives, in-app, formatted for re-reading. Every passer says: memorize them." },
];

const PASSER_TIPS = [
	{ tip: "Memorize the scenarios.", detail: "More than the courses, more than docs. The five scenarios in the exam guide are the test." },
	{ tip: "Don't book until 95%.", detail: "720 passes, but 95% on the practice test means you'll comfortably clear the trick questions on exam day." },
	{ tip: "Read the entire question.", detail: "The stem often disqualifies a distractor — 'tool definitions are well defined' rules out 'improve tool definitions'." },
	{ tip: "When in doubt, pick the simpler option.", detail: "The exam rewards common-sense scalability and maintainability over clever architectures." },
];

export default function ClaudeCodeCertLanding() {
	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8]">
			<nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-3">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</Link>
					<div className="flex items-center gap-4">
						<Link href="/scenarios" className="hidden sm:block font-sans text-sm text-[#888] hover:text-white">
							Scenarios
						</Link>
						<Link href="/dashboard" className="hidden sm:block font-sans text-sm text-[#888] hover:text-white">
							Dashboard
						</Link>
						<Link
							href="/quiz"
							className="font-sans text-sm font-medium px-4 py-1.5 rounded-lg bg-[#F5B800] text-black hover:bg-[#e0a800] transition-colors"
						>
							Start drilling
						</Link>
					</div>
				</div>
			</nav>

			<section className="pt-36 pb-20 px-6">
				<div className="max-w-[760px] mx-auto text-center">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B800]/10 border border-[#F5B800]/30 mb-7">
						<span className="font-sans text-[11px] font-semibold text-[#F5B800] tracking-[0.08em] uppercase">Anthropic Claude Code Certification</span>
					</div>
					<h1 className="font-serif text-[48px] sm:text-[64px] font-bold text-white leading-[1.05] tracking-[-0.03em] mb-6">
						Pass the Claude<br />Code cert.
					</h1>
					<p className="font-serif text-[20px] text-[#aaa] leading-[1.6] mb-3 max-w-[600px] mx-auto">
						The exam is multiple-choice over six known scenarios. The path to a clean pass is the same every time:{" "}
						<span className="text-white">drill the scenarios, hit 95% on simulated mocks, then book it.</span>
					</p>
					<p className="font-serif text-[18px] text-[#888] leading-[1.6] mb-9 max-w-[560px] mx-auto">
						Reps gives you the question bank, the mock exam, and the per-domain dashboard that tells you exactly where you're weak.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Link
							href="/quiz"
							className="px-8 py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold hover:bg-[#e0a800] transition-colors"
						>
							Start a quick drill
						</Link>
						<Link
							href="/scenarios"
							className="px-8 py-3.5 rounded-xl border border-[#2a2a2a] text-white font-sans text-[15px] font-semibold hover:border-[#444]"
						>
							Read the scenarios
						</Link>
					</div>
					<p className="mt-4 font-sans text-xs text-[#555]">No signup. No payment. Drill, see your gaps, fix them.</p>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-[#1a1a1a] bg-[#080808]">
				<div className="max-w-[1100px] mx-auto">
					<div className="text-center mb-12">
						<h2 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-3">The six scenarios</h2>
						<p className="font-sans text-[15px] text-[#888] max-w-[600px] mx-auto">
							Anthropic's exam guide ships five scenarios; we cover all six known deep-dives. Memorize them — every passer says they were the bulk of the prep.
						</p>
					</div>
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{SCENARIOS.map((s) => (
							<Link
								key={s.id}
								href={`/scenarios/${s.id}`}
								className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5 hover:border-[#444] transition-colors"
							>
								<div className="flex items-center gap-3 mb-3">
									<span
										className="w-8 h-8 rounded-md flex items-center justify-center font-mono text-[13px] font-bold text-white"
										style={{ backgroundColor: s.color }}
									>
										{s.n}
									</span>
									<span className="font-sans text-[14px] font-semibold text-white">{s.title}</span>
								</div>
								<p className="font-sans text-[12px] text-[#888] leading-[1.6]">{s.focus}</p>
							</Link>
						))}
					</div>
				</div>
			</section>

			<section className="py-20 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto">
					<div className="text-center mb-12">
						<h2 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-3">Six ways to drill</h2>
						<p className="font-sans text-[15px] text-[#888] max-w-[560px] mx-auto">
							Quick warm-up to full mock exam. Pick the mode that matches where you are this morning.
						</p>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
						{MODES.map((m) => (
							<div key={m.title} className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
								<h3 className="font-sans text-[14px] font-semibold text-white mb-2">{m.title}</h3>
								<p className="font-sans text-[13px] text-[#888] leading-[1.6]">{m.body}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="py-20 px-6 border-t border-[#1a1a1a] bg-[#080808]">
				<div className="max-w-[820px] mx-auto">
					<div className="mb-10">
						<h2 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-3">Tips from someone who passed</h2>
						<p className="font-sans text-[14px] text-[#888]">
							Notes from a recent passer. We baked these into how Reps drills.
						</p>
					</div>
					<div className="space-y-4">
						{PASSER_TIPS.map((t) => (
							<div key={t.tip} className="flex gap-4 items-start">
								<span className="w-1.5 h-1.5 rounded-full bg-[#F5B800] mt-3 shrink-0" />
								<div>
									<div className="font-sans text-[15px] font-semibold text-white">{t.tip}</div>
									<div className="font-sans text-[13px] text-[#888] leading-[1.65] mt-1">{t.detail}</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="py-24 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[680px] mx-auto text-center">
					<h2 className="font-serif text-[40px] font-bold text-white tracking-[-0.02em] mb-4">Drill till you pass.</h2>
					<p className="font-sans text-[15px] text-[#888] mb-8 max-w-[460px] mx-auto">
						720 is the pass line. 950 is when you stop drilling and book the exam. Reps tells you which line you're on.
					</p>
					<Link
						href="/quiz"
						className="inline-block px-10 py-4 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold hover:bg-[#e0a800] transition-colors"
					>
						Start your first drill
					</Link>
				</div>
			</section>

			<footer className="py-10 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-4">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-sans text-[12px] font-bold text-[#F5B800] tracking-wider">XORS</span>
						<span className="font-sans text-[12px] text-[#333]">/</span>
						<span className="font-sans text-[12px] text-[#555]">Reps</span>
					</Link>
					<div className="flex gap-4">
						<Link href="/scenarios" className="font-sans text-[12px] text-[#555] hover:text-[#888]">Scenarios</Link>
						<Link href="/quiz" className="font-sans text-[12px] text-[#555] hover:text-[#888]">Drill</Link>
						<Link href="/dashboard" className="font-sans text-[12px] text-[#555] hover:text-[#888]">Dashboard</Link>
					</div>
				</div>
			</footer>
		</main>
	);
}
