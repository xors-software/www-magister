"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestPasswordReset, resetWithRecoveryCode } from "@/lib/auth";

type Mode = "code" | "link";

export default function ForgotPasswordPage() {
	const router = useRouter();
	// Default to recovery-code path because that's the self-serve option
	// users should reach for first. Magic-link is the fallback if they
	// never set codes up (or lost them).
	const [mode, setMode] = useState<Mode>("code");

	// Code branch state
	const [codeEmail, setCodeEmail] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [codeLoading, setCodeLoading] = useState(false);
	const [codeError, setCodeError] = useState("");

	// Magic-link branch state
	const [linkEmail, setLinkEmail] = useState("");
	const [linkSubmitted, setLinkSubmitted] = useState(false);
	const [linkLoading, setLinkLoading] = useState(false);
	const [linkError, setLinkError] = useState("");

	async function onCodeSubmit(e: React.FormEvent) {
		e.preventDefault();
		setCodeError("");
		setCodeLoading(true);
		try {
			await resetWithRecoveryCode(codeEmail, code, newPassword);
			router.push("/login?reset=ok");
		} catch (err) {
			setCodeError(err instanceof Error ? err.message : "Reset failed");
			// Don't clear the email/code — user might just have a typo.
			// Clear the password so they re-enter it (matches the login form's
			// pattern, and a stale password field is the most common
			// shared-machine hazard).
			setNewPassword("");
		} finally {
			setCodeLoading(false);
		}
	}

	async function onLinkSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLinkError("");
		setLinkLoading(true);
		try {
			await requestPasswordReset(linkEmail);
			setLinkSubmitted(true);
		} catch (err) {
			setLinkError(err instanceof Error ? err.message : "Request failed");
		} finally {
			setLinkLoading(false);
		}
	}

	const codeOk = code.replace(/[\s-]/g, "").length === 16;
	const passwordOk = newPassword.length >= 8;
	const codeCanSubmit = codeEmail.length > 3 && codeOk && passwordOk && !codeLoading;
	const linkCanSubmit = linkEmail.length > 3 && !linkLoading;

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

				{/* Mode toggle. Renders as a small two-button bar so neither
				    option is hidden behind extra clicks. */}
				<div className="mt-4 mb-8 inline-flex rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-1">
					<button
						type="button"
						onClick={() => setMode("code")}
						className={`px-4 py-2 rounded-lg font-sans text-[13px] font-medium transition-colors ${mode === "code" ? "bg-[#1a1a1a] text-white" : "text-[#666] hover:text-[#aaa]"}`}
					>
						Use recovery code
					</button>
					<button
						type="button"
						onClick={() => setMode("link")}
						className={`px-4 py-2 rounded-lg font-sans text-[13px] font-medium transition-colors ${mode === "link" ? "bg-[#1a1a1a] text-white" : "text-[#666] hover:text-[#aaa]"}`}
					>
						Request reset link
					</button>
				</div>

				{mode === "code" ? (
					<>
						<p className="font-sans text-[14px] text-[#888] mb-6 leading-[1.6]">
							Enter your email, one of the recovery codes you saved, and a new password. Codes work once each. If you never set up codes, switch to "Request reset link".
						</p>
						<form onSubmit={onCodeSubmit} className="space-y-3">
							<div>
								<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Email</label>
								<input
									type="email"
									required
									autoFocus
									autoComplete="email"
									value={codeEmail}
									onChange={(e) => setCodeEmail(e.target.value)}
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
							{codeError && (
								<div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">{codeError}</div>
							)}
							<button
								type="submit"
								disabled={!codeCanSubmit}
								className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{codeLoading ? "Resetting…" : "Reset password"}
							</button>
						</form>
					</>
				) : linkSubmitted ? (
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
						<p className="font-sans text-[14px] text-[#888] mb-6 leading-[1.6]">
							Enter your email and we'll generate a reset link. The project owner will share it with you out of band — no email is sent automatically.
						</p>
						<form onSubmit={onLinkSubmit} className="space-y-3">
							<div>
								<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Email</label>
								<input
									type="email"
									required
									autoFocus
									autoComplete="email"
									value={linkEmail}
									onChange={(e) => setLinkEmail(e.target.value)}
									placeholder="you@lazer.com"
									className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
								/>
							</div>
							{linkError && (
								<div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">{linkError}</div>
							)}
							<button
								type="submit"
								disabled={!linkCanSubmit}
								className="w-full py-3.5 rounded-xl bg-[#F5B800] text-black font-sans text-[15px] font-bold transition-colors hover:bg-[#e0a800] disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{linkLoading ? "Sending…" : "Request reset link"}
							</button>
						</form>
					</>
				)}

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
