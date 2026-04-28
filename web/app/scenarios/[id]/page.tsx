"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const SCENARIO_FILE_MAP: Record<string, string> = {
	"customer-support": "scenario-1-customer-support",
	"code-generation": "scenario-2-claude-code",
	"multi-agent-research": "scenario-3-multi-agent-research",
	"developer-productivity": "scenario-4-developer-productivity",
	"ci-cd": "scenario-5-ci-cd",
	"structured-extraction": "scenario-6-structured-extraction",
};

const SCENARIO_LABELS: Record<string, string> = {
	"customer-support": "Customer Support Resolution Agent",
	"code-generation": "Code Generation with Claude Code",
	"multi-agent-research": "Multi-Agent Research System",
	"developer-productivity": "Developer Productivity with Claude",
	"ci-cd": "Claude Code for Continuous Integration",
	"structured-extraction": "Structured Data Extraction",
};

// Minimal, opinionated markdown → React renderer. Handles the structures
// these scenario MDs actually use: H1-H4, bullets, numbered, code fences,
// inline code, bold, italic, blockquotes. Doesn't try to be commonmark.
function renderMarkdown(md: string) {
	const lines = md.split(/\r?\n/);
	const blocks: React.ReactElement[] = [];
	let i = 0;
	let key = 0;

	const renderInline = (text: string): React.ReactNode[] => {
		// Inline code first (so we don't process markdown inside).
		const segments: React.ReactNode[] = [];
		const codeRe = /`([^`]+)`/g;
		let lastIdx = 0;
		let m: RegExpExecArray | null;
		while ((m = codeRe.exec(text)) !== null) {
			if (m.index > lastIdx) {
				segments.push(text.slice(lastIdx, m.index));
			}
			segments.push(
				<code key={`c${segments.length}`} className="font-mono text-[12px] px-1 py-0.5 rounded bg-[#1a1a1a] text-[#F5B800]">
					{m[1]}
				</code>,
			);
			lastIdx = m.index + m[0].length;
		}
		if (lastIdx < text.length) segments.push(text.slice(lastIdx));

		// Process bold/italic on plain text segments.
		const out: React.ReactNode[] = [];
		segments.forEach((seg, idx) => {
			if (typeof seg !== "string") {
				out.push(seg);
				return;
			}
			const parts = seg.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
			parts.forEach((p, j) => {
				if (p.startsWith("**") && p.endsWith("**")) {
					out.push(
						<strong key={`b${idx}-${j}`} className="text-white font-semibold">
							{p.slice(2, -2)}
						</strong>,
					);
				} else if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
					out.push(
						<em key={`i${idx}-${j}`} className="italic">
							{p.slice(1, -1)}
						</em>,
					);
				} else if (p) {
					out.push(p);
				}
			});
		});
		return out;
	};

	while (i < lines.length) {
		const line = lines[i];

		if (line.startsWith("```")) {
			const lang = line.slice(3).trim();
			const buf: string[] = [];
			i++;
			while (i < lines.length && !lines[i].startsWith("```")) {
				buf.push(lines[i]);
				i++;
			}
			i++;
			blocks.push(
				<pre key={key++} className="my-4 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 overflow-x-auto">
					<code className={`font-mono text-[12px] text-[#bbb] leading-[1.6] language-${lang}`}>{buf.join("\n")}</code>
				</pre>,
			);
			continue;
		}

		if (line.startsWith("# ")) {
			blocks.push(
				<h1 key={key++} className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mt-10 mb-4">
					{renderInline(line.slice(2))}
				</h1>,
			);
			i++;
			continue;
		}
		if (line.startsWith("## ")) {
			blocks.push(
				<h2 key={key++} className="font-serif text-[24px] font-bold text-white tracking-[-0.01em] mt-9 mb-3 border-b border-[#1a1a1a] pb-2">
					{renderInline(line.slice(3))}
				</h2>,
			);
			i++;
			continue;
		}
		if (line.startsWith("### ")) {
			blocks.push(
				<h3 key={key++} className="font-sans text-[16px] font-bold text-white mt-7 mb-2">
					{renderInline(line.slice(4))}
				</h3>,
			);
			i++;
			continue;
		}
		if (line.startsWith("#### ")) {
			blocks.push(
				<h4 key={key++} className="font-sans text-[14px] font-semibold text-[#F5B800] mt-5 mb-1.5 uppercase tracking-wider">
					{renderInline(line.slice(5))}
				</h4>,
			);
			i++;
			continue;
		}

		if (line.startsWith("- ") || line.startsWith("* ")) {
			const items: string[] = [];
			while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
				items.push(lines[i].slice(2));
				i++;
			}
			blocks.push(
				<ul key={key++} className="my-3 space-y-1 pl-1">
					{items.map((item, idx) => (
						<li key={idx} className="font-sans text-[14px] text-[#bbb] leading-[1.7] flex gap-3">
							<span className="text-[#444] mt-1.5 shrink-0">•</span>
							<span>{renderInline(item)}</span>
						</li>
					))}
				</ul>,
			);
			continue;
		}

		const numMatch = line.match(/^(\d+)\.\s+(.*)/);
		if (numMatch) {
			const items: { n: string; body: string }[] = [];
			while (i < lines.length) {
				const nm = lines[i].match(/^(\d+)\.\s+(.*)/);
				if (!nm) break;
				items.push({ n: nm[1], body: nm[2] });
				i++;
			}
			blocks.push(
				<ol key={key++} className="my-3 space-y-1.5">
					{items.map((it, idx) => (
						<li key={idx} className="font-sans text-[14px] text-[#bbb] leading-[1.7] flex gap-3">
							<span className="font-mono text-[12px] text-[#666] shrink-0 mt-1">{it.n}.</span>
							<span>{renderInline(it.body)}</span>
						</li>
					))}
				</ol>,
			);
			continue;
		}

		if (line.startsWith("> ")) {
			const buf: string[] = [];
			while (i < lines.length && lines[i].startsWith("> ")) {
				buf.push(lines[i].slice(2));
				i++;
			}
			blocks.push(
				<blockquote
					key={key++}
					className="my-4 pl-4 border-l-2 border-[#F5B800] font-serif italic text-[15px] text-[#ccc] leading-[1.65]"
				>
					{renderInline(buf.join(" "))}
				</blockquote>,
			);
			continue;
		}

		if (line.trim() === "---") {
			blocks.push(<hr key={key++} className="my-8 border-[#1a1a1a]" />);
			i++;
			continue;
		}

		if (line.trim() === "") {
			i++;
			continue;
		}

		// Paragraph: gather contiguous non-empty, non-prefixed lines.
		const paraBuf: string[] = [line];
		i++;
		while (
			i < lines.length &&
			lines[i].trim() !== "" &&
			!lines[i].startsWith("#") &&
			!lines[i].startsWith("- ") &&
			!lines[i].startsWith("* ") &&
			!lines[i].match(/^\d+\.\s/) &&
			!lines[i].startsWith("> ") &&
			!lines[i].startsWith("```") &&
			lines[i].trim() !== "---"
		) {
			paraBuf.push(lines[i]);
			i++;
		}
		blocks.push(
			<p key={key++} className="my-3 font-sans text-[14px] text-[#ccc] leading-[1.75]">
				{renderInline(paraBuf.join(" "))}
			</p>,
		);
	}

	return blocks;
}

