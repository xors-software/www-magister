"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await requestPasswordReset(email);
			// Always show the same generic confirmation regardless of whether
			// the email is registered — see server/routes/auth.ts.
			setSubmitted(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Request failed");
		} finally {
			setLoading(false);
		}
	}

	const canSubmit = email.length > 3 && !loading;

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] flex items-center justify-center px-4">
			<div className="w-full max-w-[420px]">
				<Link href="/" className="block mb-10">
					<div className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</div>
				</Link>

				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-2">Reset your password</h1>

				{submitted ? (
					<>
						<p className="font-sans text-[14px] text-[#888] mb-8 leading-[1.6]">
							If an account exists for that email, the project owner will share a reset link with you shortly. Check Slack — there's no email step yet.
						</p>
						<Link href="/login" className="block w-full text-center py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800]">
							Back to sign in
						</Link>
					</>
				) : (
					<>
						<p className="font-sans text-[14px] text-[#888] mb-8 leading-[1.6]">
							Enter your email and we'll generate a reset link. The project owner will share it with you out of band — no email is sent automatically.
						</p>
						<form onSubmit={onSubmit} className="space-y-3">
							<div>
								<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Email</label>
								<input
									type="email"
									required
									autoFocus
									autoComplete="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@lazer.com"
									className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
								/>
							</div>
							{error && (
								<div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">{error}</div>
							)}
							<button
								type="submit"
								disabled={!canSubmit}
								className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{loading ? "Sending…" : "Request reset link"}
							</button>
						</form>
						<p className="mt-6 text-center font-sans text-[12px] text-[#555]">
							Remembered it?{" "}
							<Link href="/login" className="text-[#888] hover:text-[#F5B800] underline-offset-4 hover:underline transition-colors">
								Back to sign in
							</Link>
						</p>
					</>
				)}
			</div>
		</main>
	);
}
