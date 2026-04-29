import type { Metadata } from "next"
import Link from "next/link"
import { APP_CONFIG } from "@/config"

export const metadata: Metadata = {
	title: `${APP_CONFIG.NAME} by XORS — AI-Powered Certification Prep`,
	description: APP_CONFIG.DESCRIPTION,
}

const CERTIFICATIONS = [
	{
		name: "Claude Code Cert",
		accent: "#F5B800",
		price: "$200",
		tagline: "Pass the Anthropic Claude Code certification",
		description: "Full MC question bank, 50-question mock exam with timer, per-domain dashboard, scenario reader, and adaptive question generation that targets your weak spots.",
		topics: ["Agentic Architecture", "Tool Design & MCP", "Claude Code Workflows", "Prompt Engineering", "Context Management", "6 Scenarios", "5 Domains"],
		stat: "5 domains · 6 scenarios",
		cta: "Drill the exam",
		level: "claude-cert" as const,
		href: "/claude-code",
		badge: "Full prep platform",
	},
	{
		name: "CISSP",
		accent: "#4f9cf7",
		price: "$749",
		tagline: "Think like a security manager, not a test-taker",
		description: "Socratic tutoring across all 8 CISSP domains. The AI tutor forces you to reason through real security decisions. Mock exam and dashboard not yet wired up for this cert.",
		topics: ["Risk Management", "Asset Security", "Architecture", "Network Security", "IAM", "Assessment", "Operations", "Software Security"],
		stat: "8 domains",
		cta: "Practice CISSP",
		level: "cissp" as const,
		href: "/demo/classic?level=cissp",
		badge: "Tutor only",
	},
	{
		name: "OSCP",
		accent: "#ef4444",
		price: "$1,749",
		tagline: "Hack boxes, write reports, pass the exam",
		description: "Socratic pentesting practice with AI-guided scenarios. Enumeration, exploitation, privilege escalation — specific commands. VM labs and mock exam not yet wired up.",
		topics: ["Enumeration", "Exploitation", "Privilege Escalation", "Pivoting", "Active Directory", "Web Attacks", "Report Writing"],
		stat: "7 skill areas",
		cta: "Practice OSCP",
		level: "oscp" as const,
		href: "/demo/classic?level=oscp",
		badge: "Tutor only",
	},
]

const BROKEN_THINGS = [
	{
		stat: "$200–$1,749",
		title: "Per exam attempt",
		description: "Fail once and you're paying again. Most prep tools are another $50–300/mo on top of that.",
	},
	{
		stat: "72%",
		title: "First-time fail rate (OSCP)",
		description: "The pass rate is abysmal because people memorize instead of understanding. Flashcards don't teach you to think.",
	},
	{
		stat: "0",
		title: "Adaptive AI tutors on the market",
		description: "Every cert prep tool is static: question banks, video lectures, practice tests. None of them adapt to what YOU don't understand.",
	},
	{
		stat: "Closed",
		title: "Source exam content",
		description: "ISC2, OffSec, and Anthropic control the content pipeline. We're building the open, AI-native alternative.",
	},
]

const HOW_IT_WORKS = [
	{
		step: "01",
		title: "Pick your certification",
		description: "CISSP, OSCP, or the Anthropic Claude Code cert. Choose a specific domain or skill area to drill.",
	},
	{
		step: "02",
		title: "Face real scenarios",
		description: "Realistic scenarios where you reason through your answer — like the real exam, with the gotchas and trick distractors baked in.",
	},
	{
		step: "03",
		title: "Get Socratic feedback",
		description: "The AI tutor pushes you deeper. It asks WHY, probes edge cases, and teaches when you're stuck — not before.",
	},
	{
		step: "04",
		title: "See your knowledge map",
		description: "Every session produces a per-domain breakdown showing your gaps, misconceptions, and exactly what to study next.",
	},
]

