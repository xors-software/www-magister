"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { buildXorsSignInUrl } from "@/lib/xors";

function LoginInner() {
	const searchParams = useSearchParams();
	const next = searchParams.get("next") || undefined;
	const errorCode = searchParams.get("error");

	const errorMessage = errorMessageForCode(errorCode);
	const signInUrl = buildXorsSignInUrl(next);

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
					Magister uses your XORS account. Sign in with Google to continue — your access is shared with the rest of the XORS apps.
				</p>

				{errorMessage && (
					<div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 font-sans text-sm text-red-400">
						{errorMessage}
					</div>
				)}

				{/* Plain anchor — top-level navigation through api.xors.xyz.
				    The OAuth start endpoint there sets state cookies on its
				    own domain, redirects to Google, and bounces back to our
				    /oauth callback with the encrypted session key. */}
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

				<p className="mt-6 text-center font-sans text-[12px] text-[#555]">
					Trouble signing in? Ping the project owner.
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
