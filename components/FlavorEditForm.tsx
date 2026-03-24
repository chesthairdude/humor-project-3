"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import type { HumorFlavor } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

export function FlavorEditForm({ flavor }: { flavor: HumorFlavor }) {
  const router = useRouter()
  const [name, setName] = useState(flavor.name)
  const [description, setDescription] = useState(flavor.description || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function saveFlavor() {
    if (!name.trim()) {
      setError("Flavor name is required.")
      return
    }

    setSaving(true)
    setError("")
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("humor_flavors")
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq("id", flavor.id)

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    router.push(`/flavors/${flavor.id}`)
    router.refresh()
  }

  return (
    <div className="glass-panel" style={{ borderRadius: 24, padding: 28, maxWidth: 760 }}>
      <div style={{ marginBottom: 20 }}>
        <p className="muted-label" style={{ margin: "0 0 8px" }}>
          Flavor Settings
        </p>
        <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.04em" }}>Edit flavor</h1>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
            Name
          </label>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div>
          <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
            Description
          </label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        {error ? <div className="danger-banner">{error}</div> : null}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => router.push(`/flavors/${flavor.id}`)}
            className="secondary-button"
            style={{ padding: "12px 16px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={saveFlavor}
            disabled={saving}
            className="primary-button"
            style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
