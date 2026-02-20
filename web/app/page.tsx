import type { Metadata } from "next"
import Link from "next/link"
import { APP_CONFIG } from "@/config"

export const metadata: Metadata = {
	title: `${APP_CONFIG.NAME} — The Tutoring Gap Nobody's Building For`,
	description: APP_CONFIG.DESCRIPTION,
}

/* ───────────────────── Data ───────────────────── */

const STATS = [
	{ value: "33%", color: "text-red-500", label: "of 8th graders read\nbelow basic level" },
	{ value: "10.8M", color: "text-amber-500", label: "students chronically\nabsent in 2024" },
	{ value: "$2,500", color: "text-teal-500", label: "per-student cost of\nhigh-dosage tutoring" },
]

const BAR_CHART_EFFECTIVENESS = [
	{ label: "Full HDT (2:1)", value: "0.40 SD", height: "65%", gradient: "from-teal-500 to-teal-600", delay: "" },
	{ label: "Hybrid (Tutor + CAL)", value: "0.23 SD", height: "52%", gradient: "from-blue-400 to-blue-600", delay: "animation-delay-150" },
	{ label: "ALEKS Alone", value: "~0.05 SD", height: "18%", gradient: "from-zinc-500 to-zinc-600", delay: "animation-delay-300" },
]

const BAR_CHART_COST = [
	{ label: "Full HDT (2:1)", value: "$3,500", height: "90%", gradient: "from-red-500 to-red-700", delay: "", isTarget: false },
	{ label: "Saga Hybrid", value: "$2,300", height: "66%", gradient: "from-amber-500 to-amber-600", delay: "animation-delay-150", isTarget: false },
	{ label: "Khanmigo", value: "$35", height: "14%", gradient: "from-blue-400 to-blue-600", delay: "animation-delay-300", isTarget: false },
	{ label: "AI-Powered CAL", value: "~$30", height: "10%", gradient: "from-green-500 to-green-600", delay: "animation-delay-450", isTarget: true },
]

const COMPARISON_ROWS = [
	{ feature: "Socratic dialogue", aleks: { text: "None", status: "no" }, khanmigo: { text: "Yes", status: "yes" }, needed: { text: "✓", status: "yes" } },
	{ feature: "Error diagnosis", aleks: { text: "Binary", status: "no" }, khanmigo: { text: "~80% accuracy", status: "partial" }, needed: { text: "Deep + reliable", status: "gap" } },
	{ feature: "Math computation", aleks: { text: "Reliable", status: "yes" }, khanmigo: { text: "Needs calculator", status: "no" }, needed: { text: "Hybrid engine", status: "gap" } },
	{ feature: "Hint quality", aleks: { text: "Generic", status: "partial" }, khanmigo: { text: "35% error rate", status: "partial" }, needed: { text: "Scaffolded + safe", status: "gap" } },
	{ feature: "Tutor handoff", aleks: { text: "None", status: "no" }, khanmigo: { text: "None", status: "no" }, needed: { text: "Knowledge map", status: "gap" } },
	{ feature: "Built for hybrid HDT", aleks: { text: "Retrofitted", status: "no" }, khanmigo: { text: "Standalone", status: "no" }, needed: { text: "Purpose-built", status: "gap" } },
]

const WHAT_NEEDED = [
	"The AI gets the student for half the session and must **diagnose exactly where they're stuck** through Socratic questioning — not multiple choice",
	"It produces a **handoff artifact** — a concise knowledge map of gaps identified and priorities — for the human tutor to use in their half",
	"The human tutor session becomes **2x more productive** because they're not spending 10 minutes figuring out where the student is",
	"The diagnostic loop compounds: AI diagnoses → human tutors → AI measures progress → human adjusts",
]

