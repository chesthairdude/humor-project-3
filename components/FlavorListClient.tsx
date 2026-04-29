"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { FlavorCard } from "@/components/FlavorCard"
import { Modal } from "@/components/Modal"
import type { HumorFlavor } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

function getDuplicateSlug(sourceSlug: string, existingSlugs: string[]) {
  const normalizedSlugs = new Set(existingSlugs.map((slug) => slug.trim().toLowerCase()))
  let nextSlug = `copy-of-${sourceSlug.trim()}`

  while (normalizedSlugs.has(nextSlug.toLowerCase())) {
    nextSlug = `copy-of-${nextSlug}`
  }

  return nextSlug
}

export function FlavorListClient({
  initialFlavors,
  loadError,
}: {
  initialFlavors: HumorFlavor[]
  loadError?: string | null
}) {
  const router = useRouter()
  const [flavors, setFlavors] = useState(initialFlavors)
  const [searchQuery, setSearchQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [duplicatingFlavorId, setDuplicatingFlavorId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const filteredFlavors = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return flavors
    }

    return flavors.filter((flavor) => {
      const slugMatch = flavor.slug.toLowerCase().includes(normalizedQuery)
      const descriptionMatch = (flavor.description || "").toLowerCase().includes(normalizedQuery)
      return slugMatch || descriptionMatch
    })
  }, [deferredSearchQuery, flavors])

  async function createFlavor() {
    if (!slug.trim()) {
      setError("Flavor slug is required.")
      return
    }

    setSaving(true)
    setError("")
    const supabase = createClient()
    const { data, error: createError } = await supabase
      .from("humor_flavors")
      .insert({
        slug: slug.trim(),
        description: description.trim() || null,
        created_datetime_utc: new Date().toISOString(),
        modified_datetime_utc: new Date().toISOString(),
      })
      .select("id, slug, description, created_datetime_utc")
      .single()

    if (createError || !data) {
      setSaving(false)
      setError(createError?.message || "Failed to create flavor.")
      return
    }

    setFlavors((current) => [{ ...data, humor_flavor_steps: [{ count: 0 }] }, ...current])
    setSlug("")
    setDescription("")
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  async function deleteFlavor(id: number) {
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

  async function duplicateFlavor(flavor: HumorFlavor) {
    setDuplicatingFlavorId(flavor.id)
    setError("")
    const supabase = createClient()
    const timestamp = new Date().toISOString()
    const nextSlug = getDuplicateSlug(
      flavor.slug,
      flavors.map((currentFlavor) => currentFlavor.slug)
    )

    const { data: createdFlavor, error: createError } = await supabase
      .from("humor_flavors")
      .insert({
        slug: nextSlug,
        description: flavor.description,
        created_datetime_utc: timestamp,
        modified_datetime_utc: timestamp,
      })
      .select("id, slug, description, created_datetime_utc, modified_datetime_utc")
      .single()

    if (createError || !createdFlavor) {
      setDuplicatingFlavorId(null)
      window.alert(createError?.message || "Failed to duplicate flavor.")
      return
    }

    const { data: sourceSteps, error: sourceStepsError } = await supabase
      .from("humor_flavor_steps")
      .select(
        "order_by, llm_system_prompt, llm_user_prompt, description, llm_temperature, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id"
      )
      .eq("humor_flavor_id", flavor.id)
      .order("order_by", { ascending: true })

    if (sourceStepsError) {
      await supabase.from("humor_flavors").delete().eq("id", createdFlavor.id)
      setDuplicatingFlavorId(null)
      window.alert(sourceStepsError.message)
      return
    }

    if ((sourceSteps || []).length > 0) {
      const { error: stepInsertError } = await supabase.from("humor_flavor_steps").insert(
        (sourceSteps || []).map((step) => ({
          humor_flavor_id: createdFlavor.id,
          order_by: step.order_by,
          llm_system_prompt: step.llm_system_prompt,
          llm_user_prompt: step.llm_user_prompt,
          description: step.description,
          llm_temperature: step.llm_temperature,
          llm_input_type_id: step.llm_input_type_id,
          llm_output_type_id: step.llm_output_type_id,
          llm_model_id: step.llm_model_id,
          humor_flavor_step_type_id: step.humor_flavor_step_type_id,
          created_datetime_utc: timestamp,
          modified_datetime_utc: timestamp,
        }))
      )

      if (stepInsertError) {
        await supabase.from("humor_flavor_steps").delete().eq("humor_flavor_id", createdFlavor.id)
        await supabase.from("humor_flavors").delete().eq("id", createdFlavor.id)
        setDuplicatingFlavorId(null)
        window.alert(stepInsertError.message)
        return
      }
    }

    setFlavors((current) => [
      {
        ...createdFlavor,
        step_count: sourceSteps?.length || 0,
      },
      ...current,
    ])
    setDuplicatingFlavorId(null)
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

      <div
        className="glass-panel"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 16,
          borderRadius: 18,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search humor flavors by name or description"
          aria-label="Search humor flavors"
          style={{ flex: "1 1 320px", minWidth: 0 }}
        />
        <span className="muted-label" style={{ color: "var(--text-secondary)" }}>
          {filteredFlavors.length} of {flavors.length}
        </span>
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
      ) : filteredFlavors.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: 28,
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          <p className="muted-label" style={{ margin: "0 0 10px" }}>
            No matching flavors
          </p>
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            No humor flavors matched &quot;{searchQuery.trim()}&quot;. Try a different name or
            keyword from the description.
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
          {filteredFlavors.map((flavor) => (
            <FlavorCard
              key={flavor.id}
              flavor={flavor}
              actions={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      duplicateFlavor(flavor)
                    }}
                    disabled={duplicatingFlavorId === flavor.id}
                    className="secondary-button"
                    style={{
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: duplicatingFlavorId === flavor.id ? "default" : "pointer",
                    }}
                  >
                    {duplicatingFlavorId === flavor.id ? "Duplicating..." : "Duplicate"}
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteFlavor(flavor.id)
                    }}
                    className="secondary-button"
                    style={{
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
              }
            />
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
              Slug
            </label>
            <input value={slug} onChange={(event) => setSlug(event.target.value)} />
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
