"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface Course {
	id: string
	name: string
	description: string
}

export default function DemoPage() {
	const [courses, setCourses] = useState<Course[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	const fetchCourses = useCallback(async () => {
		try {
			const res = await fetch(`${API}/courses`)
			const data = await res.json()
			setCourses(data)
		} catch {
			setError("Could not connect to the server. Make sure the API is running.")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchCourses()
	}, [fetchCourses])

	return (
		<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-[520px]">
				<Link href="/" className="block mb-10">
					<div className="font-sans text-[13px] font-medium text-[#555] tracking-[0.06em] uppercase">
						Magister
					</div>
				</Link>

				<h1 className="font-serif text-[32px] font-bold text-white leading-[1.2] tracking-[-0.02em] mb-2">
					Available Courses
				</h1>
				<p className="font-sans text-[15px] text-[#888] mb-8">
					Select a course to start a tutoring session. Your tutor will help you understand the course materials through explanation and guided questioning.
				</p>

				{error && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{error}
					</div>
				)}

				{loading ? (
					<div className="font-sans text-[#555] animate-pulse text-center py-12">Loading courses...</div>
				) : courses.length === 0 ? (
					<div className="text-center py-12">
						<div className="font-sans text-[#555] text-sm mb-2">No courses available yet</div>
						<div className="font-sans text-[#444] text-xs mb-6">
							A teacher needs to create a course first.
						</div>
						<Link
							href="/teacher"
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4f9cf7] text-white font-sans text-sm font-semibold hover:bg-[#3d8be5] transition-colors no-underline"
						>
							Create a course
						</Link>
					</div>
				) : (
					<div className="space-y-3">
						{courses.map((course) => (
							<Link
								key={course.id}
								href={`/course/${course.id}`}
								className="block bg-[#141414] border border-[#2a2a2a] rounded-xl px-5 py-4 hover:border-[#4f9cf7]/40 hover:bg-[#4f9cf7]/5 transition-all no-underline group"
							>
								<h3 className="font-sans text-[15px] font-semibold text-white mb-1 group-hover:text-[#4f9cf7] transition-colors">
									{course.name}
								</h3>
								{course.description && (
									<p className="font-sans text-sm text-[#888] line-clamp-2">
										{course.description}
									</p>
								)}
							</Link>
						))}
					</div>
				)}

				<div className="mt-8 pt-6 border-t border-[#2a2a2a] flex justify-between">
					<Link href="/teacher" className="font-sans text-sm text-[#555] hover:text-[#888] transition-colors no-underline">
						Teacher dashboard
					</Link>
					<Link href="/demo/classic" className="font-sans text-sm text-[#555] hover:text-[#888] transition-colors no-underline">
						Try Socratic tutor demo
					</Link>
				</div>
			</div>
		</main>
	)
}
