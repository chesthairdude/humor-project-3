"use client"

import { useRouter } from "next/navigation"

import type { HumorFlavor } from "@/lib/types"

export function FlavorCard({ flavor }: { flavor: HumorFlavor }) {
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
      }}
    >
      <h2
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 6px",
        }}
      >
        {flavor.name}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: "0 0 16px",
          minHeight: 38,
        }}
      >
        {flavor.description || "No description yet."}
      </p>
      <span className="muted-label">{stepCount} steps</span>
    </div>
  )
}