const SOURCES = [
	{ id: 1, text: 'NAEP 2024 Results — ', link: "https://nces.ed.gov/nationsreportcard/", linkText: "nces.ed.gov/nationsreportcard", extra: "; UChicago Education Lab analysis of NAEP score distributions" },
	{ id: 2, text: "White House analysis of chronic absenteeism and NAEP declines; Attendance Works data, 2024" },
	{ id: 3, text: "RAND Corporation teacher surveys; McKinsey & Company analysis of teacher time allocation" },
	{ id: 4, text: 'Bhatt, M., Guryan, J., Khan, S., LaForest-Tucker, M., & Mishra, B. (2024). "Can Technology Facilitate Scale? Evidence from a Randomized Evaluation of High Dosage Tutoring." ', link: "https://educationlab.uchicago.edu/projects/saga-tech/", linkText: "NBER Working Paper 32510" },
	{ id: 5, text: "ALEKS — Assessment and Learning in Knowledge Spaces. Originally developed at UC Irvine, 1994. Now McGraw-Hill. ", link: "https://en.wikipedia.org/wiki/ALEKS", linkText: "Wikipedia" },
	{ id: 6, text: "Common Sense Education review of ALEKS — ", link: "https://www.commonsense.org/education/reviews/aleks", linkText: "commonsense.org" },
	{ id: 7, text: 'DiCerbo, K. (2025). Interview in Education Week on Khanmigo adoption growth — ', link: "https://www.edweek.org/technology/opinion-can-an-ai-powered-tutor-produce-meaningful-results/2025/07", linkText: "edweek.org" },
	{ id: 8, text: '"Generating In-Context, Personalized Feedback for Intelligent Tutors with Large Language Models." International Journal of AI in Education, 2025 — ', link: "https://link.springer.com/article/10.1007/s40593-025-00505-6", linkText: "Springer" },
	{ id: 9, text: "Khan Academy Blog — Khanmigo Math Computation and Tutoring Updates — ", link: "https://blog.khanacademy.org/khanmigo-math-computation-and-tutoring-updates/", linkText: "blog.khanacademy.org" },
	{ id: 10, text: 'Masood, A. (2025). "The Quiet Math of EdTech — Can AI Tutors Really Teach?" — ', link: "https://medium.com/@adnanmasood/the-quiet-math-of-edtech-can-ai-tutors-really-teach-737195005abf", linkText: "Medium" },
]

/* ───────────────────── Page ───────────────────── */

