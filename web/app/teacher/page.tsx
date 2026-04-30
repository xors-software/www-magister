"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface Course {
	id: string
	name: string
	description: string
	createdAt: string
}

export default function TeacherPage() {
	const [courses, setCourses] = useState<Course[]>([])
	const [loading, setLoading] = useState(true)
	const [showForm, setShowForm] = useState(false)
	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [creating, setCreating] = useState(false)
	const [error, setError] = useState("")

	const fetchCourses = useCallback(async () => {
		try {
			const res = await fetch(`${API}/courses`)
			const data = await res.json()
			setCourses(data)
		} catch {
			setError("Could not connect to the server.")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchCourses()
	}, [fetchCourses])

	async function handleCreate() {
		if (!name.trim()) return
		setCreating(true)
		setError("")

		try {
			const res = await fetch(`${API}/courses`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), description: description.trim() }),
			})
			const course = await res.json()
			setCourses((prev) => [course, ...prev])
			setName("")
			setDescription("")
			setShowForm(false)
		} catch {
			setError("Failed to create course.")
		} finally {
			setCreating(false)
		}
	}

	async function handleDelete(courseId: string) {
		try {
			await fetch(`${API}/courses/${courseId}`, { method: "DELETE" })
			setCourses((prev) => prev.filter((c) => c.id !== courseId))
		} catch {
			setError("Failed to delete course.")
		}
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] px-4 py-10">
			<div className="w-full max-w-[640px] mx-auto">
				<Link href="/" className="block mb-10">
					<div className="font-sans text-[13px] font-medium text-[#555] tracking-[0.06em] uppercase">
						Reps
					</div>
				</Link>

				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="font-serif text-[32px] font-bold text-white leading-[1.2] tracking-[-0.02em]">
							Your Courses
						</h1>
						<p className="font-sans text-[15px] text-[#888] mt-1">
							Create courses and upload materials for students to study.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowForm(!showForm)}
						className="shrink-0 px-4 py-2.5 rounded-xl bg-[#4f9cf7] text-white font-sans text-sm font-semibold hover:bg-[#3d8be5] transition-colors"
					>
						{showForm ? "Cancel" : "New course"}
					</button>
				</div>

				{showForm && (
					<div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-6">
						<div className="mb-4">
							<label htmlFor="course-name" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
								Course name
							</label>
							<input
								id="course-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Introduction to Linear Algebra"
								className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white font-sans text-[15px] placeholder:text-[#555] focus:outline-none focus:border-[#4f9cf7] transition-colors"
								onKeyDown={(e) => e.key === "Enter" && handleCreate()}
							/>
						</div>
						<div className="mb-4">
							<label htmlFor="course-desc" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
								Description (optional)
							</label>
							<textarea
								id="course-desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="What will students learn in this course?"
								rows={3}
								className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white font-sans text-[15px] placeholder:text-[#555] focus:outline-none focus:border-[#4f9cf7] transition-colors resize-none"
							/>
						</div>
						<button
							type="button"
							onClick={handleCreate}
							disabled={creating || !name.trim()}
							className="w-full py-3 rounded-xl bg-[#4f9cf7] text-white font-sans text-sm font-semibold hover:bg-[#3d8be5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{creating ? "Creating..." : "Create course"}
						</button>
					</div>
				)}

				{error && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{error}
					</div>
				)}

				{loading ? (
					<div className="font-sans text-[#555] animate-pulse text-center py-12">Loading courses...</div>
				) : courses.length === 0 ? (
					<div className="text-center py-16">
						<div className="font-sans text-[#555] text-sm mb-2">No courses yet</div>
						<div className="font-sans text-[#444] text-xs">
							Create your first course to get started.
						</div>
					</div>
				) : (
					<div className="space-y-3">
						{courses.map((course) => (
							<div
								key={course.id}
								className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-5 py-4 hover:border-[#3a3a3a] transition-colors group"
							>
								<div className="flex items-start justify-between gap-4">
									<Link
										href={`/teacher/course/${course.id}`}
										className="flex-1 min-w-0 no-underline"
									>
										<h3 className="font-sans text-[15px] font-semibold text-white mb-1 group-hover:text-[#4f9cf7] transition-colors">
											{course.name}
										</h3>
										{course.description && (
											<p className="font-sans text-sm text-[#888] line-clamp-2">
												{course.description}
											</p>
										)}
										<p className="font-sans text-xs text-[#555] mt-2">
											Created {new Date(course.createdAt).toLocaleDateString()}
										</p>
									</Link>
									<button
										type="button"
										onClick={() => handleDelete(course.id)}
										className="shrink-0 font-sans text-xs text-[#555] hover:text-red-400 transition-colors px-2 py-1"
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
