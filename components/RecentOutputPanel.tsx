"use client"

import type { FlavorCaption } from "@/lib/types"

export function RecentOutputPanel({ captions }: { captions: FlavorCaption[] }) {
  return (
    <div
      className="glass-panel recent-output-panel"
      style={{
        borderRadius: 24,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <p className="muted-label" style={{ margin: "0 0 8px" }}>
          Recent Output
        </p>
        <h2 style={{ margin: 0, fontSize: 22 }}>Captions Produced by This Flavor</h2>
      </div>

      <div className="recent-output-list" style={{ display: "grid", gap: 12, minHeight: 0 }}>
        {captions.length === 0 ? (
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              border: "1px dashed var(--input-border)",
              color: "var(--text-secondary)",
            }}
          >
            No generated captions recorded for this flavor yet.
          </div>
        ) : null}

        {captions.map((caption) => (
          <div
            key={caption.id}
            style={{
              display: "grid",
              gridTemplateColumns: "96px minmax(0, 1fr)",
              gap: 14,
              padding: 14,
              borderRadius: 14,
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              alignItems: "start",
            }}
          >
            <div
              style={{
                width: 96,
                height: 72,
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--surface)",
              }}
            >
              {caption.images?.url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={caption.images.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </>
              ) : null}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
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
                  fontSize: 12,
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
