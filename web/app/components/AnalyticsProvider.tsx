"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

// Mounts once at the app shell to call PostHog's init(). User
// identification happens later (after /auth/me resolves on
// authenticated pages) — see fetchMe call sites + identifyUser.
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		initAnalytics();
	}, []);
	return <>{children}</>;
}
