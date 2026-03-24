"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { FlavorCard } from "@/components/FlavorCard"
import { Modal } from "@/components/Modal"
import type { HumorFlavor } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

export function FlavorListClient({
  initialFlavors,
  loadError,
}: {
  initialFlavors: HumorFlavor[]
  loadError?: string | null
}) {
  const router = useRouter()
  const [flavors, setFlavors] = useState(initialFlavors)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function createFlavor() {
    if (!name.trim()) {
      setError("Flavor name is required.")
      return
    }

    setSaving(true)
    setError("")
    const supabase = createClient()
    const { data, error: createError } = await supabase
      .from("humor_flavors")
      .insert({ name: name.trim(), description: description.trim() || null })
      .select("id, name, description, created_at")
      .single()

    if (createError || !data) {
      setSaving(false)
      setError(createError?.message || "Failed to create flavor.")
      return
    }

    setFlavors((current) => [{ ...data, humor_flavor_steps: [{ count: 0 }] }, ...current])
    setName("")
    setDescription("")
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  async function deleteFlavor(id: string) {
    const confirmed = window.confirm("Delete this flavor and its steps?")
    if (!confirmed) {
      return
    }

    const supabase = createClient()
    const { error: deleteError } = await supabase.from("humor_flavors").delete().eq("id", id)

    if (deleteError) {
      window.alert(deleteError.message)
      return
    }

    setFlavors((current) => current.filter((flavor) => flavor.id !== id))
    router.refresh()
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p className="muted-label" style={{ margin: "0 0 8px" }}>
            Flavor Library
          </p>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1, letterSpacing: "-0.04em" }}>
            Humor flavors
          </h1>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="primary-button"
          style={{ padding: "14px 22px", fontWeight: 600, cursor: "pointer" }}
        >
          Create new flavor
        </button>
      </div>

      {loadError ? (
        <div className="danger-banner" style={{ marginBottom: 18 }}>
          {loadError}
        </div>
      ) : null}

      {flavors.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: 28,
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          <p className="muted-label" style={{ margin: "0 0 10px" }}>
            No flavors yet
          </p>
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            No humor flavors were returned from Supabase. If you expected existing data here,
            check your deployed env vars and Supabase row-level security policies, then refresh.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {flavors.map((flavor) => (
            <div key={flavor.id} style={{ position: "relative" }}>
              <FlavorCard flavor={flavor} />
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  deleteFlavor(flavor.id)
                }}
                className="secondary-button"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--accent-negative)",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title="Create humor flavor"
        description="Add a new flavor and define its prompt steps next."
        onClose={() => {
          if (!saving) {
            setOpen(false)
          }
        }}
      >
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
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {error ? <div className="danger-banner">{error}</div> : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setOpen(false)}
              className="secondary-button"
              style={{ padding: "12px 16px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={createFlavor}
              disabled={saving}
              className="primary-button"
              style={{ padding: "12px 16px", cursor: "pointer", fontWeight: 600 }}
            >
              {saving ? "Saving..." : "Save flavor"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
