"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	fetchMe,
	generateRecoveryCodes,
	getRecoveryCodesStatus,
	type RecoveryCodesStatus,
} from "@/lib/auth";

export default function RecoveryCodesPage() {
	const router = useRouter();
	const [status, setStatus] = useState<RecoveryCodesStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [codes, setCodes] = useState<string[] | null>(null);
	const [generating, setGenerating] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		(async () => {
			const me = await fetchMe();
			if (!me) {
				router.push("/login?next=/account/recovery-codes");
				return;
			}
			const s = await getRecoveryCodesStatus();
			setStatus(s);
			setLoading(false);
		})();
	}, [router]);

	async function onGenerate() {
		setError("");
		setGenerating(true);
		try {
			const next = await generateRecoveryCodes();
			setCodes(next);
			// Refresh status so when the user finishes saving, the post-save
			// view shows the new generated_at + count.
			const s = await getRecoveryCodesStatus();
			setStatus(s);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't generate codes");
		} finally {
			setGenerating(false);
		}
	}

	function onConfirm() {
		// Hide the codes from the screen and switch back to the status view.
		// Plaintext is gone from server-side; if the user said "I saved them"
		// without actually saving, that's on them.
		setCodes(null);
		setConfirming(false);
		setCopied(false);
	}

	async function copyAll() {
		if (!codes) return;
		try {
			await navigator.clipboard.writeText(codes.join("\n"));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setError("Clipboard write blocked. Select the codes and copy manually.");
		}
	}

	if (loading) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
				<div className="font-sans text-[#555] animate-pulse">Loading…</div>
			</main>
		);
	}

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] flex items-start justify-center px-4 py-16">
			<div className="w-full max-w-[520px]">
				<Link href="/" className="block mb-10">
					<div className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</div>
				</Link>

				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-2">Recovery codes</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8 leading-[1.6]">
					Save these somewhere safe (1Password, a notes app, anywhere offline). If you ever forget your password, you can use one to reset it yourself — no admin involvement.
				</p>

				{codes ? (
					<div>
						<div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 font-sans text-sm text-amber-300">
							<strong className="font-semibold">Save these now.</strong> They won't be shown again. Each code works once.
						</div>
						<div className="rounded-xl bg-[#111] border border-[#1a1a1a] p-5 mb-4">
							<div className="font-mono text-[14px] text-white space-y-1.5">
								{codes.map((c, i) => (
									<div key={c} className="flex gap-3">
										<span className="text-[#444] tabular-nums w-6">{i + 1}.</span>
										<span className="select-all">{c}</span>
									</div>
								))}
							</div>
						</div>
						<div className="flex gap-2 mb-6">
							<button
								type="button"
								onClick={copyAll}
								className="flex-1 py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-white font-sans text-[14px] font-medium transition-colors"
							>
								{copied ? "Copied ✓" : "Copy all"}
							</button>
						</div>
						<label className="flex items-start gap-3 mb-4 cursor-pointer">
							<input
								type="checkbox"
								checked={confirming}
								onChange={(e) => setConfirming(e.target.checked)}
								className="mt-1 accent-[#F5B800]"
							/>
							<span className="font-sans text-[13px] text-[#888]">
								I've saved these somewhere safe. I understand they won't be shown again.
							</span>
						</label>
						<button
							type="button"
							onClick={onConfirm}
							disabled={!confirming}
							className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Done
						</button>
					</div>
				) : (
					<div>
						{status?.hasCodes ? (
							<div className="rounded-xl bg-[#0d1f15] border border-emerald-500/20 p-5 mb-6">
								<div className="font-sans text-[14px] text-emerald-300 font-semibold mb-1">
									Recovery codes are set up
								</div>
								<div className="font-sans text-[13px] text-[#7a9c8a]">
									{status.unusedCount} unused, {status.usedCount} used.
									{status.generatedAt && ` Generated ${new Date(status.generatedAt).toLocaleDateString()}.`}
								</div>
							</div>
						) : (
							<div className="rounded-xl bg-[#1f1505] border border-amber-500/20 p-5 mb-6">
								<div className="font-sans text-[14px] text-amber-300 font-semibold mb-1">
									No recovery codes yet
								</div>
								<div className="font-sans text-[13px] text-[#9c8a7a]">
									Without codes, a forgotten password means asking the project owner for a reset link. Generate codes now so you can do it yourself later.
								</div>
							</div>
						)}

						{error && (
							<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">{error}</div>
						)}

						<button
							type="button"
							onClick={onGenerate}
							disabled={generating}
							className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{generating ? "Generating…" : status?.hasCodes ? "Generate a new set (invalidates the old)" : "Generate recovery codes"}
						</button>
						{status?.hasCodes && (
							<p className="mt-3 font-sans text-[12px] text-[#555] text-center">
								Generating new codes wipes the old set. Only the new codes will work.
							</p>
						)}

						<p className="mt-8 text-center font-sans text-[12px] text-[#555]">
							<Link href="/claude-code/quiz" className="hover:text-[#888] transition-colors">← Back to drills</Link>
						</p>
					</div>
				)}
			</div>
		</main>
	);
}
