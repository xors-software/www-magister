"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { login } from "@/lib/auth";

function LoginInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next") || "/quiz";
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await login(email, name || undefined);
			router.push(next);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	}

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

				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-2">Sign in</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8 leading-[1.6]">
					Use your work email — we'll keep your drill history and per-domain stats tied to it. No password (yet); this is an early-access build.
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
					<div>
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Display name <span className="text-[#333] normal-case">(optional)</span></label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
						/>
					</div>
					{error && (
						<div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">{error}</div>
					)}
					<button
						type="submit"
						disabled={loading || !email}
						className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{loading ? "Signing in…" : "Sign in"}
					</button>
				</form>

				<p className="mt-6 text-center font-sans text-[12px] text-[#555]">
					New here? Just enter your email — your account is created automatically.
				</p>
			</div>
		</main>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center"><div className="font-sans text-[#555] animate-pulse">Loading…</div></main>}>
			<LoginInner />
		</Suspense>
	);
}
