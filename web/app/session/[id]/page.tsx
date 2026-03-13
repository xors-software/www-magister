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

interface SessionInfo {
	id: string
	courseId: string
	studentName: string
	status: string
	startedAt: string
}

interface CourseInfo {
	id: string
	name: string
}

export default function SessionPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const [session, setSession] = useState<SessionInfo | null>(null)
	const [course, setCourse] = useState<CourseInfo | null>(null)
	const [messages, setMessages] = useState<SessionMsg[]>([])
	const [input, setInput] = useState("")
	const [sending, setSending] = useState(false)
	const [elapsed, setElapsed] = useState(0)
	const [loadError, setLoadError] = useState("")
	const chatEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const fetchSession = useCallback(async () => {
		try {
			const res = await fetch(`${API}/sessions/${id}`)
			const data = await res.json()
			if (data.error) {
				setLoadError(data.error)
				return
			}
			setSession(data.session)
			setCourse(data.course)
			setMessages(data.messages || [])
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
			const res = await fetch(`${API}/sessions/${id}/message`, {
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
		} catch {
			setMessages((prev) => [
				...prev,
				{ role: "tutor", content: "Connection error. Try again.", timestamp: new Date().toISOString() },
			])
		}
		setSending(false)
	}

	async function endSession() {
		await fetch(`${API}/sessions/${id}/complete`, { method: "POST" })
		if (course) {
			router.push(`/course/${course.id}`)
		} else {
			router.push("/")
		}
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
					<button type="button" onClick={() => router.push("/")} className="font-sans text-sm text-[#4f9cf7] hover:underline">
						Go home
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

	return (
		<main className="h-dvh bg-[#0a0a0a] flex flex-col">
			{/* Header */}
			<header className="shrink-0 border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="font-sans text-xs font-semibold text-[#4f9cf7] tracking-[0.06em] uppercase">Magister</span>
					<span className="w-px h-4 bg-[#2a2a2a]" />
					{course && (
						<>
							<span className="font-sans text-sm text-[#888]">{course.name}</span>
							<span className="w-px h-4 bg-[#2a2a2a]" />
						</>
					)}
					<span className="font-sans text-sm text-[#888]">{session.studentName}</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="font-mono text-sm tabular-nums text-[#888]">
						{formatTime(elapsed)}
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

			{/* Chat area */}
			<div className="flex-1 overflow-y-auto px-4 py-6">
				<div className="max-w-[720px] mx-auto space-y-4">
					{messages.map((msg, i) => (
						<ChatBubble key={`${msg.timestamp}-${i}`} msg={msg} studentName={session.studentName} />
					))}
					{sending && (
						<div className="flex items-start gap-3">
							<div className="w-7 h-7 rounded-full bg-[#4f9cf7]/20 flex items-center justify-center shrink-0">
								<span className="font-mono text-xs text-[#4f9cf7] font-bold">M</span>
							</div>
							<div className="bg-[#141414] border border-[#2a2a2a] rounded-xl rounded-tl-sm px-4 py-3">
								<div className="flex gap-1">
									<span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "0ms" }} />
									<span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "150ms" }} />
									<span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "300ms" }} />
								</div>
							</div>
						</div>
					)}
					<div ref={chatEndRef} />
				</div>
			</div>

			{/* Input */}
			<div className="shrink-0 border-t border-[#2a2a2a] px-4 py-3">
				<div className="max-w-[720px] mx-auto flex gap-2">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && sendMessage()}
						placeholder="Ask a question or share your answer..."
						disabled={sending || session.status !== "active"}
						className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-sans text-[15px] placeholder:text-[#555] focus:outline-none focus:border-[#4f9cf7] transition-colors disabled:opacity-50"
					/>
					<button
						type="button"
						onClick={sendMessage}
						disabled={sending || !input.trim()}
						className="px-5 py-3 rounded-xl bg-[#4f9cf7] text-white font-sans text-sm font-semibold hover:bg-[#3d8be5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					>
						Send
					</button>
				</div>
			</div>
		</main>
	)
}

function ChatBubble({ msg, studentName }: { msg: SessionMsg; studentName: string }) {
	const isTutor = msg.role === "tutor"

	return (
		<div className={`flex items-start gap-3 ${isTutor ? "" : "flex-row-reverse"}`}>
			<div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
				isTutor ? "bg-[#4f9cf7]/20" : "bg-[#2a2a2a]"
			}`}>
				<span className={`font-mono text-xs font-bold ${isTutor ? "text-[#4f9cf7]" : "text-[#888]"}`}>
					{isTutor ? "M" : studentName[0]?.toUpperCase()}
				</span>
			</div>
			<div className={`max-w-[85%] ${isTutor ? "" : "text-right"}`}>
				<div className={`rounded-xl px-4 py-3 ${
					isTutor
						? "bg-[#141414] border border-[#2a2a2a] rounded-tl-sm"
						: "bg-[#4f9cf7]/15 border border-[#4f9cf7]/20 rounded-tr-sm"
				}`}>
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
	result = result.replace(/\$(\d[\d,]*(?:\.\d+)?(?:[KkMmBb])?(?:\/\w+)?)/g, (match) => {
		currencySlots.push(match)
		return `\x00CUR${currencySlots.length - 1}\x00`
	})

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
