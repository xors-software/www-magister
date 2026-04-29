import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Reps — AI Fundamentals · Lazer × Deloitte L&D",
	description:
		"A two-week AI adoption curriculum for engineers and PMs. Twelve cheatsheets, eight live sessions, and primer documents covering tokens, context, RAG, agents, prompt patterns, debugging, and more.",
};

const CHEATSHEETS: { slug: string; title: string; tagline: string; minutes: number }[] = [
	{ slug: "ai-fundamentals", title: "AI Fundamentals", tagline: "How LLMs actually work — enough to be a calibrated user, not a magical thinker.", minutes: 6 },
	{ slug: "ai-terminology", title: "AI Terminology", tagline: "Vocabulary primer — the words you'll hear every day. No fluff, no jargon-for-jargon's-sake.", minutes: 5 },
	{ slug: "context-and-prompts", title: "Context & Prompts", tagline: "What goes in the window, what stays out, and how prompt structure changes the answer.", minutes: 6 },
	{ slug: "prompt-patterns", title: "Prompt Patterns", tagline: "Reusable shapes that work: role, examples, format, scaffolding, anti-patterns.", minutes: 7 },
	{ slug: "models-and-spend", title: "Models & Spend", tagline: "When to reach for Sonnet vs Opus vs Haiku. Cost intuition without a spreadsheet.", minutes: 6 },
	{ slug: "task-decomposition", title: "Task Decomposition", tagline: "Breaking a fuzzy ask into pieces an agent can actually finish.", minutes: 5 },
	{ slug: "cursor-modes", title: "Cursor Modes", tagline: "Ask vs Edit vs Agent vs Plan — what each does, when each wins.", minutes: 5 },
	{ slug: "cursor-vs-jetbrains", title: "Cursor vs JetBrains", tagline: "Pragmatic comparison for teams choosing or running both side by side.", minutes: 4 },
	{ slug: "rules-and-repo-config", title: "Rules & Repo Config", tagline: ".cursor/rules and AGENTS.md — repo-level settings that compound across the team.", minutes: 6 },
	{ slug: "keyboard-shortcuts", title: "Keyboard Shortcuts", tagline: "The Cursor shortcuts that earn back the most minutes per day.", minutes: 3 },
	{ slug: "tdd-with-agent", title: "TDD with Agent Mode", tagline: "Use the agent loop as a TDD partner — write the test, let it iterate to green.", minutes: 6 },
	{ slug: "debugging-workflows", title: "Debugging Workflows", tagline: "Stack trace → reproduce → bisect → fix. Where the agent helps, where it hurts.", minutes: 6 },
];

const SESSIONS: { slug: string; date: string; title: string; tagline: string; ext: "pdf" | "pptx" }[] = [
	{ slug: "2026-04-13-kickoff", date: "Apr 13", title: "AI L&D Kickoff", tagline: "Two-week roadmap, expectations, and the calibrated-user mindset.", ext: "pdf" },
	{ slug: "2026-04-17-cursor-modes", date: "Apr 17", title: "Cursor Modes", tagline: "Live walkthrough of Ask, Edit, Agent, and Plan with real refactors.", ext: "pptx" },
	{ slug: "2026-04-20-context-and-prompt-craft", date: "Apr 20", title: "Context Management & Prompt Craft", tagline: "What to attach, when to compact, how to frame.", ext: "pptx" },
	{ slug: "2026-04-21-model-selection-and-spend", date: "Apr 21", title: "Model Selection & Spend Awareness", tagline: "Cost-per-task intuition. Reaching for the right model.", ext: "pptx" },
	{ slug: "2026-04-22-rules-and-repo-config", date: "Apr 22", title: "Rules & Repo Configuration", tagline: ".cursor/rules patterns that scale across the team.", ext: "pptx" },
	{ slug: "2026-04-23-tdd-with-agent", date: "Apr 23", title: "TDD with Agent Mode", tagline: "Watching agent close the test-fix loop.", ext: "pptx" },
	{ slug: "2026-04-24-debugging-workflows", date: "Apr 24", title: "Debugging Workflows in Cursor", tagline: "Real bugs, real session recordings, real fixes.", ext: "pptx" },
	{ slug: "2026-04-27-hooks-automating-the-loop", date: "Apr 27", title: "Hooks: Automating the Loop", tagline: "Pre/Post hooks to enforce conventions and catch regressions.", ext: "pptx" },
];

