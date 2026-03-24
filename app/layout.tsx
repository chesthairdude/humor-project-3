import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"

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
      <body className={GeistSans.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
