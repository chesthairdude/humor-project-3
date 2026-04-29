"use client"

import type { FlavorCaption } from "@/lib/types"

export function RecentOutputPanel({
  captions,
  loadingHistory,
}: {
  captions: FlavorCaption[]
  loadingHistory: boolean
}) {
  return (
    <div
      className="glass-panel recent-output-panel"
      style={{
        padding: "20px 24px",
        borderRadius: 16,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <p className="muted-label" style={{ margin: "0 0 4px" }}>
          Recent Output
        </p>
        <h2 style={{ margin: 0, fontSize: 20 }}>Captions Produced by This Flavor</h2>
      </div>

      <div
        className="recent-output-list"
        style={{
          maxHeight: 320,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingRight: 4,
        }}
      >
        {loadingHistory ? (
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textAlign: "center",
              margin: "16px 0",
            }}
          >
            Loading captions...
          </div>
        ) : captions.length === 0 ? (
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontStyle: "italic",
              textAlign: "center",
              margin: "16px 0",
            }}
          >
            No captions generated yet for this flavor.
          </div>
        ) : null}

        {captions.map((caption) => (
          <div
            key={caption.id}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: 12,
              borderRadius: 10,
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--surface)",
                flexShrink: 0,
              }}
            >
              {caption.images?.url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={caption.images.url}
                    alt=""
                    style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "cover" }}
                  />
                </>
              ) : null}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {caption.content}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {new Date(caption.created_datetime_utc).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
