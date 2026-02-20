"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const TOPICS = [
	{ id: "linear-equations", label: "Linear Equations", description: "Solve one-step through multi-step equations", icon: "x" },
	{ id: "fractions-decimals", label: "Fractions & Decimals", description: "Add, multiply, and convert fractions", icon: "%" },
	{ id: "proportional-reasoning", label: "Proportional Reasoning", description: "Unit rates, proportions, and percentages", icon: ":" },
	{ id: "expressions", label: "Expressions & Variables", description: "Evaluate and simplify algebraic expressions", icon: "a" },
	{ id: "geometry", label: "Geometry", description: "Area, Pythagorean theorem, volume", icon: "△" },
]

const GRADES = [6, 7, 8, 9, 10]

export default function DemoPage() {
	const router = useRouter()
	const [name, setName] = useState("")
	const [grade, setGrade] = useState(8)
	const [topic, setTopic] = useState("linear-equations")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	async function startSession() {
		if (!name.trim()) {
			setError("Enter your name to get started.")
			return
		}
		setLoading(true)
		setError("")

		try {
			const res = await fetch(`${API}/sessions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					studentName: name.trim(),
					gradeLevel: grade,
					topic,
				}),
			})
			const data = await res.json()
			if (data.error) {
				setError(data.error)
				setLoading(false)
				return
			}
			router.push(`/session/${data.session.id}`)
		} catch {
			setError("Could not connect to the server. Make sure the API is running.")
			setLoading(false)
		}
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4">
			<div className="w-full max-w-[520px]">
				<Link href="/" className="block mb-10">
					<div className="font-sans text-[13px] font-medium text-[#555] tracking-[0.06em] uppercase">
						Magister
					</div>
				</Link>

				<h1 className="font-serif text-[32px] font-bold text-white leading-[1.2] tracking-[-0.02em] mb-2">
					Start a tutoring session
				</h1>
				<p className="font-sans text-[15px] text-[#888] mb-8">
					Work through math problems with an AI Socratic tutor. When you finish, a handoff report is generated for your human tutor.
				</p>

				{/* Name */}
				<div className="mb-5">
					<label htmlFor="name" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
						Your name
					</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Marcus"
						className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white font-sans text-[15px] placeholder:text-[#555] focus:outline-none focus:border-[#4f9cf7] transition-colors"
						onKeyDown={(e) => e.key === "Enter" && startSession()}
					/>
				</div>

				{/* Grade */}
				<div className="mb-5">
					<label className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
						Grade level
					</label>
					<div className="flex gap-2">
						{GRADES.map((g) => (
							<button
								key={g}
								type="button"
								onClick={() => setGrade(g)}
								className={`flex-1 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
									grade === g
										? "bg-[#4f9cf7] text-white"
										: "bg-[#141414] border border-[#2a2a2a] text-[#888] hover:border-[#555]"
								}`}
							>
								{g}
							</button>
						))}
					</div>
				</div>

				{/* Topic */}
				<div className="mb-8">
					<label className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
						Topic
					</label>
					<div className="grid gap-2">
						{TOPICS.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setTopic(t.id)}
								className={`text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
									topic === t.id
										? "bg-[#4f9cf7]/10 border border-[#4f9cf7]/40"
										: "bg-[#141414] border border-[#2a2a2a] hover:border-[#555]"
								}`}
							>
								<span className={`w-9 h-9 rounded-md flex items-center justify-center font-mono text-sm font-bold shrink-0 ${
									topic === t.id ? "bg-[#4f9cf7] text-white" : "bg-[#1a1a1a] text-[#555]"
								}`}>
									{t.icon}
								</span>
								<div>
									<div className={`font-sans text-sm font-medium ${topic === t.id ? "text-white" : "text-[#e8e8e8]"}`}>
										{t.label}
									</div>
									<div className="font-sans text-xs text-[#555]">
										{t.description}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				{error && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{error}
					</div>
				)}

				<button
					type="button"
					onClick={startSession}
					disabled={loading}
					className="w-full py-3.5 rounded-xl bg-[#4f9cf7] text-white font-sans text-[15px] font-semibold hover:bg-[#3d8be5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Starting session..." : "Begin session"}
				</button>

				<p className="mt-4 font-sans text-xs text-[#555] text-center">
					25-minute Socratic diagnostic session
				</p>
			</div>
		</main>
	)
}