export default function Home() {
	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8]">
			{/* Nav */}
			<nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</div>
					<div className="flex items-center gap-4">
						<Link href="/claude-code/scenarios" className="hidden sm:block font-sans text-sm text-[#888] hover:text-white">Scenarios</Link>
						<Link href="/claude-code/dashboard" className="hidden sm:block font-sans text-sm text-[#888] hover:text-white">Dashboard</Link>
						<Link
							href="/claude-code/quiz"
							className="font-sans text-sm font-medium px-4 py-1.5 rounded-lg bg-[#F5B800] text-black hover:bg-[#e0a800] transition-colors"
						>
							Try the demo
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className="pt-36 pb-24 px-6">
				<div className="max-w-[720px] mx-auto text-center">
					<div className="inline-flex gap-2 mb-8">
						<span className="px-2.5 py-1 rounded-full bg-[#4f9cf7]/10 border border-[#4f9cf7]/30 font-sans text-xs font-medium text-[#4f9cf7]">CISSP</span>
						<span className="px-2.5 py-1 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/30 font-sans text-xs font-medium text-[#ef4444]">OSCP</span>
						<span className="px-2.5 py-1 rounded-full bg-[#F5B800]/10 border border-[#F5B800]/30 font-sans text-xs font-medium text-[#F5B800]">Claude Code Cert</span>
					</div>
					<h1 className="font-serif text-[48px] sm:text-[64px] font-bold text-white leading-[1.05] tracking-[-0.03em] mb-6">
						Certification prep<br />is broken.
					</h1>
					<p className="font-serif text-[21px] text-[#999] leading-[1.6] mb-4 max-w-[560px] mx-auto">
						Exams cost $200–$1,749 per attempt. Prep tools are flashcard apps that teach memorization. Nobody offers adaptive, AI-native tutoring.
					</p>
					<p className="font-serif text-[21px] text-white leading-[1.6] mb-10 max-w-[560px] mx-auto">
						Until now.
					</p>
					<Link
						href="/claude-code/quiz"
						className="inline-block px-8 py-4 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold hover:bg-[#e0a800] transition-colors"
					>
						Start a free session
					</Link>
					<p className="mt-4 font-sans text-xs text-[#555]">No signup required. Drill the exam, see your gaps, fix them.</p>
				</div>
			</section>

			{/* The problem — by the numbers */}
			<section className="py-20 px-6 border-t border-[#1a1a1a] bg-[#080808]">
				<div className="max-w-[1100px] mx-auto">
					<div className="text-center mb-14">
						<h2 className="font-serif text-[36px] font-bold text-white tracking-[-0.02em] mb-3">The certification industry is a racket</h2>
						<p className="font-sans text-[15px] text-[#666] max-w-[480px] mx-auto">
							Closed-source exams, predatory pricing, and prep tools stuck in 2010.
						</p>
					</div>
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{BROKEN_THINGS.map((item) => (
							<div key={item.title} className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
								<div className="font-mono text-[28px] font-bold text-[#F5B800] mb-2">{item.stat}</div>
								<h3 className="font-sans text-[14px] font-semibold text-white mb-2">{item.title}</h3>
								<p className="font-sans text-[13px] text-[#666] leading-[1.6]">{item.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* What we're building */}
			<section className="py-20 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto">
					<div className="text-center mb-14">
						<h2 className="font-serif text-[36px] font-bold text-white tracking-[-0.02em] mb-3">Three certs. One AI tutor.</h2>
						<p className="font-sans text-[15px] text-[#666] max-w-[500px] mx-auto">
							Reps uses Claude to deliver Socratic, scenario-based prep that adapts to your knowledge gaps in real time.
						</p>
					</div>
					<div className="grid md:grid-cols-3 gap-4">
						{CERTIFICATIONS.map((cert) => (
							<div
								key={cert.name}
								className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#444] transition-colors group relative"
							>
								{cert.badge && (
									<span
										className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider"
										style={{ backgroundColor: `${cert.accent}20`, color: cert.accent }}
									>
										{cert.badge}
									</span>
								)}
								<div className="flex items-center gap-3 mb-4">
									<span
										className="w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold text-white"
										style={{ backgroundColor: cert.accent }}
									>
										{cert.name.charAt(0)}
									</span>
									<div>
										<h3 className="font-sans text-[15px] font-semibold text-white">{cert.name}</h3>
										<span className="font-sans text-xs text-[#555]">{cert.stat} &middot; Exam: {cert.price}</span>
									</div>
								</div>
								<p className="font-serif text-[17px] text-white italic mb-2">&ldquo;{cert.tagline}&rdquo;</p>
								<p className="font-sans text-[13px] text-[#888] leading-[1.6] mb-4">{cert.description}</p>
								<div className="flex flex-wrap gap-1.5 mb-5">
									{cert.topics.map((t) => (
										<span
											key={t}
											className="px-2 py-0.5 rounded text-[11px] font-sans font-medium border"
											style={{
												color: cert.accent,
												borderColor: `${cert.accent}33`,
												backgroundColor: `${cert.accent}0D`,
											}}
										>
											{t}
										</span>
									))}
								</div>
								<Link
									href={cert.href}
									className="block text-center py-2.5 rounded-lg font-sans text-sm font-semibold transition-all border"
									style={{
										color: cert.accent,
										borderColor: `${cert.accent}40`,
									}}
								>
									{cert.cta} &rarr;
								</Link>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* OSCP VM Labs callout */}
			<section className="py-16 px-6 border-t border-[#1a1a1a] bg-[#080808]">
				<div className="max-w-[720px] mx-auto">
					<div className="rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/5 p-8">
						<div className="flex items-center gap-3 mb-4">
							<span className="w-10 h-10 rounded-lg bg-[#ef4444] flex items-center justify-center font-mono text-sm font-bold text-white">VM</span>
							<div>
								<h3 className="font-sans text-[17px] font-bold text-white">Interactive VM Labs for OSCP</h3>
								<span className="font-sans text-xs text-[#ef4444]">Coming soon</span>
							</div>
						</div>
						<p className="font-sans text-[14px] text-[#ccc] leading-[1.7] mb-4">
							Real vulnerable machines, not simulations. Spin up a fresh VM, enumerate services, exploit vulnerabilities, escalate privileges — with an AI tutor guiding your methodology in real time. Each lab auto-destructs after 2 hours.
						</p>
						<div className="flex flex-wrap gap-3">
							<span className="font-mono text-xs text-[#ef4444]/80 px-2 py-1 rounded bg-[#ef4444]/10">nmap &middot; gobuster &middot; Burp Suite</span>
							<span className="font-mono text-xs text-[#ef4444]/80 px-2 py-1 rounded bg-[#ef4444]/10">linpeas &middot; winPEAS &middot; BloodHound</span>
							<span className="font-mono text-xs text-[#ef4444]/80 px-2 py-1 rounded bg-[#ef4444]/10">Impacket &middot; Chisel &middot; Ligolo</span>
						</div>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="py-20 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[680px] mx-auto">
					<h2 className="font-serif text-[36px] font-bold text-white tracking-[-0.02em] mb-12 text-center">
						How it works
					</h2>
					<div className="grid gap-8">
						{HOW_IT_WORKS.map((step) => (
							<div key={step.step} className="flex items-start gap-5">
								<span className="font-mono text-[13px] font-bold text-[#F5B800] mt-1 shrink-0">{step.step}</span>
								<div>
									<h3 className="font-sans text-[15px] font-semibold text-white mb-1">{step.title}</h3>
									<p className="font-sans text-[14px] text-[#888] leading-[1.6]">{step.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Disruption pitch */}
			<section className="py-20 px-6 border-t border-[#1a1a1a] bg-[#080808]">
				<div className="max-w-[680px] mx-auto">
					<h2 className="font-serif text-[36px] font-bold text-white tracking-[-0.02em] mb-6 text-center">
						Why this matters
					</h2>
					<div className="space-y-6 font-serif text-[18px] text-[#ccc] leading-[1.7]">
						<p>
							The certification industry charges thousands for exams and offers{" "}
							<span className="text-white font-semibold">zero adaptive learning</span>. ISC2 charges $749 for the CISSP. OffSec charges $1,749 for the OSCP. Fail and pay again.
						</p>
						<p>
							Meanwhile, the &ldquo;prep&rdquo; market is stuck in 2010:{" "}
							<span className="text-white font-semibold">static question banks, 40-hour video courses, and flashcard apps</span> that teach you to recognize patterns instead of think critically.
						</p>
						<p>
							We&rsquo;re building the first{" "}
							<span className="text-[#F5B800] font-semibold">AI-native certification platform</span>. Reps doesn&rsquo;t quiz you — it{" "}
							<em>teaches</em> you, using the Socratic method powered by Claude. It adapts to your specific knowledge gaps. It produces diagnostic reports a human tutor would charge $200/hr to create.
						</p>
						<p>
							Three certifications to start. <span className="text-white font-semibold">CISSP, OSCP, and the Anthropic Claude Code certification</span> — the credentials that actually matter in security and AI. More coming.
						</p>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-24 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[680px] mx-auto text-center">
					<h2 className="font-serif text-[44px] font-bold text-white tracking-[-0.02em] mb-4">
						Stop memorizing.<br />Start understanding.
					</h2>
					<p className="font-sans text-[15px] text-[#888] mb-8 max-w-[420px] mx-auto">
						Pick a cert and try a session. It takes 5 minutes to see why this is different.
					</p>
					<Link
						href="/claude-code/quiz"
						className="inline-block px-10 py-4 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold hover:bg-[#e0a800] transition-colors"
					>
						Start a free session
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-10 px-6 border-t border-[#1a1a1a]">
				<div className="max-w-[1100px] mx-auto flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="font-sans text-[12px] font-bold text-[#F5B800] tracking-wider">XORS</span>
						<span className="font-sans text-[12px] text-[#333]">/</span>
						<span className="font-sans text-[12px] text-[#555]">Reps</span>
					</div>
					<span className="font-sans text-[12px] text-[#555]">Software done right multiplies what humans can do</span>
				</div>
			</footer>
		</main>
	)
}
