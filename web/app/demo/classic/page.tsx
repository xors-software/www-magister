"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

type EducationLevel = "k12" | "university" | "professional"

const K12_TOPICS = [
	{ id: "linear-equations", label: "Linear Equations", description: "Solve one-step through multi-step equations", icon: "x" },
	{ id: "fractions-decimals", label: "Fractions & Decimals", description: "Add, multiply, and convert fractions", icon: "%" },
	{ id: "proportional-reasoning", label: "Proportional Reasoning", description: "Unit rates, proportions, and percentages", icon: "∝" },
	{ id: "expressions", label: "Expressions & Variables", description: "Evaluate and simplify algebraic expressions", icon: "a" },
	{ id: "geometry", label: "Geometry", description: "Area, Pythagorean theorem, volume", icon: "△" },
	{ id: "physics-mechanics", label: "Physics: Forces & Motion", description: "Newton's laws, velocity, acceleration, friction", icon: "F" },
	{ id: "physics-energy", label: "Physics: Energy & Work", description: "Kinetic energy, work, conservation of energy", icon: "E" },
]

const UNIVERSITY_TOPICS = [
	{ id: "calculus", label: "Calculus", description: "Derivatives, integrals, and the chain rule", icon: "∫" },
	{ id: "linear-algebra", label: "Linear Algebra", description: "Matrices, determinants, eigenvalues", icon: "M" },
	{ id: "statistics", label: "Statistics & Probability", description: "Hypothesis testing, distributions, probability", icon: "σ" },
	{ id: "classical-mechanics", label: "Classical Mechanics", description: "Projectile motion, torque, rotational dynamics", icon: "τ" },
	{ id: "electromagnetism", label: "Electromagnetism", description: "Coulomb's law, circuits, Ohm's law", icon: "⚡" },
	{ id: "thermodynamics", label: "Thermodynamics", description: "Ideal gas law, heat transfer, entropy", icon: "Q" },
	{ id: "microeconomics", label: "Microeconomics", description: "Supply & demand, elasticity, equilibrium", icon: "$" },
	{ id: "organic-chemistry", label: "Organic Chemistry", description: "Functional groups, reaction mechanisms", icon: "⬡" },
]

const PROFESSIONAL_TOPICS = [
	{ id: "cissp-security-risk-mgmt", label: "Domain 1: Security & Risk Management", description: "Risk analysis, BCP/DRP, governance, legal & regulatory compliance", icon: "1" },
	{ id: "cissp-asset-security", label: "Domain 2: Asset Security", description: "Data classification, ownership, handling, retention & destruction", icon: "2" },
	{ id: "cissp-security-architecture", label: "Domain 3: Security Architecture & Engineering", description: "Security models, cryptography, secure design principles", icon: "3" },
	{ id: "cissp-network-security", label: "Domain 4: Communication & Network Security", description: "Network attacks, secure protocols, VPNs, OSI model", icon: "4" },
	{ id: "cissp-iam", label: "Domain 5: Identity & Access Management", description: "Access control models, authentication, identity lifecycle", icon: "5" },
	{ id: "cissp-security-assessment", label: "Domain 6: Security Assessment & Testing", description: "Vulnerability assessment, pen testing, audits & compliance", icon: "6" },
	{ id: "cissp-security-operations", label: "Domain 7: Security Operations", description: "Incident response, forensics, logging, evidence handling", icon: "7" },
	{ id: "cissp-software-security", label: "Domain 8: Software Development Security", description: "Secure SDLC, injection attacks, DevSecOps", icon: "8" },
]

const K12_GRADES = [6, 7, 8, 9, 10, 11, 12]

export default function DemoPage() {
	const router = useRouter()
	const [name, setName] = useState("")
	const [educationLevel, setEducationLevel] = useState<EducationLevel>("k12")
	const [grade, setGrade] = useState(8)
	const [topic, setTopic] = useState("linear-equations")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	const currentTopics = educationLevel === "professional"
		? PROFESSIONAL_TOPICS
		: educationLevel === "university"
			? UNIVERSITY_TOPICS
			: K12_TOPICS

	function switchEducationLevel(level: EducationLevel) {
		setEducationLevel(level)
		if (level === "professional") {
			setTopic("cissp-security-risk-mgmt")
			setGrade(0)
		} else if (level === "university") {
			setTopic("calculus")
			setGrade(13)
		} else {
			setTopic("linear-equations")
			setGrade(8)
		}
	}

	async function startSession() {
		if (!name.trim()) {
			setError("Enter your name to get started.")
			return
		}
		setLoading(true)
		setError("")

		try {
			const res = await fetch(`${API}/demo-sessions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					studentName: name.trim(),
					educationLevel,
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
			router.push(`/demo/session/${data.session.id}`)
		} catch {
			setError("Could not connect to the server. Make sure the API is running.")
			setLoading(false)
		}
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4 py-10">
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
					Work through problems with an AI Socratic tutor. Get clear feedback on every answer and learn the reasoning behind each solution.
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

				{/* Education Level */}
				<div className="mb-5">
					<label className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
						Education level
					</label>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => switchEducationLevel("k12")}
							className={`flex-1 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
								educationLevel === "k12"
									? "bg-[#4f9cf7] text-white"
									: "bg-[#141414] border border-[#2a2a2a] text-[#888] hover:border-[#555]"
							}`}
						>
							K-12
						</button>
						<button
							type="button"
							onClick={() => switchEducationLevel("university")}
							className={`flex-1 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
								educationLevel === "university"
									? "bg-[#4f9cf7] text-white"
									: "bg-[#141414] border border-[#2a2a2a] text-[#888] hover:border-[#555]"
							}`}
						>
							University
						</button>
						<button
							type="button"
							onClick={() => switchEducationLevel("professional")}
							className={`flex-1 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
								educationLevel === "professional"
									? "bg-[#4f9cf7] text-white"
									: "bg-[#141414] border border-[#2a2a2a] text-[#888] hover:border-[#555]"
							}`}
						>
							CISSP Prep
						</button>
					</div>
				</div>

				{/* Grade (K-12 only) */}
				{educationLevel === "k12" && (
					<div className="mb-5">
						<label className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
							Grade level
						</label>
						<div className="flex gap-2 flex-wrap">
							{K12_GRADES.map((g) => (
								<button
									key={g}
									type="button"
									onClick={() => setGrade(g)}
									className={`flex-1 min-w-[44px] py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
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
				)}

				{/* Topic */}
				<div className="mb-8">
					<label className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
						{educationLevel === "professional" ? "CISSP Domain" : educationLevel === "university" ? "Subject" : "Topic"}
					</label>
					<div className="grid gap-2">
						{currentTopics.map((t) => (
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
					25-minute interactive tutoring session with real-time feedback
				</p>
			</div>
		</main>
	)
}
