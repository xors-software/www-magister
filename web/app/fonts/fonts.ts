import { Newsreader, DM_Sans, DM_Mono } from "next/font/google"

// Newsreader - Elegant serif for body text and headings
const NewsreaderFont = Newsreader({
	subsets: ["latin"],
	variable: "--font-newsreader",
	display: "swap",
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
})

// DM Sans - Clean sans-serif for UI elements, labels, stats
const DMSansFont = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
	display: "swap",
	weight: ["400", "500", "600", "700"],
})

// DM Mono - Monospace for technical details
const DMMonoFont = DM_Mono({
	subsets: ["latin"],
	variable: "--font-dm-mono",
	display: "swap",
	weight: ["400", "500"],
})

export { NewsreaderFont, DMSansFont, DMMonoFont }
