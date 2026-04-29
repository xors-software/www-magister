import Link from "next/link";

const SCENARIOS = [
	{ id: "customer-support", file: "scenario-1-customer-support", title: "Customer Support Resolution Agent", color: "#4f9cf7", domains: "D1 · D2 · D5", n: 1 },
	{ id: "code-generation", file: "scenario-2-claude-code", title: "Code Generation with Claude Code", color: "#22c55e", domains: "D3 · D5", n: 2 },
	{ id: "multi-agent-research", file: "scenario-3-multi-agent-research", title: "Multi-Agent Research System", color: "#a855f7", domains: "D1 · D2 · D5", n: 3 },
	{ id: "developer-productivity", file: "scenario-4-developer-productivity", title: "Developer Productivity with Claude", color: "#f59e0b", domains: "D1 · D2 · D3 · D5", n: 4 },
	{ id: "ci-cd", file: "scenario-5-ci-cd", title: "Claude Code for Continuous Integration", color: "#ef4444", domains: "D3 · D4", n: 5 },
	{ id: "structured-extraction", file: "scenario-6-structured-extraction", title: "Structured Data Extraction", color: "#06b6d4", domains: "D4 · D5", n: 6 },
];

export default function ScenariosIndex() {
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
						<Link href="/claude-code/quiz" className="font-sans text-[13px] text-[#F5B800] hover:underline">Drill</Link>
						<Link href="/claude-code/dashboard" className="font-sans text-[13px] text-[#888] hover:text-white">Dashboard</Link>
					</div>
				</div>
			</nav>

			<div className="max-w-[820px] mx-auto px-6 py-10">
				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-1">The six scenarios</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8">
					The official exam guide is built around five scenarios; we cover all six known deep-dives. <span className="text-white">Memorize them.</span> The slack passers all said the same thing: read these until they're second nature.
				</p>

				<div className="grid gap-3">
					{SCENARIOS.map((s) => (
						<Link
							key={s.id}
							href={`/claude-code/scenarios/${s.id}`}
							className="rounded-xl border border-[#1a1a1a] hover:border-[#444] bg-[#0d0d0d] p-5 flex items-start gap-4 transition-colors"
						>
							<span
								className="w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold text-white shrink-0"
								style={{ backgroundColor: s.color }}
							>
								{s.n}
							</span>
							<div className="flex-1 min-w-0">
								<div className="font-sans text-[15px] font-semibold text-white mb-1">{s.title}</div>
								<div className="font-mono text-[11px] text-[#666]">{s.domains}</div>
							</div>
							<span className="font-sans text-[13px] text-[#666] mt-1.5">→</span>
						</Link>
					))}
				</div>
			</div>
		</main>
	);
}
