import type { Metadata } from "next"

import "@/app/globals.css"
import { ThemeProvider } from "@/app/providers/ThemeProvider"

export const metadata: Metadata = {
  title: "Humor Flavor Tool",
  description: "Manage humor flavors, prompt chains, and test caption generation.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
