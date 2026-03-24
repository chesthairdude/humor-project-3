"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "linear-gradient(135deg, #0f1117 0%, #141820 50%, #110f1a 100%)",
          color: "#f0f0f0",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "min(640px, 100%)",
            padding: 28,
            borderRadius: 20,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.7, textTransform: "uppercase" }}>
            Server Error
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 28 }}>Application error</h1>
          <p style={{ margin: "0 0 16px", lineHeight: 1.6, opacity: 0.85 }}>
            A server-side exception occurred. Check the deployment logs for the full stack trace.
          </p>
          {error.message ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: 16,
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 13,
              }}
            >
              {error.message}
            </pre>
          ) : null}
          {error.digest ? (
            <p style={{ margin: "12px 0 0", fontSize: 12, opacity: 0.65 }}>
              Digest: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: 18,
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background:
                "linear-gradient(135deg, rgba(100,120,255,0.85), rgba(140,100,255,0.85))",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  )
}