export default function ScenarioDetail() {
	const params = useParams<{ id: string }>();
	const file = SCENARIO_FILE_MAP[params.id];
	const title = SCENARIO_LABELS[params.id] || "Scenario";
	const [md, setMd] = useState<string>("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!file) return;
		fetch(`/scenarios/${file}.md`)
			.then((r) => r.text())
			.then((text) => {
				setMd(text);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [file]);

	const rendered = useMemo(() => (md ? renderMarkdown(md) : []), [md]);

	if (!file) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center text-center px-4">
				<div>
					<div className="font-serif text-[24px] text-white mb-2">Unknown scenario</div>
					<Link href="/scenarios" className="font-sans text-[13px] text-[#F5B800] hover:underline">Back to all scenarios →</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] pb-20">
			<nav className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[820px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</Link>
					<div className="flex gap-3">
						<Link href="/scenarios" className="font-sans text-[13px] text-[#888] hover:text-white">All scenarios</Link>
						<Link href={`/quiz?prefill=scenario:${params.id}`} className="font-sans text-[13px] text-[#F5B800] hover:underline">Drill this scenario</Link>
					</div>
				</div>
			</nav>

			<div className="max-w-[820px] mx-auto px-6 pt-8">
				<Link href="/scenarios" className="font-sans text-[12px] text-[#666] hover:text-[#F5B800]">
					← All scenarios
				</Link>
			</div>

			<article className="max-w-[820px] mx-auto px-6 pb-20">
				{loading ? (
					<div className="font-sans text-[#555] animate-pulse mt-10">Loading scenario…</div>
				) : md ? (
					rendered
				) : (
					<div className="mt-10 font-sans text-[#888]">
						Couldn't load this scenario. Title: {title}.
					</div>
				)}
			</article>
		</main>
	);
}
