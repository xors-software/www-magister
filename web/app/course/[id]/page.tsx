"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface CourseInfo {
	id: string
	name: string
	description: string
}

export default function CourseJoinPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const [course, setCourse] = useState<CourseInfo | null>(null)
	const [materialCount, setMaterialCount] = useState(0)
	const [loading, setLoading] = useState(true)
	const [name, setName] = useState("")
	const [starting, setStarting] = useState(false)
	const [error, setError] = useState("")

	const fetchCourse = useCallback(async () => {
		try {
			const res = await fetch(`${API}/courses/${id}`)
			const data = await res.json()
			if (data.error) {
				setError(data.error)
				return
			}
			setCourse(data.course)
			setMaterialCount(data.materials?.length || 0)
		} catch {
			setError("Could not load course.")
		} finally {
			setLoading(false)
		}
	}, [id])

	useEffect(() => {
		fetchCourse()
	}, [fetchCourse])

	async function startSession() {
		if (!name.trim()) {
			setError("Enter your name to get started.")
			return
		}
		setStarting(true)
		setError("")

		try {
			const res = await fetch(`${API}/sessions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					courseId: id,
					studentName: name.trim(),
				}),
			})
			const data = await res.json()
			if (data.error) {
				setError(data.error)
				setStarting(false)
				return
			}
			router.push(`/session/${data.session.id}`)
		} catch {
			setError("Could not start session. Make sure the server is running.")
			setStarting(false)
		}
	}

	if (loading) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Loading course...</div>
			</main>
		)
	}

	if (!course) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<p className="font-sans text-[#888] mb-4">{error || "Course not found"}</p>
					<Link href="/" className="font-sans text-sm text-[#4f9cf7] hover:underline">
						Go home
					</Link>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-[480px]">
				<Link href="/" className="block mb-10">
					<div className="font-sans text-[13px] font-medium text-[#555] tracking-[0.06em] uppercase">
						Magister
					</div>
				</Link>

				<div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 mb-6">
					<div className="font-sans text-xs font-semibold text-[#4f9cf7] uppercase tracking-[0.06em] mb-2">
						Course
					</div>
					<h1 className="font-serif text-[24px] font-bold text-white leading-[1.2] tracking-[-0.02em] mb-1">
						{course.name}
					</h1>
					{course.description && (
						<p className="font-sans text-sm text-[#888] mt-2">
							{course.description}
						</p>
					)}
					<p className="font-sans text-xs text-[#555] mt-3">
						{materialCount} {materialCount === 1 ? "material" : "materials"} uploaded
					</p>
				</div>

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

				{error && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{error}
					</div>
				)}

				<button
					type="button"
					onClick={startSession}
					disabled={starting || materialCount === 0}
					className="w-full py-3.5 rounded-xl bg-[#4f9cf7] text-white font-sans text-[15px] font-semibold hover:bg-[#3d8be5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{starting ? "Starting session..." : "Start tutoring session"}
				</button>

				{materialCount === 0 && (
					<p className="mt-3 font-sans text-xs text-amber-400 text-center">
						This course has no materials yet. The teacher needs to upload materials first.
					</p>
				)}
			</div>
		</main>
	)
}
