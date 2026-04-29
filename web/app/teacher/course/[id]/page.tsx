"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface Course {
	id: string
	name: string
	description: string
	createdAt: string
}

interface Material {
	id: string
	courseId: string
	title: string
	content: string
	createdAt: string
}

export default function CourseDetailPage() {
	const { id } = useParams<{ id: string }>()
	const [course, setCourse] = useState<Course | null>(null)
	const [materials, setMaterials] = useState<Material[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	const [showMaterialForm, setShowMaterialForm] = useState(false)
	const [materialMode, setMaterialMode] = useState<"text" | "file">("file")
	const [materialTitle, setMaterialTitle] = useState("")
	const [materialContent, setMaterialContent] = useState("")
	const [materialFile, setMaterialFile] = useState<File | null>(null)
	const [addingMaterial, setAddingMaterial] = useState(false)

	const [editingCourse, setEditingCourse] = useState(false)
	const [editName, setEditName] = useState("")
	const [editDescription, setEditDescription] = useState("")

	const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null)

	const fetchCourse = useCallback(async () => {
		try {
			const res = await fetch(`${API}/courses/${id}`)
			const data = await res.json()
			if (data.error) {
				setError(data.error)
				return
			}
			setCourse(data.course)
			setMaterials(data.materials)
			setEditName(data.course.name)
			setEditDescription(data.course.description)
		} catch {
			setError("Could not load course.")
		} finally {
			setLoading(false)
		}
	}, [id])

	useEffect(() => {
		fetchCourse()
	}, [fetchCourse])

	async function handleAddMaterial() {
		setAddingMaterial(true)
		setError("")

		try {
			let res: Response

			if (materialMode === "file" && materialFile) {
				const formData = new FormData()
				formData.append("file", materialFile)
				if (materialTitle.trim()) {
					formData.append("title", materialTitle.trim())
				}
				res = await fetch(`${API}/courses/${id}/materials/upload`, {
					method: "POST",
					body: formData,
				})
			} else {
				if (!materialTitle.trim() || !materialContent.trim()) {
					setAddingMaterial(false)
					return
				}
				res = await fetch(`${API}/courses/${id}/materials`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ title: materialTitle.trim(), content: materialContent.trim() }),
				})
			}

			const material = await res.json()
			if (material.error) {
				setError(material.error)
			} else {
				setMaterials((prev) => [...prev, material])
				setMaterialTitle("")
				setMaterialContent("")
				setMaterialFile(null)
				setShowMaterialForm(false)
			}
		} catch {
			setError("Failed to add material.")
		} finally {
			setAddingMaterial(false)
		}
	}

	async function handleDeleteMaterial(materialId: string) {
		try {
			await fetch(`${API}/courses/materials/${materialId}`, { method: "DELETE" })
			setMaterials((prev) => prev.filter((m) => m.id !== materialId))
		} catch {
			setError("Failed to delete material.")
		}
	}

	async function handleUpdateCourse() {
		try {
			const res = await fetch(`${API}/courses/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
			})
			const updated = await res.json()
			if (!updated.error) {
				setCourse(updated)
				setEditingCourse(false)
			}
		} catch {
			setError("Failed to update course.")
		}
	}

	if (loading) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Loading course...</div>
			</main>
		)
	}

	if (error && !course) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<p className="font-sans text-[#888] mb-4">{error}</p>
					<Link href="/teacher" className="font-sans text-sm text-[#4f9cf7] hover:underline">
						Back to courses
					</Link>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] px-4 py-10">
			<div className="w-full max-w-[640px] mx-auto">
				<Link href="/teacher" className="block mb-8">
					<div className="font-sans text-[13px] font-medium text-[#555] tracking-[0.06em] uppercase hover:text-[#888] transition-colors">
						&larr; Back to courses
					</div>
				</Link>

				{error && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{error}
					</div>
				)}

				{/* Course Header */}
				{editingCourse ? (
					<div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-8">
						<div className="mb-4">
							<label htmlFor="edit-name" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
								Course name
							</label>
							<input
								id="edit-name"
								type="text"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white font-sans text-[15px] focus:outline-none focus:border-[#4f9cf7] transition-colors"
							/>
						</div>
						<div className="mb-4">
							<label htmlFor="edit-desc" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
								Description
							</label>
							<textarea
								id="edit-desc"
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
								rows={3}
								className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white font-sans text-[15px] focus:outline-none focus:border-[#4f9cf7] transition-colors resize-none"
							/>
						</div>
						<div className="flex gap-2">
							<button type="button" onClick={handleUpdateCourse} className="px-4 py-2.5 rounded-lg bg-[#4f9cf7] text-white font-sans text-sm font-semibold hover:bg-[#3d8be5] transition-colors">
								Save
							</button>
							<button type="button" onClick={() => setEditingCourse(false)} className="px-4 py-2.5 rounded-lg bg-[#1a1a1a] text-[#888] font-sans text-sm font-medium hover:text-white transition-colors">
								Cancel
							</button>
						</div>
					</div>
				) : (
					<div className="mb-8">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h1 className="font-serif text-[28px] font-bold text-white leading-[1.2] tracking-[-0.02em] mb-1">
									{course?.name}
								</h1>
								{course?.description && (
									<p className="font-sans text-[15px] text-[#888]">{course.description}</p>
								)}
							</div>
							<button
								type="button"
								onClick={() => setEditingCourse(true)}
								className="shrink-0 font-sans text-xs text-[#555] hover:text-[#888] transition-colors px-2 py-1"
							>
								Edit
							</button>
						</div>
					</div>
				)}

				{/* Materials Section */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-sans text-sm font-semibold text-[#888] uppercase tracking-[0.06em]">
						Materials ({materials.length})
					</h2>
					<button
						type="button"
						onClick={() => setShowMaterialForm(!showMaterialForm)}
						className="font-sans text-sm text-[#4f9cf7] hover:text-[#3d8be5] transition-colors font-medium"
					>
						{showMaterialForm ? "Cancel" : "+ Add material"}
					</button>
				</div>

				{showMaterialForm && (
					<div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-4">
						{/* Mode toggle */}
						<div className="flex gap-1 mb-4 bg-[#0a0a0a] rounded-lg p-1">
							<button
								type="button"
								onClick={() => setMaterialMode("file")}
								className={`flex-1 py-2 rounded-md font-sans text-sm font-medium transition-all ${
									materialMode === "file"
										? "bg-[#2a2a2a] text-white"
										: "text-[#555] hover:text-[#888]"
								}`}
							>
								Upload file
							</button>
							<button
								type="button"
								onClick={() => setMaterialMode("text")}
								className={`flex-1 py-2 rounded-md font-sans text-sm font-medium transition-all ${
									materialMode === "text"
										? "bg-[#2a2a2a] text-white"
										: "text-[#555] hover:text-[#888]"
								}`}
							>
								Paste text
							</button>
						</div>

						<div className="mb-4">
							<label htmlFor="mat-title" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
								Title {materialMode === "file" && <span className="normal-case font-normal">(optional — uses filename if empty)</span>}
							</label>
							<input
								id="mat-title"
								type="text"
								value={materialTitle}
								onChange={(e) => setMaterialTitle(e.target.value)}
								placeholder="e.g. Chapter 3: Vector Spaces"
								className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white font-sans text-[15px] placeholder:text-[#555] focus:outline-none focus:border-[#4f9cf7] transition-colors"
							/>
						</div>

						{materialMode === "file" ? (
							<div className="mb-4">
								<label htmlFor="mat-file" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
									File
								</label>
								<label
									htmlFor="mat-file"
									className={`flex flex-col items-center justify-center w-full h-32 bg-[#0a0a0a] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
										materialFile ? "border-[#4f9cf7]/40 bg-[#4f9cf7]/5" : "border-[#2a2a2a] hover:border-[#555]"
									}`}
								>
									{materialFile ? (
										<div className="text-center">
											<p className="font-sans text-sm text-white font-medium">{materialFile.name}</p>
											<p className="font-sans text-xs text-[#555] mt-1">
												{(materialFile.size / 1024).toFixed(0)} KB
											</p>
										</div>
									) : (
										<div className="text-center">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-[#555]">
												<path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 3V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
											<p className="font-sans text-sm text-[#555]">
												Drop a file or click to browse
											</p>
											<p className="font-sans text-xs text-[#444] mt-1">
												PDF, TXT, MD, or other text files
											</p>
										</div>
									)}
									<input
										id="mat-file"
										type="file"
										className="hidden"
										accept=".pdf,.txt,.md,.csv,.doc,.docx"
										onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
									/>
								</label>
							</div>
						) : (
							<div className="mb-4">
								<label htmlFor="mat-content" className="block font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
									Content
								</label>
								<textarea
									id="mat-content"
									value={materialContent}
									onChange={(e) => setMaterialContent(e.target.value)}
									placeholder="Paste lecture notes, textbook excerpts, or any learning material..."
									rows={10}
									className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white font-sans text-[15px] placeholder:text-[#555] focus:outline-none focus:border-[#4f9cf7] transition-colors resize-y font-mono text-sm leading-relaxed"
								/>
							</div>
						)}

						<button
							type="button"
							onClick={handleAddMaterial}
							disabled={
								addingMaterial ||
								(materialMode === "file" ? !materialFile : !materialTitle.trim() || !materialContent.trim())
							}
							className="w-full py-3 rounded-xl bg-[#4f9cf7] text-white font-sans text-sm font-semibold hover:bg-[#3d8be5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{addingMaterial ? "Processing..." : materialMode === "file" ? "Upload & extract text" : "Add material"}
						</button>
					</div>
				)}

				{materials.length === 0 ? (
					<div className="text-center py-12 bg-[#141414] border border-[#2a2a2a] rounded-xl">
						<div className="font-sans text-[#555] text-sm mb-1">No materials yet</div>
						<div className="font-sans text-[#444] text-xs">
							Add course materials so the tutor can help students study them.
						</div>
					</div>
				) : (
					<div className="space-y-2">
						{materials.map((material) => (
							<div
								key={material.id}
								className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden"
							>
								<button
									type="button"
									onClick={() => setExpandedMaterial(expandedMaterial === material.id ? null : material.id)}
									className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#1a1a1a] transition-colors"
								>
									<div className="flex-1 min-w-0">
										<h3 className="font-sans text-sm font-semibold text-white truncate">
											{material.title}
										</h3>
										<p className="font-sans text-xs text-[#555] mt-0.5">
											{material.content.length.toLocaleString()} characters
										</p>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation()
												handleDeleteMaterial(material.id)
											}}
											className="font-sans text-xs text-[#555] hover:text-red-400 transition-colors px-2 py-1"
										>
											Delete
										</button>
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill="none"
											className={`text-[#555] transition-transform ${expandedMaterial === material.id ? "rotate-180" : ""}`}
										>
											<path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</div>
								</button>
								{expandedMaterial === material.id && (
									<div className="px-5 pb-4 border-t border-[#2a2a2a]">
										<pre className="font-mono text-xs text-[#888] leading-relaxed whitespace-pre-wrap mt-3 max-h-[400px] overflow-y-auto">
											{material.content}
										</pre>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Share Link */}
				{materials.length > 0 && (
					<div className="mt-8 p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl">
						<div className="font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.06em] mb-2">
							Student link
						</div>
						<div className="font-mono text-sm text-[#4f9cf7] break-all">
							{typeof window !== "undefined" ? `${window.location.origin}/course/${id}` : `/course/${id}`}
						</div>
						<p className="font-sans text-xs text-[#555] mt-1">
							Share this link with students to start a tutoring session.
						</p>
					</div>
				)}
			</div>
		</main>
	)
}
