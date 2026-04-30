"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface Gap {
	concept: string
	severity: "critical" | "moderate" | "minor"
	evidence: string
}

interface Misconception {
	description: string
	evidence: string
}

interface ProblemResult {
	question: string
	status: "solved" | "moved-on" | "in-progress"
	messageCount: number
}

interface Handoff {
	sessionId: string
	studentName: string
	gradeLevel: number
	topic: string
	sessionDuration: string
	summary: string
	problemsAttempted: ProblemResult[]
	knowledgeGaps: Gap[]
	misconceptions: Misconception[]
	priorities: string[]
	suggestedApproach: string
	strengthsObserved: string[]
}

export default function HandoffPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const [handoff, setHandoff] = useState<Handoff | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch(`${API}/demo-sessions/${id}/handoff`)
				const data = await res.json()
				if (data.error) {
					setError(data.error)
					setLoading(false)
					return
				}
				setHandoff(data)
			} catch {
				setError("Could not generate handoff. Make sure the API is running.")
			}
			setLoading(false)
		}
		load()
	}, [id])

	if (loading) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<div className="font-sans text-[#888] animate-pulse mb-2">Generating handoff report...</div>
					<div className="font-sans text-xs text-[#555]">Analyzing session transcript and building knowledge map</div>
				</div>
			</main>
		)
	}

	if (error || !handoff) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<p className="font-sans text-[#888] mb-4">{error || "Handoff not available."}</p>
					<button type="button" onClick={() => router.push("/demo/classic")} className="font-sans text-sm text-[#4f9cf7] hover:underline">
						Start a new session
					</button>
				</div>
			</main>
		)
	}

	const criticalGaps = handoff.knowledgeGaps.filter((g) => g.severity === "critical")
	const moderateGaps = handoff.knowledgeGaps.filter((g) => g.severity === "moderate")
	const minorGaps = handoff.knowledgeGaps.filter((g) => g.severity === "minor")

	return (
		<main className="min-h-dvh bg-[#0a0a0a]">
			{/* Header */}
			<header className="border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="font-sans text-xs font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
					<span className="text-[#333] font-sans text-[10px]">/</span>
					<span className="font-sans text-xs font-medium text-[#888]">Reps</span>
					<span className="w-px h-4 bg-[#2a2a2a]" />
					<span className="font-sans text-sm text-[#888]">Tutor Handoff</span>
				</div>
				<Link href="/demo/classic" className="font-sans text-xs text-[#555] hover:text-[#888] transition-colors">
					New session
				</Link>
			</header>

			<div className="max-w-[760px] mx-auto px-6 py-8 max-sm:px-4">
				{/* Title */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 rounded-full bg-[#4f9cf7]/15 flex items-center justify-center">
							<span className="font-sans text-lg font-bold text-[#4f9cf7]">{handoff.studentName[0]?.toUpperCase()}</span>
						</div>
						<div>
							<h1 className="font-serif text-[22px] font-bold text-white leading-none">{handoff.studentName}</h1>
							<span className="font-sans text-xs text-[#555]">{handoff.topic} &middot; {handoff.sessionDuration}</span>
						</div>
					</div>
				</div>

				{/* Summary */}
				<Section title="Session Summary">
					<p className="font-sans text-[15px] text-[#e8e8e8] leading-relaxed">{handoff.summary}</p>
				</Section>

				{/* Priorities */}
				{handoff.priorities.length > 0 && (
					<Section title="Top Priorities for Your Session">
						<div className="space-y-2">
							{handoff.priorities.map((p, i) => (
								<div key={p} className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-md bg-[#4f9cf7] text-white font-sans text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
										{i + 1}
									</span>
									<span className="font-sans text-[15px] text-[#e8e8e8]">{p}</span>
								</div>
							))}
						</div>
					</Section>
				)}

				{/* Suggested approach */}
				{handoff.suggestedApproach && (
					<Section title="Suggested Opening">
						<div className="bg-[#4f9cf7]/5 border border-[#4f9cf7]/20 rounded-lg px-4 py-3">
							<p className="font-sans text-[15px] text-[#e8e8e8] italic leading-relaxed">{handoff.suggestedApproach}</p>
						</div>
					</Section>
				)}

				{/* Knowledge Map */}
				{handoff.knowledgeGaps.length > 0 && (
					<Section title="Knowledge Map">
						{criticalGaps.length > 0 && (
							<GapGroup label="Critical Gaps" color="red" gaps={criticalGaps} />
						)}
						{moderateGaps.length > 0 && (
							<GapGroup label="Moderate Gaps" color="amber" gaps={moderateGaps} />
						)}
						{minorGaps.length > 0 && (
							<GapGroup label="Minor Gaps" color="blue" gaps={minorGaps} />
						)}
					</Section>
				)}

				{/* Misconceptions */}
				{handoff.misconceptions.length > 0 && (
					<Section title="Misconceptions Identified">
						<div className="space-y-3">
							{handoff.misconceptions.map((m) => (
								<div key={m.description} className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3">
									<p className="font-sans text-[15px] text-[#e8e8e8] font-medium mb-1">{m.description}</p>
									<p className="font-sans text-xs text-[#555] italic">&ldquo;{m.evidence}&rdquo;</p>
								</div>
							))}
						</div>
					</Section>
				)}

				{/* Strengths */}
				{handoff.strengthsObserved.length > 0 && (
					<Section title="Strengths Observed">
						<div className="flex flex-wrap gap-2">
							{handoff.strengthsObserved.map((s) => (
								<span key={s} className="font-sans text-sm px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
									{s}
								</span>
							))}
						</div>
					</Section>
				)}

				{/* Problems attempted */}
				<Section title="Problems Attempted">
					<div className="space-y-2">
						{handoff.problemsAttempted.map((p) => (
							<div key={p.question} className="flex items-center justify-between gap-3 bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3">
								<span className="font-sans text-sm text-[#e8e8e8] truncate">{p.question}</span>
								<div className="flex items-center gap-2 shrink-0">
									<span className="font-mono text-xs text-[#555]">{p.messageCount} msgs</span>
									<span className={`font-sans text-[11px] px-2 py-0.5 rounded-full font-medium ${
										p.status === "solved" ? "bg-green-500/15 text-green-400" :
										p.status === "moved-on" ? "bg-amber-500/15 text-amber-400" :
										"bg-[#2a2a2a] text-[#555]"
									}`}>
										{p.status === "solved" ? "Solved" : p.status === "moved-on" ? "Moved on" : "In progress"}
									</span>
								</div>
							</div>
						))}
					</div>
				</Section>

				{/* Footer */}
				<div className="mt-10 pt-6 border-t border-[#2a2a2a] flex items-center justify-between">
					<span className="font-sans text-xs text-[#555]">
						Generated by Reps AI Diagnostic Engine
					</span>
					<Link href="/demo/classic" className="font-sans text-sm text-[#4f9cf7] hover:underline">
						Start new session
					</Link>
				</div>
			</div>
		</main>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-7">
			<h2 className="font-sans text-xs font-semibold text-[#555] uppercase tracking-[0.06em] mb-3">{title}</h2>
			{children}
		</div>
	)
}

function GapGroup({ label, color, gaps }: { label: string; color: "red" | "amber" | "blue"; gaps: Gap[] }) {
	const colors = {
		red: { bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500", text: "text-red-400" },
		amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-400" },
		blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500", text: "text-blue-400" },
	}
	const c = colors[color]

	return (
		<div className="mb-3">
			<div className={`text-xs font-medium ${c.text} mb-2 flex items-center gap-1.5`}>
				<span className={`w-2 h-2 rounded-full ${c.dot}`} />
				{label}
			</div>
			<div className="space-y-2">
				{gaps.map((g) => (
					<div key={g.concept} className={`${c.bg} border ${c.border} rounded-lg px-4 py-3`}>
						<p className="font-sans text-[15px] text-[#e8e8e8] font-medium">{g.concept}</p>
						{g.evidence && (
							<p className="font-sans text-xs text-[#555] mt-1 italic">&ldquo;{g.evidence}&rdquo;</p>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
