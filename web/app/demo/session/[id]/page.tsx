"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import katex from "katex"
import "katex/dist/katex.min.css"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface SessionMsg {
	role: string
	content: string
	diagrams?: string[]
	timestamp: string
}

interface ProblemInfo {
	id: string
	question: string
	topic: string
	subtopic: string
	difficulty: string
}

interface SessionInfo {
	id: string
	studentName: string
	educationLevel?: string
	gradeLevel: number
	topic: string
	status: string
	startedAt: string
}

export default function SessionPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const [session, setSession] = useState<SessionInfo | null>(null)
	const [messages, setMessages] = useState<SessionMsg[]>([])
	const [currentProblem, setCurrentProblem] = useState<ProblemInfo | null>(null)
	const [problemIndex, setProblemIndex] = useState(0)
	const [totalProblems, setTotalProblems] = useState(0)
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [elapsed, setElapsed] = useState(0)
	const [loadError, setLoadError] = useState("")
	const [solvedBanner, setSolvedBanner] = useState<string | null>(null)
	const [solvedCount, setSolvedCount] = useState(0)
	const chatEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const isOscp = session?.educationLevel === "oscp"
	const isClaude = session?.educationLevel === "claude-cert"

	const accentColor = isOscp ? "#ef4444" : isClaude ? "#F5B800" : "#4f9cf7"

	const fetchSession = useCallback(async () => {
		try {
			const res = await fetch(`${API}/demo-sessions/${id}`)
			const data = await res.json()
			if (data.error) {
				setLoadError(data.error)
				return
			}
			setSession(data.session)
			setMessages(data.messages || [])
			setCurrentProblem(data.currentProblem)
			setProblemIndex(data.problemIndex)
			setTotalProblems(data.totalProblems)
		} catch {
			setLoadError("Could not load session.")
		}
	}, [id])

	useEffect(() => {
		fetchSession()
	}, [fetchSession])

	useEffect(() => {
		if (!session?.startedAt) return
		const start = new Date(session.startedAt).getTime()
		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - start) / 1000))
		}, 1000)
		return () => clearInterval(interval)
	}, [session?.startedAt])

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	useEffect(() => {
		if (!sending) inputRef.current?.focus()
	}, [sending])

	function showSolvedBanner(question: string) {
		setSolvedBanner(question)
		setSolvedCount((c) => c + 1)
		setTimeout(() => setSolvedBanner(null), 4000)
	}

	async function sendMessage() {
		if (!input.trim() || sending) return
		const content = input.trim()
		setInput("")
		setSending(true)

		setMessages((prev) => [
			...prev,
			{ role: "student", content, timestamp: new Date().toISOString() },
		])

		try {
			const res = await fetch(`${API}/demo-sessions/${id}/message`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content }),
			})
			const data = await res.json()
			if (data.error) {
				setMessages((prev) => [
					...prev,
					{ role: "tutor", content: "Sorry, something went wrong. Try again.", timestamp: new Date().toISOString() },
				])
				setSending(false)
				return
			}

			setMessages(data.messages)

			if (data.problemSolved && data.nextProblem) {
				showSolvedBanner(currentProblem?.question || "Problem")
				setTimeout(() => {
					setCurrentProblem(data.nextProblem)
					setProblemIndex(data.problemIndex)
					setTotalProblems(data.totalProblems)
				}, 1500)
			} else {
				if (data.nextProblem) {
					setCurrentProblem(data.nextProblem)
				}
				setProblemIndex(data.problemIndex)
				setTotalProblems(data.totalProblems)
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{ role: "tutor", content: "Connection error. Try again.", timestamp: new Date().toISOString() },
			])
		}
		setSending(false)
	}

	async function sendHint() {
		if (sending) return
		const hintMsg = isOscp ? "hint — I'm stuck, what command should I try?" : "I'm stuck, can you give me a hint?"
		setInput("")
		setSending(true)

		setMessages((prev) => [
			...prev,
			{ role: "student", content: hintMsg, timestamp: new Date().toISOString() },
		])

		try {
			const res = await fetch(`${API}/demo-sessions/${id}/message`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: hintMsg }),
			})
			const data = await res.json()
			if (!data.error) {
				setMessages(data.messages)
				if (data.nextProblem) {
					setCurrentProblem(data.nextProblem)
				}
				setProblemIndex(data.problemIndex)
				setTotalProblems(data.totalProblems)
			}
		} catch { /* ignore */ }
		setSending(false)
	}

	async function endSession() {
		await fetch(`${API}/demo-sessions/${id}/complete`, { method: "POST" })
		router.push(`/demo/handoff/${id}`)
	}

	function formatTime(s: number) {
		const m = Math.floor(s / 60)
		const sec = s % 60
		return `${m}:${sec.toString().padStart(2, "0")}`
	}

	if (loadError) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<p className="font-sans text-[#888] mb-4">{loadError}</p>
					<button type="button" onClick={() => router.push("/demo/classic")} className="font-sans text-sm text-[#4f9cf7] hover:underline">
						Start a new session
					</button>
				</div>
			</main>
		)
	}

	if (!session) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Loading session...</div>
			</main>
		)
	}

	const remainingMinutes = Math.max(0, 25 * 60 - elapsed)
	const isTimeWarning = remainingMinutes < 5 * 60
	const certLabel = isOscp ? "OSCP" : isClaude ? "Claude CCA" : "CISSP"

	return (
		<main className="h-dvh bg-[#0a0a0a] flex flex-col relative">
			{/* Solved banner */}
			{solvedBanner && (
				<div className="absolute top-0 left-0 right-0 z-50 animate-slide-down">
					<div className="bg-green-500/15 border-b border-green-500/30 px-4 py-3">
						<div className="max-w-[720px] mx-auto flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-green-400">
									<path d="M3.75 9L7.5 12.75L14.25 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-sans text-sm font-semibold text-green-400">
									{isOscp ? "Box owned!" : "Problem solved!"}
								</div>
								<div className="font-sans text-xs text-green-400/60 truncate">
									{solvedCount} of {totalProblems} completed — moving to next {isOscp ? "scenario" : "problem"}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<header className="shrink-0 border-b border-[#2a2a2a] px-4 py-2.5 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="font-sans text-xs font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
					<span className="text-[#333] font-sans text-[10px]">/</span>
					<span className="font-sans text-xs font-medium text-[#888]">Magister</span>
					<span className="w-px h-4 bg-[#2a2a2a]" />
					<span className="font-sans text-xs font-semibold px-2 py-0.5 rounded" style={{ color: accentColor, backgroundColor: accentColor + "15" }}>
						{certLabel}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<span className={`font-mono text-sm tabular-nums ${isTimeWarning ? "text-red-400" : "text-[#888]"}`}>
						{formatTime(remainingMinutes)}
					</span>
					<button
						type="button"
						onClick={endSession}
						className="font-sans text-xs font-medium px-3 py-1.5 rounded-md bg-[#141414] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#555] transition-colors"
					>
						End session
					</button>
				</div>
			</header>

			{/* Problem bar */}
			{currentProblem && (
				<div className="shrink-0 border-b px-4 py-3" style={{ borderColor: isOscp ? "#2a2a2a" : "#2a2a2a", backgroundColor: isOscp ? "#0c0808" : "#0d0d0d" }}>
					<div className="max-w-[720px] mx-auto flex items-start justify-between gap-4">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<span className="font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.06em]">
									{isOscp ? "Scenario" : "Problem"} {problemIndex + 1} of {totalProblems}
								</span>
								<span className={`font-sans text-[10px] px-1.5 py-0.5 rounded-full ${
									currentProblem.difficulty === "beginner" ? "bg-green-500/15 text-green-400" :
									currentProblem.difficulty === "intermediate" ? "bg-blue-500/15 text-blue-400" :
									"bg-amber-500/15 text-amber-400"
								}`}>
									{currentProblem.difficulty}
								</span>
							</div>
							{isOscp ? (
								<div className="font-mono text-[14px] text-[#ef4444]/90 leading-relaxed">{currentProblem.question}</div>
							) : (
								<RenderMath text={currentProblem.question} className="font-serif text-lg text-white" />
							)}
						</div>
						{/* Progress dots */}
						<div className="flex gap-1 pt-1">
							{Array.from({ length: totalProblems }).map((_, i) => (
								<div
									key={`dot-${i}`}
									className="w-2 h-2 rounded-full transition-colors duration-300"
									style={{
										backgroundColor: i < problemIndex ? "#22c55e" : i === problemIndex ? accentColor : "#2a2a2a",
									}}
								/>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Chat / Terminal area */}
			<div className="flex-1 overflow-y-auto px-4 py-6" style={isOscp ? { backgroundColor: "#080808" } : undefined}>
				<div className="max-w-[720px] mx-auto space-y-4">
					{isOscp ? (
						// Terminal-style UI for OSCP
						<>
							{messages.map((msg, i) => (
								<TerminalBlock key={`${msg.timestamp}-${i}`} msg={msg} />
							))}
						</>
					) : (
						// Standard chat UI for CISSP / Claude CCA
						<>
							{messages.map((msg, i) => (
								<ChatBubble key={`${msg.timestamp}-${i}`} msg={msg} accentColor={accentColor} />
							))}
						</>
					)}
					{sending && (
						isOscp ? (
							<div className="font-mono text-[13px] text-[#ef4444]/60 animate-pulse">
								[magister] analyzing...
							</div>
						) : (
							<div className="flex items-start gap-3">
								<div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: accentColor + "20" }}>
									<span className="font-mono text-xs font-bold" style={{ color: accentColor }}>M</span>
								</div>
								<div className="bg-[#141414] border border-[#2a2a2a] rounded-xl rounded-tl-sm px-4 py-3">
									<div className="flex gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "0ms" }} />
										<span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "150ms" }} />
										<span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "300ms" }} />
									</div>
								</div>
							</div>
						)
					)}
					<div ref={chatEndRef} />
				</div>
			</div>

			{/* Input */}
			<div className="shrink-0 border-t border-[#2a2a2a] px-4 py-3" style={isOscp ? { backgroundColor: "#080808" } : undefined}>
				<div className="max-w-[720px] mx-auto">
					<div className="flex gap-2">
						{isOscp ? (
							// Terminal-style input for OSCP
							<div className="flex-1 flex items-center bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 focus-within:border-[#ef4444]/50 transition-colors">
								<span className="font-mono text-sm text-[#ef4444] mr-2 shrink-0 select-none">$</span>
								<input
									ref={inputRef}
									type="text"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && sendMessage()}
									placeholder="type a command or ask for help..."
									disabled={sending}
									className="flex-1 bg-transparent text-[#22c55e] font-mono text-sm placeholder:text-[#333] focus:outline-none disabled:opacity-50"
								/>
							</div>
						) : (
							<input
								ref={inputRef}
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && sendMessage()}
								placeholder="Type your answer or ask for help..."
								disabled={sending}
								className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-sans text-[15px] placeholder:text-[#555] focus:outline-none transition-colors disabled:opacity-50"
							/>
						)}
						<button
							type="button"
							onClick={() => sendHint()}
							disabled={sending}
							className="px-3 py-3 rounded-xl font-sans text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#555]"
							style={{ color: accentColor }}
							title="Ask for a hint"
						>
							Hint
						</button>
						<button
							type="button"
							onClick={sendMessage}
							disabled={sending || !input.trim()}
							className="px-5 py-3 rounded-xl text-white font-sans text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
							style={{ backgroundColor: accentColor }}
						>
							{isOscp ? "Run" : "Send"}
						</button>
					</div>
					{isOscp && (
						<div className="flex gap-2 mt-2">
							{["nmap -sV", "gobuster dir", "searchsploit", "help"].map((cmd) => (
								<button
									key={cmd}
									type="button"
									onClick={() => setInput(cmd)}
									className="font-mono text-[11px] px-2 py-1 rounded bg-[#111] border border-[#1a1a1a] text-[#ef4444]/60 hover:text-[#ef4444] hover:border-[#ef4444]/30 transition-colors"
								>
									{cmd}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<style jsx>{`
				@keyframes slide-down {
					from { transform: translateY(-100%); opacity: 0; }
					to { transform: translateY(0); opacity: 1; }
				}
				.animate-slide-down {
					animation: slide-down 0.3s ease-out, slide-down 0.3s ease-in 3.5s reverse forwards;
				}
			`}</style>
		</main>
	)
}

/** Terminal-style message block for OSCP */
function TerminalBlock({ msg }: { msg: SessionMsg }) {
	const isTutor = msg.role === "tutor"

	if (!isTutor) {
		// Student input shown as command
		return (
			<div className="font-mono text-sm">
				<span className="text-[#ef4444]">$ </span>
				<span className="text-[#22c55e]">{msg.content}</span>
			</div>
		)
	}

	// Tutor response — render with code block detection
	return (
		<div className="mb-2">
			<div className="font-mono text-[13px] text-[#ef4444]/50 mb-1 select-none">[magister]</div>
			<div className="font-sans text-[14px] text-[#ccc] leading-relaxed whitespace-pre-wrap">
				<RenderTerminalContent text={msg.content} />
			</div>
			{msg.diagrams && msg.diagrams.length > 0 && (
				<div className="mt-3 space-y-3">
					{msg.diagrams.map((svg, i) => (
						<div
							key={`diagram-${i}`}
							className="bg-[#0a0a0a] rounded-lg p-3 border border-[#ef4444]/20"
							dangerouslySetInnerHTML={{ __html: svg }}
						/>
					))}
				</div>
			)}
			<div className="mt-2 border-b border-[#1a1a1a]" />
		</div>
	)
}

/** Renders tutor content with inline code and code blocks highlighted */
function RenderTerminalContent({ text }: { text: string }) {
	// Convert markdown-style code blocks and bold to HTML
	let html = text
	// Code blocks: ```...```
	html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) =>
		`<pre class="my-2 px-3 py-2 rounded bg-[#111] border border-[#1a1a1a] font-mono text-[13px] text-[#22c55e] overflow-x-auto">${code.trim()}</pre>`
	)
	// Inline code: `...`
	html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-[#111] text-[#22c55e] font-mono text-[13px]">$1</code>')
	// Bold
	html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
	// Newlines
	html = html.replace(/\n/g, "<br/>")

	return <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** Standard chat bubble for CISSP / Claude CCA */
function ChatBubble({ msg, accentColor }: { msg: SessionMsg; accentColor: string }) {
	const isTutor = msg.role === "tutor"

	return (
		<div className={`flex items-start gap-3 ${isTutor ? "" : "flex-row-reverse"}`}>
			<div
				className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
				style={{ backgroundColor: isTutor ? accentColor + "20" : "#2a2a2a" }}
			>
				<span className="font-mono text-xs font-bold" style={{ color: isTutor ? accentColor : "#888" }}>
					{isTutor ? "M" : "Y"}
				</span>
			</div>
			<div className={`max-w-[85%] ${isTutor ? "" : "text-right"}`}>
				<div
					className={`rounded-xl px-4 py-3 ${
						isTutor
							? "bg-[#141414] border border-[#2a2a2a] rounded-tl-sm"
							: "rounded-tr-sm"
					}`}
					style={!isTutor ? { backgroundColor: accentColor + "15", borderWidth: 1, borderStyle: "solid", borderColor: accentColor + "30" } : undefined}
				>
					<RenderMath
						text={msg.content}
						className={`font-sans text-[15px] leading-relaxed ${isTutor ? "text-[#e8e8e8]" : "text-white text-left"}`}
					/>
					{msg.diagrams && msg.diagrams.length > 0 && (
						<div className="mt-3 space-y-3">
							{msg.diagrams.map((svg, i) => (
								<div
									key={`diagram-${i}`}
									className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]"
									dangerouslySetInnerHTML={{ __html: svg }}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function RenderMath({ text, className }: { text: string; className?: string }) {
	const rendered = renderMathInText(text)
	return <div className={className} dangerouslySetInnerHTML={{ __html: rendered }} />
}

function renderMathInText(text: string): string {
	let result = text

	const currencySlots: string[] = []
	result = result.replace(/\$(\d[\d,]*(?:\.\d+)?(?:[KkMmBb])?(?:\/\w+)?)(?=\s|[.,;:!?)\]}-]|$)/g, (match) => {
		currencySlots.push(match)
		return `\x00CUR${currencySlots.length - 1}\x00`
	})

	// Code blocks
	result = result.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) =>
		`<pre class="my-2 px-3 py-2 rounded-lg bg-[#111] border border-[#1a1a1a] font-mono text-[13px] text-[#22c55e] overflow-x-auto whitespace-pre-wrap">${code.trim()}</pre>`
	)

	// Inline code
	result = result.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-[#111] text-[#22c55e] font-mono text-[13px]">$1</code>')

	result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')

	result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, tex) => {
		try {
			return `<div class="my-2">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })}</div>`
		} catch {
			return `<code>${tex}</code>`
		}
	})

	result = result.replace(/\$([^\$]+?)\$/g, (_match, tex) => {
		try {
			return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })
		} catch {
			return `<code>${tex}</code>`
		}
	})

	result = result.replace(/\x00CUR(\d+)\x00/g, (_, idx) => currencySlots[parseInt(idx)])

	result = result.replace(/\n/g, "<br/>")

	return result
}