export default function Home() {
	return (
		<main className="min-h-dvh bg-[#0a0a0a]">
			<div className="max-w-[680px] mx-auto px-6 pt-[60px] pb-20 md:px-6 max-sm:px-4 max-sm:pt-10 max-sm:pb-[60px]">

				{/* ── Header ── */}
				<p className="font-sans text-[13px] font-medium text-[#555] tracking-[0.06em] uppercase mb-4">
					Problem Thesis · Feb 2026
				</p>

				<h1 className="font-serif text-[38px] max-sm:text-[28px] font-bold leading-[1.2] text-white mb-5 tracking-[-0.02em]">
					The Best Education Intervention Can&rsquo;t Scale. AI Could Fix That — But Nobody&rsquo;s Building the Right Thing.
				</h1>

				<p className="text-[19px] text-[#888] leading-[1.6] mb-8 italic font-serif">
					High-dosage tutoring is the strongest evidence-based intervention in K-12 education. It costs $2,500/student and we can&rsquo;t hire enough tutors. A UChicago RCT proved technology can replace half the tutor time — but the technology they used was from 1994.
				</p>

				<Link
					href="/demo"
					className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#4f9cf7] text-white font-sans text-[15px] font-semibold hover:bg-[#3d8be5] transition-colors no-underline mb-10"
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M9 1.5L11.3 6.1L16.5 6.9L12.75 10.55L13.6 15.7L9 13.3L4.4 15.7L5.25 10.55L1.5 6.9L6.7 6.1L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
					</svg>
					Try the tutoring tool
				</Link>

				<Divider />

				{/* ── Section 1: The Crisis ── */}
				<BodyText>
					The bottom is falling out of American education. Not the average — the <strong className="text-white font-semibold">bottom</strong>. The 2024 NAEP results showed that one-third of 8th graders now read below &ldquo;basic&rdquo; level, the highest share in the test&rsquo;s history.<Cite id={1} /> Learning losses from the pandemic aren&rsquo;t recovering — they&rsquo;re <strong className="text-white font-semibold">compounding</strong>. For the lowest-performing 10% of students, losses grew 70% <em>larger</em> between 2022 and 2024.<Cite id={1} />
				</BodyText>

				<StatRow stats={STATS} />

				<BodyText>
					Chronic absenteeism surged from ~15% pre-COVID to 28% in 2022, and remains around 24% today. A White House analysis found that absenteeism alone accounts for 16–27% of math declines and 36–45% of reading declines on NAEP.<Cite id={2} /> It&rsquo;s a feedback loop: students miss school, fall behind, school feels worse, they miss more.
				</BodyText>

				<BodyText>
					Meanwhile, teachers are drowning. The typical teacher works 54 hours a week with <strong className="text-white font-semibold">less than half</strong> spent actually teaching.<Cite id={3} /> They spend 7–12 hours a week just searching for instructional resources. Delivering personalized feedback to 140 students at the depth needed would require 43–58 extra hours per week. It&rsquo;s impossible.
				</BodyText>

				{/* ── Section 2: The Best Intervention ── */}
				<SectionHeading>The Best Intervention We Have</SectionHeading>

				<BodyText>
					High-dosage tutoring (HDT) — small group, 3+ days a week, during the school day, with a structured curriculum — has the <strong className="text-white font-semibold">strongest evidence base of any education intervention</strong>. Effect sizes of 0.23–0.40 standard deviations, equivalent to 1–2.5 extra years of math learning.<Cite id={4} />
				</BodyText>

				<BodyText>
					But only 37% of schools offer it. Roughly 10% of students actually participate. The barriers are simple: <strong className="text-white font-semibold">cost and staffing</strong>. You need trained bodies in rooms. Not enough exist. And the ESSER funds that were financing most tutoring programs expired in September 2024.<Cite id={2} />
				</BodyText>

				{/* ── Section 3: The UChicago Breakthrough ── */}
				<SectionHeading>The UChicago Breakthrough</SectionHeading>

				<BodyText>
					In May 2024, the UChicago Education Lab published results from an RCT of over 4,000 students across Chicago and NYC public schools.<Cite id={4} /> They tested a hybrid model: students in groups of 4, alternating daily between a human tutor (2 students) and a computer-assisted learning platform (2 students).
				</BodyText>

				<ChartSection
					title="Tutoring Model Effectiveness"
					subtitle="Effect size in standard deviations (higher = more learning)"
					source="Source: Bhatt et al. (2024), NBER Working Paper 32510; ALEKS meta-analysis, Huang et al. (2021)"
				>
					<BarChart bars={BAR_CHART_EFFECTIVENESS} height="180px" />
				</ChartSection>

				<BodyText>
					The hybrid model produced <strong className="text-white font-semibold">0.23 SD gains</strong> — nearly as large as full 2:1 tutoring — at <strong className="text-white font-semibold">30% lower cost</strong>. It halved the number of tutors needed.<Cite id={4} /> The per-pupil cost dropped from ~$3,500 to ~$2,300.
				</BodyText>

				<BodyText>
					This is the strongest piece of evidence in modern education technology. But there&rsquo;s a problem.
				</BodyText>

				{/* ── Section 4: The CAL Was Built for a Past Era ── */}
				<SectionHeading>The CAL Was Built for a Past Era</SectionHeading>

				<BodyText>
					The computer-assisted learning platform in the study was <strong className="text-white font-semibold">ALEKS</strong> — a McGraw-Hill product built on Knowledge Space Theory from 1994.<Cite id={5} /> It&rsquo;s a worksheet engine. Present problem, check answer, move on. No dialogue. No Socratic questioning. No ability to ask &ldquo;where did your thinking go wrong?&rdquo;
				</BodyText>

				<BodyText>
					ALEKS&rsquo;s content is mostly traditional, decontextualized, and dry.<Cite id={6} /> There are few opportunities to explore concepts or build real understanding. It works best for students who already have strong self-regulation — precisely the students who <em>least</em> need intervention. For the students who are multiple grade levels behind, disengaged, and struggling? It&rsquo;s a dead end.
				</BodyText>

				<BodyText>
					Worse: ALEKS operates in a silo. It has <strong className="text-white font-semibold">zero handoff</strong> to the human tutor. When a student rotates from the ALEKS session to the tutor session, the tutor starts from scratch — spending precious minutes re-diagnosing where the student is stuck instead of teaching.
				</BodyText>

				{/* ── Section 5: AI Tutoring Landscape ── */}
				<SectionHeading>Current AI Tutoring: Closer, But Still Not It</SectionHeading>

				<BodyText>
					Khanmigo, Khan Academy&rsquo;s LLM-powered tutor, went from 68,000 users to over 700,000 in a single school year.<Cite id={7} /> It can have Socratic conversations and adapt in real time. That&rsquo;s genuine progress.
				</BodyText>

				<BodyText>
					But the problems are real. A study evaluating GPT-4 for tutoring feedback found that <strong className="text-white font-semibold">35% of generated hints were too general, incorrect, or gave away the answer</strong>.<Cite id={8} /> Khan Academy has had to build a separate calculator because LLMs can&rsquo;t reliably do math computation.<Cite id={9} /> And the broader evidence is clear: <strong className="text-white font-semibold">teacher-in-the-loop consistently outperforms AI-only</strong>, with no credible evidence of hitting Bloom&rsquo;s 2-sigma through AI alone.<Cite id={10} />
				</BodyText>

				<ChartSection
					title="The Gap Nobody's Filling"
					subtitle="What exists vs. what the hybrid tutoring model actually needs"
				>
					<ComparisonTable rows={COMPARISON_ROWS} />
				</ChartSection>

				{/* ── Section 6: The Opportunity ── */}
				<SectionHeading>What Needs to Exist</SectionHeading>

				<BodyText>
					Nobody has built the CAL specifically for the hybrid tutoring use case. ALEKS was a standalone product crammed into the rotation. Khanmigo is a standalone product sold to districts. Neither was designed from the ground up for the 25-minute alternating block where:
				</BodyText>

				<BulletList items={WHAT_NEEDED} />

				<BodyText>
					That handoff loop is the product nobody&rsquo;s built. And it maps directly onto the strongest evidence base in education.
				</BodyText>

				<ChartSection
					title="Unit Economics of Scaling"
					subtitle="Per-student annual cost by approach"
					source="Sources: Bhatt et al. (2024); Khan Academy district pricing; Saga Education cost data"
				>
					<BarChart bars={BAR_CHART_COST} height="160px" />
				</ChartSection>

				<BodyText>
					If AI-powered CAL delivers even <strong className="text-white font-semibold">30% of tutoring&rsquo;s effect at 5% of the cost</strong>, the ROI argument writes itself. At $30/student/year — matching Khanmigo&rsquo;s price point — districts can reach <strong className="text-white font-semibold">10x more students</strong> than with tutors alone. And unlike standalone AI tutoring, this plugs directly into the hybrid model that already has RCT-validated evidence.
				</BodyText>

				{/* ── The Pitch ── */}
				<PitchBlock>
					<p>10.8 million students were chronically absent last year. The ones who do show up are falling further behind. The best intervention we have works but costs $2,500/student and we can&rsquo;t hire enough tutors.</p>
					<p className="mt-4">UChicago proved you can cut that cost 30% by alternating tutor time with technology. But the technology they used was pre-ChatGPT.</p>
					<p className="mt-4">The gap is a <strong className="text-white font-semibold not-italic">Socratic diagnostic engine</strong> that identifies exactly where a student is stuck, adapts in real time, and hands the human tutor a knowledge map so their 25 minutes together actually count. Not a chatbot. Not a worksheet engine. A diagnostic layer that makes every tutor 2x more effective.</p>
				</PitchBlock>

				<BodyText>
					Still, there are real challenges. LLM math accuracy remains unreliable without heavy scaffolding. The 35% hint error rate needs to be driven toward zero before this touches a classroom. And any solution needs to fit into existing school schedules and workflows — not require a new one.
				</BodyText>

				<BodyText>
					I&rsquo;m building this. You can try the Socratic diagnostic engine right now — it runs a 25-minute session, generates SVG diagrams, and produces a tutor handoff artifact at the end.
				</BodyText>

				<Link
					href="/demo"
					className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-[#0a0a0a] font-sans text-[15px] font-semibold hover:bg-[#e8e8e8] transition-colors no-underline mb-5"
				>
					Try a tutoring session
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</Link>

				<BodyText>
					If you&rsquo;re a district leader running a tutoring program, a researcher studying hybrid models, or a teacher doing intervention blocks and want to talk — reach out.
				</BodyText>

				{/* ── Sources ── */}
				<SourcesSection sources={SOURCES} />
			</div>
		</main>
	)
}

/* ──────────────────── Components ──────────────────── */

function Divider() {
	return <div className="w-12 h-0.5 bg-[#4f9cf7] my-10" />
}

function BodyText({ children }: { children: React.ReactNode }) {
	return (
		<p className="font-serif text-lg leading-[1.75] text-[#e8e8e8] mb-5">
			{children}
		</p>
	)
}

function SectionHeading({ children }: { children: React.ReactNode }) {
	return (
		<h2 className="font-serif text-[26px] font-semibold text-white mt-12 mb-4 tracking-[-0.01em]">
			{children}
		</h2>
	)
}

function Cite({ id }: { id: number }) {
	return (
		<sup className="font-sans text-[11px] text-[#4f9cf7] ml-[1px] cursor-help not-italic">
			[{id}]
		</sup>
	)
}

function StatRow({ stats }: { stats: typeof STATS }) {
	return (
		<div className="grid grid-cols-3 max-sm:grid-cols-1 gap-3 my-8">
			{stats.map((stat) => (
				<div key={stat.value} className="bg-[#141414] border border-[#2a2a2a] rounded-[10px] px-4 py-5 text-center">
					<div className={`font-sans text-[32px] font-bold leading-none mb-1.5 ${stat.color}`}>
						{stat.value}
					</div>
					<div className="font-sans text-xs text-[#888] leading-[1.4] font-medium whitespace-pre-line">
						{stat.label}
					</div>
				</div>
			))}
		</div>
	)
}

function ChartSection({
	title,
	subtitle,
	source,
	children,
}: {
	title: string
	subtitle: string
	source?: string
	children: React.ReactNode
}) {
	return (
		<div className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-6 py-7 my-8">
			<div className="font-sans text-sm font-semibold text-[#e8e8e8] mb-1">{title}</div>
			<div className="font-sans text-xs text-[#555] mb-5">{subtitle}</div>
			{children}
			{source && (
				<div className="font-sans text-[11px] text-[#555] mt-9">{source}</div>
			)}
		</div>
	)
}

type BarData = {
	label: string
	value: string
	height: string
	gradient: string
	delay: string
	isTarget?: boolean
}

function BarChart({ bars, height }: { bars: BarData[]; height: string }) {
	return (
		<div className="flex items-end gap-2 pb-8 relative" style={{ height }}>
			{bars.map((bar) => (
				<div key={bar.label} className="flex-1 flex flex-col items-center relative h-full justify-end">
					<div
						className={`w-full max-w-16 rounded-t-md bg-gradient-to-b ${bar.gradient} relative animate-bar-grow ${bar.delay}`}
						style={{ height: bar.height }}
					>
						<span className="font-sans text-[13px] font-bold text-white absolute -top-[22px] left-1/2 -translate-x-1/2 whitespace-nowrap">
							{bar.value}
						</span>
					</div>
					<span className="font-sans text-[11px] text-[#888] text-center absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
						{bar.label}
					</span>
					{bar.isTarget && (
						<span className="font-sans text-[10px] text-green-500 absolute -bottom-[42px] left-1/2 -translate-x-1/2 whitespace-nowrap">
							(target)
						</span>
					)}
				</div>
			))}
		</div>
	)
}

function ComparisonTable({ rows }: { rows: typeof COMPARISON_ROWS }) {
	const statusStyles = {
		yes: "text-green-500",
		no: "text-red-500",
		partial: "text-amber-500",
		gap: "text-[#4f9cf7] font-semibold",
	}

	const statusPrefix = {
		yes: "✓ ",
		no: "✗ ",
		partial: "~ ",
		gap: "",
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse font-sans text-sm">
				<thead>
					<tr>
						<th className="text-left px-3 py-2.5 font-semibold text-xs text-[#555] uppercase tracking-[0.05em] border-b border-[#2a2a2a]">Capability</th>
						<th className="text-left px-3 py-2.5 font-semibold text-xs text-[#555] uppercase tracking-[0.05em] border-b border-[#2a2a2a]">ALEKS (1994)</th>
						<th className="text-left px-3 py-2.5 font-semibold text-xs text-[#555] uppercase tracking-[0.05em] border-b border-[#2a2a2a]">Khanmigo (2024)</th>
						<th className="text-left px-3 py-2.5 font-semibold text-xs text-[#555] uppercase tracking-[0.05em] border-b border-[#2a2a2a]">What&rsquo;s Needed</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr key={row.feature}>
							<td className={`px-3 py-3 text-[#e8e8e8] font-medium min-w-[130px] ${i < rows.length - 1 ? "border-b border-[#2a2a2a]" : ""}`}>
								{row.feature}
							</td>
							<td className={`px-3 py-3 text-[#888] align-top ${i < rows.length - 1 ? "border-b border-[#2a2a2a]" : ""}`}>
								<span className={statusStyles[row.aleks.status as keyof typeof statusStyles]}>
									{statusPrefix[row.aleks.status as keyof typeof statusPrefix]}{row.aleks.text}
								</span>
							</td>
							<td className={`px-3 py-3 text-[#888] align-top ${i < rows.length - 1 ? "border-b border-[#2a2a2a]" : ""}`}>
								<span className={statusStyles[row.khanmigo.status as keyof typeof statusStyles]}>
									{statusPrefix[row.khanmigo.status as keyof typeof statusPrefix]}{row.khanmigo.text}
								</span>
							</td>
							<td className={`px-3 py-3 text-[#888] align-top ${i < rows.length - 1 ? "border-b border-[#2a2a2a]" : ""}`}>
								<span className={statusStyles[row.needed.status as keyof typeof statusStyles]}>
									{statusPrefix[row.needed.status as keyof typeof statusPrefix]}{row.needed.text}
								</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function BulletList({ items }: { items: string[] }) {
	return (
		<ul className="list-none p-0 my-5">
			{items.map((item) => (
				<li
					key={item.slice(0, 30)}
					className="relative pl-6 mb-2.5 font-sans text-[15px] leading-[1.5] text-[#e8e8e8] before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-sm before:bg-[#4f9cf7]"
					dangerouslySetInnerHTML={{
						__html: item
							.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
					}}
				/>
			))}
		</ul>
	)
}

function PitchBlock({ children }: { children: React.ReactNode }) {
	return (
		<blockquote className="bg-gradient-to-br from-[rgba(79,156,247,0.06)] to-[rgba(20,184,166,0.04)] border-l-[3px] border-[#4f9cf7] rounded-r-[10px] px-6 py-6 my-9 italic text-[#e8e8e8] leading-[1.7] font-serif text-lg">
			{children}
		</blockquote>
	)
}

function SourcesSection({ sources }: { sources: typeof SOURCES }) {
	return (
		<div className="mt-14 pt-6 border-t border-[#2a2a2a]">
			<h3 className="font-sans text-[13px] font-semibold text-[#555] uppercase tracking-[0.06em] mb-3">
				Sources
			</h3>
			<div className="font-sans text-xs text-[#555] leading-8">
				{sources.map((s) => (
					<div key={s.id}>
						[{s.id}] {s.text}
						{s.link && (
							<a href={s.link} target="_blank" rel="noopener noreferrer" className="text-[#888] hover:text-[#4f9cf7] no-underline transition-colors">
								{s.linkText}
							</a>
						)}
						{"extra" in s && s.extra}
					</div>
				))}
			</div>
		</div>
	)
}
