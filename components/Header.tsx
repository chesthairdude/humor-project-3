"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { useTheme, type Theme } from "@/app/providers/ThemeProvider"
import { createClient } from "@/utils/supabase/client"

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: "light", label: "☀️ Light" },
  { value: "dark", label: "🌙 Dark" },
  { value: "system", label: "💻 System" },
]

export function Header() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [signingOut, setSigningOut] = useState(false)

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
      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
        🎭 Humor Flavor Tool
      </span>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {THEMES.map((item) => (
          <button
            key={item.value}
            onClick={() => setTheme(item.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              border: "1px solid var(--border)",
              background: theme === item.value ? "var(--button-primary)" : "var(--surface)",
              color: theme === item.value ? "#ffffff" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}

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
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  )
}
