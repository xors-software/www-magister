"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { login } from "@/lib/auth";
import { buildXorsSignInUrl } from "@/lib/xors";

function LoginInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next") || undefined;
	const errorCode = searchParams.get("error");
	const justReset = searchParams.get("reset") === "ok";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const errorMessage = errorMessageForCode(errorCode);
	const signInUrl = buildXorsSignInUrl(next);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			// Bun API does dual-auth: tries local password first, falls
			// back to api.xors.xyz/api/users/authenticate. Sets either a
			// reps_session or xors_session cookie based on which path
			// won. The frontend doesn't care which.
			await login(email, password);
			router.push(next || "/claude-code/quiz");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed.");
			setPassword("");
		} finally {
			setLoading(false);
		}
	}

	const passwordOk = password.length >= 8;
	const canSubmit = email.length > 3 && passwordOk && !loading;

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
					Reps uses your XORS account. Sign in with Google or your email + password — your access is shared with the rest of the XORS apps. New here? Your account is created on first sign-in.
				</p>

				{errorMessage && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{errorMessage}
					</div>
				)}

				{justReset && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-sans text-sm text-emerald-400">
						Password reset. Sign in with your new password.
					</div>
				)}

				{/* Primary CTA: Google. Plain anchor — top-level navigation
				    through api.xors.xyz handles the OAuth dance and bounces
				    back to our /oauth callback. */}
				<a
					href={signInUrl}
					className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white text-[#1f1f1f] font-sans text-[15px] font-bold transition-colors hover:bg-[#eaeaea]"
				>
					<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
						<path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
						<path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
						<path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
						<path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
					</svg>
					Sign in with Google
				</a>

				<div className="my-6 flex items-center gap-3">
					<div className="flex-1 h-px bg-[#1a1a1a]"></div>
					<span className="font-sans text-[11px] text-[#444] uppercase tracking-[0.1em]">or with password</span>
					<div className="flex-1 h-px bg-[#1a1a1a]"></div>
				</div>

				<form onSubmit={onSubmit} className="space-y-3">
					<div>
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Email</label>
						<input
							type="email"
							required
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@lazer.com"
							className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
						/>
					</div>
					<div>
						<label className="block font-sans text-[11px] font-semibold text-[#555] uppercase tracking-[0.08em] mb-1.5">Password</label>
						<input
							type="password"
							required
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="At least 8 characters"
							className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] focus:border-[#F5B800] outline-none font-sans text-[14px] text-white placeholder:text-[#444]"
						/>
						{password.length > 0 && !passwordOk && (
							<p className="mt-1.5 font-sans text-[11px] text-[#666]">{8 - password.length} more character{8 - password.length === 1 ? "" : "s"}</p>
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
						{loading ? "Signing in…" : "Sign in"}
					</button>
				</form>

				<p className="mt-6 text-center font-sans text-[12px] text-[#555]">
					<Link href="/forgot-password" className="text-[#888] hover:text-[#F5B800] underline-offset-4 hover:underline transition-colors">
						Forgot your password?
					</Link>
				</p>
			</div>
		</main>
	);
}

function errorMessageForCode(code: string | null): string | null {
	switch (code) {
		case null:
			return null;
		case "oauth_no_key":
			return "Sign-in didn't complete. The redirect from Google was missing the session key. Try again.";
		case "oauth_decrypt":
			return "Couldn't verify the sign-in response. Try again — if it keeps happening, ping the project owner.";
		case "oauth_empty_key":
			return "Sign-in returned an empty session. Try again.";
		default:
			return "Sign-in failed. Try again.";
	}
}

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center"><div className="font-sans text-[#555] animate-pulse">Loading…</div></main>}>
			<LoginInner />
		</Suspense>
	);
}
