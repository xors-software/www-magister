import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export function generateStaticParams() {
	return Object.keys(SCENARIO_FILE_MAP).map((id) => ({ id }));
}

const markdownComponents: Components = {
	h1: ({ children }) => (
		<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mt-10 mb-4">
			{children}
		</h1>
	),
	h2: ({ children }) => (
		<h2 className="font-serif text-[24px] font-bold text-white tracking-[-0.01em] mt-9 mb-3 border-b border-[#1a1a1a] pb-2">
			{children}
		</h2>
	),
	h3: ({ children }) => (
		<h3 className="font-sans text-[16px] font-bold text-white mt-7 mb-2">{children}</h3>
	),
	h4: ({ children }) => (
		<h4 className="font-sans text-[14px] font-semibold text-[#F5B800] mt-5 mb-1.5 uppercase tracking-wider">
			{children}
		</h4>
	),
	p: ({ children }) => (
		<p className="my-3 font-sans text-[14px] text-[#ccc] leading-[1.75]">{children}</p>
	),
	ul: ({ children }) => <ul className="my-3 space-y-1 pl-1 list-disc list-outside ml-5">{children}</ul>,
	ol: ({ children }) => <ol className="my-3 space-y-1.5 list-decimal list-outside ml-6">{children}</ol>,
	li: ({ children }) => (
		<li className="font-sans text-[14px] text-[#bbb] leading-[1.7] pl-1 marker:text-[#444]">{children}</li>
	),
	blockquote: ({ children }) => (
		<blockquote className="my-4 pl-4 border-l-2 border-[#F5B800] font-serif italic text-[15px] text-[#ccc] leading-[1.65]">
			{children}
		</blockquote>
	),
	hr: () => <hr className="my-8 border-[#1a1a1a]" />,
	strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
	em: ({ children }) => <em className="italic">{children}</em>,
	a: ({ href, children }) => (
		<a href={href} className="text-[#F5B800] hover:underline" target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	),
	code: ({ className, children }) => {
		// Block code (inside <pre>) gets language-* class; inline does not.
		const isBlock = /language-/.test(className || "");
		if (isBlock) {
			return <code className={`font-mono text-[12px] text-[#bbb] leading-[1.6] ${className}`}>{children}</code>;
		}
		return (
			<code className="font-mono text-[12px] px-1 py-0.5 rounded bg-[#1a1a1a] text-[#F5B800]">
				{children}
			</code>
		);
	},
	pre: ({ children }) => (
		<pre className="my-4 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 overflow-x-auto">{children}</pre>
	),
	table: ({ children }) => (
		<div className="my-4 overflow-x-auto">
			<table className="w-full font-sans text-[13px] text-[#ccc] border-collapse">{children}</table>
		</div>
	),
	thead: ({ children }) => <thead className="border-b border-[#2a2a2a]">{children}</thead>,
	th: ({ children }) => <th className="text-left px-3 py-2 font-semibold text-white">{children}</th>,
	td: ({ children }) => <td className="px-3 py-2 border-b border-[#1a1a1a]">{children}</td>,
};

export default async function ScenarioDetail({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const file = SCENARIO_FILE_MAP[id];

	if (!file) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center text-center px-4">
				<div>
					<div className="font-serif text-[24px] text-white mb-2">Unknown scenario</div>
					<Link
						href="/claude-code/scenarios"
						className="font-sans text-[13px] text-[#F5B800] hover:underline"
					>
						Back to all scenarios →
					</Link>
				</div>
			</main>
		);
	}

	const mdPath = path.join(process.cwd(), "public", "scenarios", `${file}.md`);
	const md = fs.readFileSync(mdPath, "utf8");

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] pb-20">
			<nav className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
				<div className="max-w-[820px] mx-auto px-6 h-14 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">
							XORS
						</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">
							Reps
						</span>
					</Link>
					<div className="flex gap-3">
						<Link
							href="/claude-code/scenarios"
							className="font-sans text-[13px] text-[#888] hover:text-white"
						>
							All scenarios
						</Link>
						<Link
							href={`/claude-code/quiz?prefill=scenario:${id}`}
							className="font-sans text-[13px] text-[#F5B800] hover:underline"
						>
							Drill this scenario
						</Link>
					</div>
				</div>
			</nav>

			<div className="max-w-[820px] mx-auto px-6 pt-8">
				<Link
					href="/claude-code/scenarios"
					className="font-sans text-[12px] text-[#666] hover:text-[#F5B800]"
				>
					← All scenarios
				</Link>
			</div>

			<article className="max-w-[820px] mx-auto px-6 pb-20">
				<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
					{md}
				</ReactMarkdown>
			</article>
		</main>
	);
}
