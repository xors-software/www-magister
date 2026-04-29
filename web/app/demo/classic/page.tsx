"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

type EducationLevel = "cissp" | "oscp" | "claude-cert"

const CISSP_TOPICS = [
	{ id: "cissp-security-risk-mgmt", label: "Security & Risk Management", description: "Risk analysis, BCP/DRP, governance, compliance", icon: "1" },
	{ id: "cissp-asset-security", label: "Asset Security", description: "Data classification, ownership, retention & destruction", icon: "2" },
	{ id: "cissp-security-architecture", label: "Security Architecture", description: "Security models, cryptography, secure design", icon: "3" },
	{ id: "cissp-network-security", label: "Network Security", description: "Network attacks, secure protocols, VPNs", icon: "4" },
	{ id: "cissp-iam", label: "Identity & Access Management", description: "Access control, authentication, identity lifecycle", icon: "5" },
	{ id: "cissp-security-assessment", label: "Security Assessment", description: "Vulnerability assessment, pen testing, audits", icon: "6" },
	{ id: "cissp-security-operations", label: "Security Operations", description: "Incident response, forensics, logging", icon: "7" },
	{ id: "cissp-software-security", label: "Software Development Security", description: "Secure SDLC, injection attacks, DevSecOps", icon: "8" },
]

const OSCP_TOPICS = [
	{ id: "oscp-enumeration", label: "Enumeration", description: "Port scanning, service detection, web/SMB enumeration", icon: ">" },
	{ id: "oscp-exploitation", label: "Exploitation", description: "Public exploits, reverse shells, password attacks", icon: "!" },
	{ id: "oscp-privilege-escalation", label: "Privilege Escalation", description: "Linux & Windows privesc, SUID, sudo, tokens", icon: "^" },
	{ id: "oscp-pivoting", label: "Pivoting & Tunneling", description: "SSH tunnels, Chisel, SOCKS proxies, lateral movement", icon: "#" },
	{ id: "oscp-active-directory", label: "Active Directory", description: "BloodHound, Kerberoasting, AS-REP, DCSync", icon: "D" },
	{ id: "oscp-web-attacks", label: "Web Attacks", description: "SQLi, LFI/RFI, file upload, command injection", icon: "W" },
	{ id: "oscp-report-writing", label: "Report Writing", description: "Findings, executive summary, methodology docs", icon: "R" },
]

const CLAUDE_CERT_TOPICS = [
	{ id: "claude-api-fundamentals", label: "API Fundamentals", description: "Messages API, models, tokens, streaming", icon: "A" },
	{ id: "claude-prompt-engineering", label: "Prompt Engineering", description: "System prompts, few-shot, chain-of-thought", icon: "P" },
	{ id: "claude-tool-use", label: "Tool Use", description: "Tool definitions, parallel calls, agentic loops", icon: "T" },
	{ id: "claude-mcp", label: "MCP", description: "MCP servers, resources, prompts, transports", icon: "M" },
	{ id: "claude-agent-design", label: "Agent Design", description: "Single/multi-agent systems, human-in-the-loop", icon: "O" },
	{ id: "claude-system-architecture", label: "Architecture", description: "RAG, deployment, reliability, cost optimization", icon: "S" },
	{ id: "claude-safety-alignment", label: "Safety & Alignment", description: "Guardrails, prompt injection, evaluation", icon: "!" },
]

const LEVEL_CONFIG = {
	cissp: { accent: "#4f9cf7", label: "CISSP", defaultTopic: "cissp-security-risk-mgmt", subtitle: "8 domains · $749 exam", tagline: "Think like a security manager" },
	oscp: { accent: "#ef4444", label: "OSCP", defaultTopic: "oscp-enumeration", subtitle: "7 skill areas · $1,749 exam", tagline: "Hack boxes, write reports" },
	"claude-cert": { accent: "#F5B800", label: "Claude CCA", defaultTopic: "claude-api-fundamentals", subtitle: "7 topic areas · $250 exam", tagline: "Build production-grade AI systems" },
} as const

