"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Choice = { key: "A" | "B" | "C" | "D"; text: string };
type PublicQuestion = {
	id: string;
	scenario: string;
	scenarioLabel: string;
	domain: string;
	domainLabel: string;
	tasks: string[];
	mode: string;
	difficulty: string;
	stem: string;
	choices: Choice[];
};
type Reveal = PublicQuestion & {
	correct: "A" | "B" | "C" | "D";
	explanation: string;
	distractorRationales: Partial<Record<"A" | "B" | "C" | "D", string>>;
	studyTags: string[];
	isCorrect: boolean;
};

const SCENARIO_ACCENT: Record<string, string> = {
	"customer-support": "#4f9cf7",
	"code-generation": "#22c55e",
	"multi-agent-research": "#a855f7",
	"developer-productivity": "#f59e0b",
	"ci-cd": "#ef4444",
	"structured-extraction": "#06b6d4",
};

export default function QuizRunner() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const quizId = params.id;

	const [question, setQuestion] = useState<PublicQuestion | null>(null);
	const [reveal, setReveal] = useState<Reveal | null>(null);
	const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [totalQuestions, setTotalQuestions] = useState(0);
	const [config, setConfig] = useState<{ mode: string } | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);
	const [timeLimitSec, setTimeLimitSec] = useState<number | null>(null);
	const [startedAt, setStartedAt] = useState<string | null>(null);
	const [error, setError] = useState("");
	// Cached upcoming question — answer endpoint already returns it,
	// no need to round-trip again on Next.
	const [nextQuestion, setNextQuestion] = useState<PublicQuestion | null>(null);
	const startTimeRef = useRef<number>(Date.now());

	useEffect(() => {
		fetch(`${API}/cert/quiz/${quizId}`)
			.then((r) => r.json())
			.then((data) => {
				if (data.error) {
					setError(data.error);
					return;
				}
				setQuestion(data.question);
				setCurrentIndex(data.currentIndex);
				setTotalQuestions(data.totalQuestions);
				setConfig(data.config);
				setTimeLimitSec(data.timeLimitSeconds || null);
				setStartedAt(data.startedAt);
			})
			.catch(() => setError("Could not load quiz."));
	}, [quizId]);

	useEffect(() => {
		if (!timeLimitSec || !startedAt) return;
		const startMs = new Date(startedAt).getTime();
		const tick = () => {
			const elapsed = Math.floor((Date.now() - startMs) / 1000);
			setTimeLeftSec(Math.max(0, timeLimitSec - elapsed));
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [timeLimitSec, startedAt]);

	useEffect(() => {
		startTimeRef.current = Date.now();
	}, [question?.id]);

	// Keyboard shortcuts: 1-4 (or A/B/C/D) pick a choice; Enter submits or advances.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			const numToKey: Record<string, "A" | "B" | "C" | "D"> = { "1": "A", "2": "B", "3": "C", "4": "D" };
			const letter = e.key.toUpperCase();
			const choice = numToKey[e.key] ?? (["A", "B", "C", "D"].includes(letter) ? (letter as "A" | "B" | "C" | "D") : null);
			if (choice && !reveal) {
				setSelected(choice);
				e.preventDefault();
				return;
			}
			if (e.key === "Enter") {
				if (!reveal && selected && !submitting) {
					submitAnswer();
					e.preventDefault();
				} else if (reveal) {
					if (currentIndex >= totalQuestions - 1) finish();
					else next();
					e.preventDefault();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reveal, selected, submitting, currentIndex, totalQuestions, nextQuestion]);

	async function submitAnswer() {
		if (!selected || submitting || reveal) return;
		setSubmitting(true);
		try {
			const timeMs = Date.now() - startTimeRef.current;
			const res = await fetch(`${API}/cert/quiz/${quizId}/answer`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ selected, timeMs }),
			});
			const data = await res.json();
			setReveal(data.reveal);
			setNextQuestion(data.nextQuestion ?? null);
		} catch {
			setError("Failed to submit answer.");
		} finally {
			setSubmitting(false);
		}
	}

	function next() {
		if (!reveal || !nextQuestion) return;
		setQuestion(nextQuestion);
		setCurrentIndex((idx) => idx + 1);
		setReveal(null);
		setSelected(null);
		setNextQuestion(null);
	}

	async function finish() {
		const res = await fetch(`${API}/cert/quiz/${quizId}/complete`, { method: "POST" });
		await res.json();
		router.push(`/quiz/${quizId}/results`);
	}

	const isLast = currentIndex >= totalQuestions - 1;
	const progress = useMemo(() => (totalQuestions ? ((currentIndex + 1) / totalQuestions) * 100 : 0), [currentIndex, totalQuestions]);
	const accent = question ? SCENARIO_ACCENT[question.scenario] || "#F5B800" : "#F5B800";

	if (error) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4">
				<div className="max-w-md text-center">
					<div className="font-serif text-[24px] text-white mb-2">Couldn't load this quiz</div>
					<div className="font-sans text-[14px] text-[#888] mb-6">{error}</div>
					<Link href="/quiz" className="font-sans text-[13px] text-[#F5B800] hover:underline">Back to launcher →</Link>
				</div>
			</main>
		);
	}

	if (!question) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Loading…</div>
			</main>
		);
	}

	const timeStr = timeLeftSec !== null ? `${Math.floor(timeLeftSec / 60)}:${String(timeLeftSec % 60).padStart(2, "0")}` : null;
	const timeWarning = timeLeftSec !== null && timeLeftSec < 300;

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8]">
			<div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[760px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</Link>
					<div className="flex items-center gap-4">
						<span className="font-mono text-[12px] text-[#888]">
							{currentIndex + 1} / {totalQuestions}
						</span>
						{timeStr && (
							<span className={`font-mono text-[13px] tabular-nums ${timeWarning ? "text-red-400" : "text-[#bbb]"}`}>
								{timeStr}
							</span>
						)}
					</div>
				</div>
				<div className="h-1 bg-[#0a0a0a]">
					<div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: "#F5B800" }} />
				</div>
			</div>

			<div className="max-w-[760px] mx-auto px-6 py-10">
				<div className="flex flex-wrap gap-2 mb-5">
					<span className="px-2 py-0.5 rounded font-sans text-[11px] font-medium border" style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}0D` }}>
						{question.scenarioLabel}
					</span>
					<span className="px-2 py-0.5 rounded font-sans text-[11px] font-medium border border-[#2a2a2a] text-[#888]">
						{question.domain} · {question.domainLabel}
					</span>
					{question.tasks.map((t) => (
						<span key={t} className="px-2 py-0.5 rounded font-sans text-[10px] font-medium border border-[#222] text-[#666]">
							Task {t}
						</span>
					))}
					<span className="px-2 py-0.5 rounded font-sans text-[10px] font-medium border border-[#222] text-[#666] uppercase tracking-wider">
						{question.difficulty}
					</span>
				</div>

				<div className="font-serif text-[20px] text-white leading-[1.55] mb-7 whitespace-pre-wrap">{question.stem}</div>

				<div className="space-y-2.5 mb-8">
					{question.choices.map((c) => {
						const isSelected = selected === c.key;
						const isCorrectChoice = reveal && reveal.correct === c.key;
						const isWrongChoice = reveal && reveal.selected === c.key && !reveal.isCorrect;
						let borderColor = "#1a1a1a";
						let bg = "#111";
						let labelColor = "#555";
						if (reveal) {
							if (isCorrectChoice) {
								borderColor = "#22c55e";
								bg = "#22c55e10";
								labelColor = "#22c55e";
							} else if (isWrongChoice) {
								borderColor = "#ef4444";
								bg = "#ef444410";
								labelColor = "#ef4444";
							}
						} else if (isSelected) {
							borderColor = "#F5B800";
							bg = "#F5B80010";
							labelColor = "#F5B800";
						}
						return (
							<button
								key={c.key}
								type="button"
								onClick={() => !reveal && setSelected(c.key)}
								disabled={!!reveal}
								className="w-full text-left px-4 py-3.5 rounded-xl border flex gap-3 items-start transition-all"
								style={{ borderColor, backgroundColor: bg }}
							>
								<span className="font-mono text-[13px] font-bold mt-0.5 shrink-0" style={{ color: labelColor }}>{c.key}</span>
								<span className="font-sans text-[14px] text-[#ddd] leading-[1.55]">{c.text}</span>
							</button>
						);
					})}
				</div>

				{!reveal && (
					<>
						<button
							type="button"
							disabled={!selected || submitting}
							onClick={submitAnswer}
							className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{submitting ? "Checking…" : "Submit answer"}
						</button>
						<p className="mt-3 text-center font-mono text-[11px] text-[#555]">
							<kbd className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#888]">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#888]">4</kbd> to pick · <kbd className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#888]">Enter</kbd> to submit
						</p>
					</>
				)}

				{reveal && (
					<div className="space-y-4">
						<div
							className="rounded-xl border p-5"
							style={{
								borderColor: reveal.isCorrect ? "#22c55e40" : "#ef444440",
								backgroundColor: reveal.isCorrect ? "#22c55e0D" : "#ef44440D",
							}}
						>
							<div
								className="font-sans text-[13px] font-semibold uppercase tracking-wider mb-2"
								style={{ color: reveal.isCorrect ? "#22c55e" : "#ef4444" }}
							>
								{reveal.isCorrect ? "Correct" : `Incorrect — answer is ${reveal.correct}`}
							</div>
							<div className="font-sans text-[14px] text-[#ddd] leading-[1.65]">{reveal.explanation}</div>
						</div>
						{Object.entries(reveal.distractorRationales).length > 0 && (
							<div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
								<div className="font-sans text-[12px] font-semibold uppercase tracking-wider text-[#888] mb-3">Why the others are wrong</div>
								<div className="space-y-2.5">
									{(Object.keys(reveal.distractorRationales) as ("A" | "B" | "C" | "D")[]).map((k) => (
										<div key={k} className="flex gap-3">
											<span className="font-mono text-[12px] font-bold text-[#666] shrink-0">{k}</span>
											<span className="font-sans text-[13px] text-[#aaa] leading-[1.6]">
												{reveal.distractorRationales[k]}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
						{reveal.studyTags.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{reveal.studyTags.map((t) => (
									<span key={t} className="px-2 py-0.5 rounded font-mono text-[11px] text-[#666] border border-[#222] bg-[#0d0d0d]">
										{t}
									</span>
								))}
							</div>
						)}
						<button
							type="button"
							onClick={isLast ? finish : next}
							className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold hover:bg-[#e0a800]"
						>
							{isLast ? "See results →" : "Next question →"}
						</button>
					</div>
				)}
			</div>
		</main>
	);
}
