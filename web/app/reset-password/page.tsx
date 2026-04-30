"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "@/lib/auth";

function ResetPasswordInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") || "";
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		if (password !== confirm) {
			setError("Passwords don't match.");
			return;
		}
		setLoading(true);
		try {
			await resetPassword(token, password);
			// Hand off to login. Showing a flag so the login page can surface
			// a "you can sign in now" hint without conflating it with errors.
			router.push("/login?reset=ok");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Reset failed");
			setPassword("");
			setConfirm("");
		} finally {
			setLoading(false);
		}
	}

	const passwordOk = password.length >= 8;
	const matches = password.length > 0 && password === confirm;
	const canSubmit = passwordOk && matches && !loading && token.length > 0;

	if (!token) {
		return (
			<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] flex items-center justify-center px-4">
				<div className="w-full max-w-[420px]">
					<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-2">Missing reset token</h1>
					<p className="font-sans text-[14px] text-[#888] mb-8 leading-[1.6]">
						This page expects a token in the URL. Use the link the project owner sent you, or request a new one.
					</p>
					<Link href="/forgot-password" className="block w-full text-center py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800]">
						Request a reset link
					</Link>
				</div>
			</main>
		);
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

				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-2">Set a new password</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8 leading-[1.6]">
					Pick something at least 8 characters. Once you reset, every existing session for your account is signed out.
				</p>

				<form onSubmit={onSubmit} className="space-y-3">
					<div>
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">New password</label>
						<input
							type="password"
							required
							autoFocus
							autoComplete="new-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 8 characters"
							className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
						/>
						{password.length > 0 && !passwordOk && (
							<p className="mt-1.5 font-sans text-[11px] text-[#666]">{8 - password.length} more character{8 - password.length === 1 ? "" : "s"}</p>
						)}
					</div>
					<div>
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Confirm new password</label>
						<input
							type="password"
							required
							autoComplete="new-password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							placeholder="Re-type it"
							className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
						/>
						{confirm.length > 0 && password !== confirm && (
							<p className="mt-1.5 font-sans text-[11px] text-[#666]">Doesn't match.</p>
						)}
					</div>
					{error && (
						<div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">{error}</div>
					)}
					<button
						type="submit"
						disabled={!canSubmit}
						className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{loading ? "Resetting…" : "Reset password"}
					</button>
				</form>
			</div>
		</main>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center"><div className="font-sans text-[#555] animate-pulse">Loading…</div></main>}>
			<ResetPasswordInner />
		</Suspense>
	);
}
