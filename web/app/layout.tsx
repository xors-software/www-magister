import "./globals.css"
import "./custom.css"
import { cn } from "@/utils/cn"
import { APP_CONFIG } from "@/config"
import type { Metadata } from "next"
import { NewsreaderFont, DMSansFont, DMMonoFont } from "@/fonts/fonts"
import { Toaster } from "@/components/toasts/Toaster"

export const metadata: Metadata = {
	title: `${APP_CONFIG.NAME} — AI-Powered Certification Prep`,
	description: APP_CONFIG.DESCRIPTION,
	openGraph: {
		title: APP_CONFIG.NAME,
		description: APP_CONFIG.DESCRIPTION,
		url: APP_CONFIG.URL,
		siteName: APP_CONFIG.NAME,
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: APP_CONFIG.NAME,
		description: APP_CONFIG.DESCRIPTION,
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className={cn(NewsreaderFont.variable, DMSansFont.variable, DMMonoFont.variable)}>
			<body className="font-serif antialiased bg-[#0a0a0a] text-[#e8e8e8]">
				{children}
				<Toaster />
			</body>
		</html>
	)
}
