"use client"

import { useState } from "react"

import { createClient } from "@/utils/supabase/client"

export function LoginCard({ error }: { error?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback`

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    })

    if (signInError) {
      window.location.href = "/login?error=auth"
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: 420,
          maxWidth: "100%",
          padding: "44px 40px",
          borderRadius: 24,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            margin: "0 0 8px",
          }}
        >
          Humor Flavor Tool
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            margin: "0 0 8px",
          }}
        >
          Sign In
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            margin: "0 0 32px",
          }}
        >
          Requires superadmin or matrix admin access.
        </p>

        {error ? (
          <div className="danger-banner" style={{ marginBottom: 16, fontSize: 13 }}>
            {error === "unauthorized"
              ? "Your account is not authorized to access this tool."
              : "Authentication failed. Please try again."}
          </div>
        ) : null}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="primary-button"
          style={{
            width: "100%",
            padding: 14,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Connecting..." : "Continue with Google"}
        </button>
      </div>
    </div>
  )
}