const DOCS: { slug: string; title: string; tagline: string }[] = [
	{ slug: "ai-for-pms", title: "AI for PMs: From Ideas to Implementation-Ready Work", tagline: "Long-form playbook for product managers. How to take a fuzzy idea, shape it with AI assistance, and hand off something an engineer can build." },
	{ slug: "ai-terminology-primer", title: "AI Terminology Primer", tagline: "Long-form companion to the terminology cheatsheet — same vocabulary, expanded context and examples." },
];

export default function AIFundamentalsPage() {
	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] pb-20">
			<nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-3">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</Link>
					<div className="flex items-center gap-4">
						<Link href="/" className="hidden sm:block font-sans text-sm text-[#888] hover:text-white">Home</Link>
						<Link href="#cheatsheets" className="hidden sm:block font-sans text-sm text-[#888] hover:text-white">Cheatsheets</Link>
						<Link
							href="/ai-fundamentals/quiz"
							className="font-sans text-sm font-medium px-4 py-1.5 rounded-lg bg-[#ec4899] text-white hover:bg-[#db2777] transition-colors"
						>
							Drill the basics
						</Link>
					</div>
				</div>
			</nav>

			<section className="pt-36 pb-16 px-6">
				<div className="max-w-[760px] mx-auto">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ec4899]/10 border border-[#ec4899]/30 mb-7">
						<span className="font-sans text-[11px] font-semibold text-[#ec4899] tracking-[0.08em] uppercase">Lazer × Deloitte L&D · Pilot</span>
					</div>
					<h1 className="font-serif text-[44px] sm:text-[56px] font-bold text-white leading-[1.05] tracking-[-0.03em] mb-5">
						AI Fundamentals
					</h1>
					<p className="font-serif text-[20px] text-[#aaa] leading-[1.6] mb-3 max-w-[640px]">
						A two-week curriculum for engineers and PMs new to working with AI. Built around <span className="text-white">how LLMs actually work</span> and <span className="text-white">how to be a calibrated user</span> — not a magical thinker.
					</p>
					<p className="font-serif text-[18px] text-[#888] leading-[1.65] max-w-[600px]">
						Twelve printable cheatsheets, eight live-session decks, and two long-form primers. Read in any order; the cheatsheets are the densest starting point.
					</p>
				</div>
			</section>

			<section id="cheatsheets" className="py-16 px-6 border-t border-[#1a1a1a] bg-[#080808] scroll-mt-20">
				<div className="max-w-[1100px] mx-auto">
					<div className="mb-10">
						<h2 className="font-serif text-[30px] font-bold text-white tracking-[-0.02em] mb-2">Cheatsheets</h2>
						<p className="font-sans text-[14px] text-[#888] max-w-[600px]">
							Single-page references. Each one is dense, designed for re-reading, and meant to be printed if that's how you study.
						</p>
					</div>
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{CHEATSHEETS.map((c) => (
							<a
								key={c.slug}
								href={`/ai-fundamentals/cheatsheets/${c.slug}.pdf`}
								target="_blank"
								rel="noopener noreferrer"
								className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5 hover:border-[#ec4899]/60 transition-colors group"
							>
								<div className="flex items-start justify-between gap-3 mb-2">
									<h3 className="font-sans text-[14px] font-semibold text-white group-hover:text-[#ec4899] transition-colors">{c.title}</h3>
									<span className="font-mono text-[10px] text-[#555] mt-0.5 shrink-0">{c.minutes} min</span>
								</div>
								<p className="font-sans text-[12px] text-[#888] leading-[1.6]">{c.tagline}</p>
								<div className="mt-3 flex items-center gap-1 font-sans text-[11px] text-[#555] group-hover:text-[#ec4899] transition-colors">
									Open PDF →
								</div>
							</a>
						))}
					</div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto">
					<div className="mb-10">
						<h2 className="font-serif text-[30px] font-bold text-white tracking-[-0.02em] mb-2">Live sessions</h2>
						<p className="font-sans text-[14px] text-[#888] max-w-[600px]">
							Decks from the eight live sessions. PowerPoint files download; the kickoff is a PDF you can preview inline.
						</p>
					</div>
					<div className="space-y-2">
						{SESSIONS.map((s) => (
							<a
								key={s.slug}
								href={`/ai-fundamentals/sessions/${s.slug}.${s.ext}`}
								target={s.ext === "pdf" ? "_blank" : undefined}
								rel="noopener noreferrer"
								className="block rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4 hover:border-[#ec4899]/60 transition-colors group"
							>
								<div className="flex items-start gap-4">
									<span className="font-mono text-[11px] font-semibold text-[#ec4899] mt-1 shrink-0 w-14">{s.date}</span>
									<div className="flex-1 min-w-0">
										<div className="flex items-baseline justify-between gap-3">
											<h3 className="font-sans text-[14px] font-semibold text-white group-hover:text-[#ec4899] transition-colors">{s.title}</h3>
											<span className="font-mono text-[10px] text-[#555] uppercase tracking-wider shrink-0">{s.ext}</span>
										</div>
										<p className="font-sans text-[12px] text-[#888] leading-[1.6] mt-1">{s.tagline}</p>
									</div>
								</div>
							</a>
						))}
					</div>
				</div>
			</section>

			<section className="py-16 px-6 border-t border-[#1a1a1a] bg-[#080808]">
				<div className="max-w-[1100px] mx-auto">
					<div className="mb-10">
						<h2 className="font-serif text-[30px] font-bold text-white tracking-[-0.02em] mb-2">Long-form primers</h2>
						<p className="font-sans text-[14px] text-[#888] max-w-[600px]">
							When the cheatsheet isn't enough. Word docs you can download, annotate, or share inside your team.
						</p>
					</div>
					<div className="grid md:grid-cols-2 gap-3">
						{DOCS.map((d) => (
							<a
								key={d.slug}
								href={`/ai-fundamentals/docs/${d.slug}.docx`}
								className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5 hover:border-[#ec4899]/60 transition-colors group"
							>
								<div className="flex items-start justify-between gap-3 mb-2">
									<h3 className="font-sans text-[14px] font-semibold text-white group-hover:text-[#ec4899] transition-colors leading-snug">{d.title}</h3>
									<span className="font-mono text-[10px] text-[#555] uppercase tracking-wider shrink-0 mt-0.5">DOCX</span>
								</div>
								<p className="font-sans text-[13px] text-[#888] leading-[1.65]">{d.tagline}</p>
							</a>
						))}
					</div>
				</div>
			</section>

			<section className="py-20 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[760px] mx-auto">
					<div className="rounded-2xl border border-[#ec4899]/30 bg-gradient-to-br from-[#ec4899]/10 to-transparent p-8 sm:p-10">
						<div className="font-sans text-[11px] font-semibold text-[#ec4899] uppercase tracking-[0.08em] mb-3">
							Test what you remember
						</div>
						<h2 className="font-serif text-[30px] font-bold text-white tracking-[-0.02em] mb-3">
							Drill the basics
						</h2>
						<p className="font-sans text-[15px] text-[#aaa] leading-[1.65] mb-6 max-w-[560px]">
							Quick-fire multiple choice over the cheatsheet content. Three modes: a 10-question warm-up, a topic-focused drill, or a 30-question mock mix. Per-topic dashboard tracks where you're solid and where to re-read.
						</p>
						<div className="flex flex-wrap gap-3">
							<Link
								href="/ai-fundamentals/quiz"
								className="px-6 py-3 rounded-xl bg-[#ec4899] text-white font-sans text-[14px] font-bold hover:bg-[#db2777]"
							>
								Start a drill →
							</Link>
							<Link
								href="/ai-fundamentals/dashboard"
								className="px-6 py-3 rounded-xl border border-[#ec489940] text-[#ec4899] font-sans text-[14px] font-semibold hover:bg-[#ec4899]/10"
							>
								Your dashboard
							</Link>
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[680px] mx-auto text-center">
					<h2 className="font-serif text-[30px] font-bold text-white tracking-[-0.02em] mb-4">Once you've drilled the basics</h2>
					<p className="font-sans text-[14px] text-[#888] mb-8 max-w-[480px] mx-auto leading-[1.7]">
						When you're ready to go deeper into Anthropic's tooling specifically — the Claude API, agent SDK, and Claude Code workflows — head to the certification track.
					</p>
					<Link
						href="/claude-code"
						className="inline-block px-8 py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold hover:bg-[#e0a800] transition-colors"
					>
						Claude Code certification track →
					</Link>
				</div>
			</section>

			<footer className="py-10 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-4">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-sans text-[12px] font-bold text-[#F5B800] tracking-wider">XORS</span>
						<span className="font-sans text-[12px] text-[#333]">/</span>
						<span className="font-sans text-[12px] text-[#555]">Reps · AI L&D</span>
					</Link>
					<span className="font-sans text-[11px] text-[#444]">Lazer × Deloitte L&D · v2 · 2026</span>
				</div>
			</footer>
		</main>
	);
}
