"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, fetchMe, logout, type User } from "@/lib/auth";

type Topic = { id: string; label: string; tagline: string; questionCount: number };

export default function FundamentalsQuizLauncher() {
	const router = useRouter();
	const [me, setMe] = useState<User | null>(null);
	const [authChecked, setAuthChecked] = useState(false);
	const [mode, setMode] = useState<"quick" | "topic" | "mock">("quick");
	const [topics, setTopics] = useState<Topic[]>([]);
	const [topic, setTopic] = useState<string>("ai-fundamentals");
	const [count, setCount] = useState(10);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchMe().then((user) => {
			if (!user) {
				router.push("/login?next=/ai-fundamentals/quiz");
				return;
			}
			setMe(user);
			setAuthChecked(true);
		});
	}, [router]);

	useEffect(() => {
		if (!authChecked) return;
		apiFetch("/fundamentals/topics")
			.then((r) => r.json())
			.then((data: Topic[]) => {
				setTopics(data);
				const firstWith = data.find((t) => t.questionCount > 0);
				if (firstWith) setTopic(firstWith.id);
			})
			.catch(() => {});
	}, [authChecked]);

	async function startQuiz() {
		setLoading(true);
		setError("");
		try {
			const body: Record<string, unknown> = { mode, count };
			if (mode === "mock") body.count = 30;
			if (mode === "topic") body.topic = topic;
			const res = await apiFetch("/fundamentals/quiz", {
				method: "POST",
				body: JSON.stringify(body),
			});
			const data = await res.json();
			if (data.error) {
				setError(data.error);
				setLoading(false);
				return;
			}
			router.push(`/ai-fundamentals/quiz/${data.id}`);
		} catch {
			setError("Couldn't reach the server. Refresh and try again.");
			setLoading(false);
		}
	}

	async function handleLogout() {
		await logout();
		router.push("/login");
	}

	const modes: { id: typeof mode; label: string; sub: string; recommendedCount?: number }[] = [
		{ id: "quick", label: "Quick Quiz", sub: "10 random questions across seeded topics. Warm-up.", recommendedCount: 10 },
		{ id: "topic", label: "Topic Drill", sub: "Drill one cheatsheet at a time.", recommendedCount: 10 },
		{ id: "mock", label: "Mock Mix", sub: "30 questions, even split across all seeded topics." },
	];

	if (!authChecked) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Checking session…</div>
			</main>
		);
	}

	const seededTopics = topics.filter((t) => t.questionCount > 0);
	const comingSoonTopics = topics.filter((t) => t.questionCount === 0);

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-[640px]">
				<div className="flex items-center justify-between mb-8">
					<Link href="/ai-fundamentals" className="block">
						<div className="flex items-center gap-2">
							<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
							<span className="text-[#333] font-sans text-xs">/</span>
							<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">AI Fundamentals</span>
						</div>
					</Link>
					{me && (
						<div className="flex items-center gap-3">
							<span className="font-sans text-[12px] text-[#666]">{me.displayName || me.email}</span>
							<button type="button" onClick={handleLogout} className="font-sans text-[12px] text-[#555] hover:text-white">Sign out</button>
						</div>
					)}
				</div>

				<h1 className="font-serif text-[32px] font-bold text-white leading-[1.2] tracking-[-0.02em] mb-2">
					Drill the basics
				</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8">
					Calibrated to the Lazer × Deloitte AI Fundamentals curriculum. Quick to warm up, topic drills to focus, mock mix to stress-test.
				</p>

				<div className="grid sm:grid-cols-3 gap-2.5 mb-6">
					{modes.map((m) => {
						const active = mode === m.id;
						return (
							<button
								key={m.id}
								type="button"
								onClick={() => {
									setMode(m.id);
									if (m.recommendedCount) setCount(m.recommendedCount);
								}}
								className="text-left rounded-xl px-4 py-3.5 transition-all border"
								style={{
									backgroundColor: active ? "#ec489915" : "#111",
									borderColor: active ? "#ec489955" : "#1a1a1a",
								}}
							>
								<div className={`font-sans text-[14px] font-semibold ${active ? "text-white" : "text-[#ccc]"}`}>{m.label}</div>
								<div className="font-sans text-[12px] text-[#666] mt-1 leading-snug">{m.sub}</div>
							</button>
						);
					})}
				</div>

				{mode === "topic" && (
					<div className="mb-6">
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-2">
							Topic
						</label>
						<div className="grid gap-1.5">
							{seededTopics.map((t) => {
								const active = topic === t.id;
								return (
									<button
										key={t.id}
										type="button"
										onClick={() => setTopic(t.id)}
										className="text-left px-3.5 py-2.5 rounded-lg flex items-center gap-3 border"
										style={{
											backgroundColor: active ? "#ec489915" : "#111",
											borderColor: active ? "#ec489950" : "#1a1a1a",
										}}
									>
										<span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#ec4899" }} />
										<div className="flex-1 min-w-0">
											<div className={`font-sans text-[13px] font-medium ${active ? "text-white" : "text-[#ccc]"}`}>{t.label}</div>
											<div className="font-sans text-[11px] text-[#555] truncate">{t.tagline}</div>
										</div>
										<span className="font-mono text-[11px] text-[#555]">{t.questionCount}</span>
									</button>
								);
							})}
							{comingSoonTopics.length > 0 && (
								<>
									<div className="mt-2 font-sans text-[10px] uppercase tracking-[0.08em] text-[#444]">Coming soon</div>
									{comingSoonTopics.map((t) => (
										<div
											key={t.id}
											className="px-3.5 py-2.5 rounded-lg flex items-center gap-3 border border-[#1a1a1a] bg-[#0a0a0a] opacity-60"
										>
											<span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#333]" />
											<div className="flex-1 min-w-0">
												<div className="font-sans text-[13px] text-[#666]">{t.label}</div>
												<div className="font-sans text-[11px] text-[#444] truncate">{t.tagline}</div>
											</div>
										</div>
									))}
								</>
							)}
						</div>
					</div>
				)}

				{mode !== "mock" && (
					<div className="mb-6">
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-2">
							Question count
						</label>
						<div className="flex gap-2">
							{[5, 10, 15].map((n) => (
								<button
									key={n}
									type="button"
									onClick={() => setCount(n)}
									className="flex-1 py-2.5 rounded-lg font-sans text-sm font-semibold transition-all border"
									style={{
										backgroundColor: count === n ? "#ec4899" : "#111",
										color: count === n ? "white" : "#ccc",
										borderColor: count === n ? "#ec4899" : "#1a1a1a",
									}}
								>
									{n}
								</button>
							))}
						</div>
					</div>
				)}

				{error && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{error}
					</div>
				)}

				<button
					type="button"
					onClick={startQuiz}
					disabled={loading}
					className="w-full py-3.5 rounded-xl bg-[#ec4899] text-white font-sans text-[15px] font-bold transition-colors hover:bg-[#db2777] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Starting…" : mode === "mock" ? "Start mock mix (30 Q)" : `Start ${count}-question drill`}
				</button>

				<div className="mt-6 text-center">
					<Link href="/ai-fundamentals/dashboard" className="font-sans text-[13px] text-[#888] hover:text-white">
						Or check your dashboard →
					</Link>
				</div>
			</div>
		</main>
	);
}
