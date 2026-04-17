"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import type { HumorFlavor } from "@/lib/types"

export function FlavorCard({
  flavor,
  actions,
}: {
  flavor: HumorFlavor
  actions?: ReactNode
}) {
  const router = useRouter()
  const stepCount = flavor.step_count ?? flavor.humor_flavor_steps?.[0]?.count ?? 0

  return (
    <div
      className="glass-panel"
      onClick={() => router.push(`/flavors/${flavor.id}`)}
      style={{
        padding: 24,
        borderRadius: 16,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 184,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 6px",
          }}
        >
          {flavor.slug}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: 0,
            minHeight: 38,
          }}
        >
          {flavor.description || "No description yet."}
        </p>
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        <span className="muted-label">{stepCount} steps</span>
        {actions ? <div>{actions}</div> : null}
      </div>
    </div>
  )
}