export default function DemoPage() {
	return (
		<Suspense fallback={<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center"><div className="font-sans text-[#555] animate-pulse">Loading...</div></main>}>
			<DemoPageInner />
		</Suspense>
	)
}

function DemoPageInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [educationLevel, setEducationLevel] = useState<EducationLevel>("cissp")
	const [topic, setTopic] = useState("cissp-security-risk-mgmt")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	useEffect(() => {
		const levelParam = searchParams.get("level") as EducationLevel | null
		if (levelParam && LEVEL_CONFIG[levelParam]) {
			setEducationLevel(levelParam)
			setTopic(LEVEL_CONFIG[levelParam].defaultTopic)
		}
	}, [searchParams])

	const config = LEVEL_CONFIG[educationLevel]

	const currentTopics = educationLevel === "oscp"
		? OSCP_TOPICS
		: educationLevel === "claude-cert"
			? CLAUDE_CERT_TOPICS
			: CISSP_TOPICS

	function switchEducationLevel(level: EducationLevel) {
		setEducationLevel(level)
		setTopic(LEVEL_CONFIG[level].defaultTopic)
	}

	async function startSession() {
		setLoading(true)
		setError("")

		try {
			const res = await fetch(`${API}/demo-sessions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					educationLevel,
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
			<div className="w-full max-w-[540px]">
				<Link href="/" className="block mb-8">
					<div className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Magister</span>
					</div>
				</Link>

				<h1 className="font-serif text-[32px] font-bold text-white leading-[1.2] tracking-[-0.02em] mb-2">
					Pick your certification
				</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8">
					Choose a cert and topic. The AI tutor will guide you through realistic scenarios — no experience required.
				</p>

				{/* Certification tabs */}
				<div className="flex gap-2 mb-6">
					{(["cissp", "oscp", "claude-cert"] as const).map((level) => {
						const c = LEVEL_CONFIG[level]
						const active = educationLevel === level
						return (
							<button
								key={level}
								type="button"
								onClick={() => switchEducationLevel(level)}
								className={`flex-1 py-3 rounded-xl font-sans text-sm font-semibold transition-all ${
									active ? "text-white shadow-lg" : "bg-[#141414] border border-[#2a2a2a] text-[#888] hover:border-[#555]"
								}`}
								style={active ? { backgroundColor: c.accent } : undefined}
							>
								{c.label}
							</button>
						)
					})}
				</div>

				{/* Cert info */}
				<div className="mb-6 px-1">
					<div className="flex items-center gap-2 mb-1">
						<span className="font-serif text-[17px] text-white italic">&ldquo;{config.tagline}&rdquo;</span>
					</div>
					<span className="font-sans text-xs text-[#555]">{config.subtitle}</span>
				</div>

				{/* Topics */}
				<div className="mb-6">
					<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-2">
						{educationLevel === "oscp" ? "Skill area" : educationLevel === "claude-cert" ? "Topic" : "Domain"}
					</label>
					<div className="grid gap-1.5">
						{currentTopics.map((t) => {
							const active = topic === t.id
							return (
								<button
									key={t.id}
									type="button"
									onClick={() => setTopic(t.id)}
									className="text-left px-3.5 py-2.5 rounded-lg transition-all flex items-center gap-3"
									style={{
										backgroundColor: active ? config.accent + "15" : "#111",
										borderWidth: 1,
										borderStyle: "solid",
										borderColor: active ? config.accent + "50" : "#1a1a1a",
									}}
								>
									<span
										className="w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0"
										style={{
											backgroundColor: active ? config.accent : "#1a1a1a",
											color: active ? "white" : "#555",
										}}
									>
										{t.icon}
									</span>
									<div className="min-w-0">
										<div className={`font-sans text-[13px] font-medium truncate ${active ? "text-white" : "text-[#ccc]"}`}>
											{t.label}
										</div>
										<div className="font-sans text-[11px] text-[#555] truncate">
											{t.description}
										</div>
									</div>
								</button>
							)
						})}
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
					className="w-full py-3.5 rounded-xl text-white font-sans text-[15px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					style={{ backgroundColor: config.accent }}
				>
					{loading ? "Starting..." : "Start session"}
				</button>

				<p className="mt-3 font-sans text-[11px] text-[#555] text-center">
					No signup. No experience needed. AI Socratic tutor powered by Claude.
				</p>
			</div>
		</main>
	)
}
