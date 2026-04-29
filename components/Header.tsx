"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { useTheme } from "@/app/providers/ThemeProvider"
import { createClient } from "@/utils/supabase/client"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [signingOut, setSigningOut] = useState(false)

  function getBackHref() {
    if (!pathname) {
      return "/flavors"
    }

    if (pathname.endsWith("/edit")) {
      return pathname.replace(/\/edit$/, "")
    }

    if (pathname.startsWith("/flavors/")) {
      return "/flavors"
    }

    return null
  }

  const backHref = getBackHref()
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
  const themeLabel = resolvedTheme === "dark" ? "Switch to Light" : "Switch to Dark"
  const themeIcon = resolvedTheme === "dark" ? "☀️" : "🌙"

  async function signOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <header
      className="glass-panel"
      style={{
        height: 60,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderRadius: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {backHref ? (
          <button
            onClick={() => router.push(backHref)}
            className="secondary-button"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        ) : null}

        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
          🎭 Humor Flavor Tool
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => setTheme(nextTheme)}
          className="secondary-button"
          aria-label={themeLabel}
          title={themeLabel}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          {themeIcon} {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <button
          onClick={signOut}
          disabled={signingOut}
          className="secondary-button"
          style={{
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    </header>
  )
}
