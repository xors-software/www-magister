"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetWithRecoveryCode } from "@/lib/auth";

// Recovery codes only. The previous magic-link path was admin-mediated
// (server logged a URL to Railway logs for an admin to share manually) —
// in practice nobody saw the notification, so it didn't actually deliver
// the recovery experience promised. Kept the backend endpoints intact for
// rollback but removed the UI entry point. Users without recovery codes
// get OAuth via Google, or they ping the project owner directly.

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await resetWithRecoveryCode(email, code, newPassword);
			router.push("/login?reset=ok");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Reset failed");
			// Clear the password — matches the login form's pattern, and a
			// stale field is the most common shared-machine hazard.
			setNewPassword("");
		} finally {
			setLoading(false);
		}
	}

	const codeOk = code.replace(/[\s-]/g, "").length === 16;
	const passwordOk = newPassword.length >= 8;
	const canSubmit = email.length > 3 && codeOk && passwordOk && !loading;

	return (
		<main className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] flex items-start justify-center px-4 py-16">
			<div className="w-full max-w-[460px]">
				<Link href="/" className="block mb-10">
					<div className="flex items-center gap-2">
						<span className="font-sans text-[13px] font-bold text-[#F5B800] tracking-[0.08em] uppercase">XORS</span>
						<span className="text-[#333] font-sans text-xs">/</span>
						<span className="font-sans text-[13px] font-medium text-[#888] tracking-[0.04em]">Reps</span>
					</div>
				</Link>

				<h1 className="font-serif text-[32px] font-bold text-white tracking-[-0.02em] mb-2">Reset your password</h1>
				<p className="font-sans text-[14px] text-[#888] mb-8 leading-[1.6]">
					Enter your email, one of the recovery codes you saved, and a new password. Codes work once each. No recovery codes? <Link href="/login" className="text-[#aaa] hover:text-[#F5B800] underline-offset-4 hover:underline transition-colors">Sign in with Google</Link>, or message the project owner.
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
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Recovery code</label>
						<input
							type="text"
							required
							autoComplete="one-time-code"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder="xxxx-xxxx-xxxx-xxxx"
							className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-mono text-[14px] text-white placeholder:text-[#444]"
						/>
						{code.length > 0 && !codeOk && (
							<p className="mt-1.5 font-sans text-[11px] text-[#666]">Should be 16 hex characters (dashes optional).</p>
						)}
					</div>
					<div>
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">New password</label>
						<input
							type="password"
							required
							autoComplete="new-password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="At least 8 characters"
							className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
						/>
						{newPassword.length > 0 && !passwordOk && (
							<p className="mt-1.5 font-sans text-[11px] text-[#666]">{8 - newPassword.length} more character{8 - newPassword.length === 1 ? "" : "s"}</p>
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

				<p className="mt-6 text-center font-sans text-[12px] text-[#555]">
					Remembered it?{" "}
					<Link href="/login" className="text-[#888] hover:text-[#F5B800] underline-offset-4 hover:underline transition-colors">
						Back to sign in
					</Link>
				</p>
			</div>
		</main>
	);
}
