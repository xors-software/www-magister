"use client"

import { NewsreaderFont, DMSansFont, DMMonoFont } from "@/fonts"
import { useHasMounted } from "@/hooks"

type ProviderType = {
	children: React.ReactNode
}

export function GlobalStyleProvider({ children }: ProviderType) {
	const hasMounted = useHasMounted()

	return (
		<>
			{hasMounted && (
				<style>
					{`
          html {
            --font-newsreader: ${NewsreaderFont.style.fontFamily}, Georgia, serif;
            --font-dm-sans: ${DMSansFont.style.fontFamily}, system-ui, sans-serif;
            --font-dm-mono: ${DMMonoFont.style.fontFamily}, monospace;
          }
        `}
				</style>
			)}

			{children}
		</>
	)
}
