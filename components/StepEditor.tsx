"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Modal } from "@/components/Modal"
import type { FlavorCaption, HumorFlavor, HumorFlavorStep } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

type StepEditorProps = {
  flavor: HumorFlavor
  initialSteps: HumorFlavorStep[]
  initialCaptions: FlavorCaption[]
}

export function StepEditor({
  flavor,
  initialSteps,
  initialCaptions,
}: StepEditorProps) {
  const router = useRouter()
  const [steps, setSteps] = useState(initialSteps)
  const [captions] = useState(initialCaptions)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<HumorFlavorStep | null>(null)
  const [prompt, setPrompt] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const promptChainPreview = steps
    .sort((a, b) => a.step_order - b.step_order)
    .map((step, index) => `Step ${index + 1}\n${step.prompt}`)
    .join("\n\n")

  function openCreateModal() {
    setEditingStep(null)
    setPrompt("")
    setError("")
    setModalOpen(true)
  }

  function openEditModal(step: HumorFlavorStep) {
    setEditingStep(step)
    setPrompt(step.prompt)
    setError("")
    setModalOpen(true)
  }

  async function saveStep() {
    if (!prompt.trim()) {
      setError("Prompt is required.")
      return
    }

    setSaving(true)
    setError("")
    const supabase = createClient()

    if (editingStep) {
      const { data, error: updateError } = await supabase
        .from("humor_flavor_steps")
        .update({ prompt: prompt.trim() })
        .eq("id", editingStep.id)
        .select("*")
        .single()

      if (updateError || !data) {
        setSaving(false)
        setError(updateError?.message || "Failed to update step.")
        return
      }

      setSteps((current) =>
        current.map((step) => (step.id === data.id ? (data as HumorFlavorStep) : step))
      )
    } else {
      const nextOrder = steps.length > 0 ? Math.max(...steps.map((step) => step.step_order)) + 1 : 1
      const { data, error: createError } = await supabase
        .from("humor_flavor_steps")
        .insert({
          humor_flavor_id: flavor.id,
          prompt: prompt.trim(),
          step_order: nextOrder,
        })
        .select("*")
        .single()

      if (createError || !data) {
        setSaving(false)
        setError(createError?.message || "Failed to create step.")
        return
      }

      setSteps((current) =>
        [...current, data as HumorFlavorStep].sort((a, b) => a.step_order - b.step_order)
      )
    }

    setSaving(false)
    setModalOpen(false)
    router.refresh()
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    const currentIndex = steps.findIndex((step) => step.id === stepId)
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (swapIndex < 0 || swapIndex >= steps.length) {
      return
    }

    const current = steps[currentIndex]
    const swap = steps[swapIndex]
    const supabase = createClient()

    const [{ error: currentError }, { error: swapError }] = await Promise.all([
      supabase
        .from("humor_flavor_steps")
        .update({ step_order: swap.step_order })
        .eq("id", current.id),
      supabase
        .from("humor_flavor_steps")
        .update({ step_order: current.step_order })
        .eq("id", swap.id),
    ])

    if (currentError || swapError) {
      window.alert(currentError?.message || swapError?.message || "Failed to reorder step.")
      return
    }

    const updatedSteps = [...steps]
    updatedSteps[currentIndex] = { ...swap, step_order: current.step_order }
    updatedSteps[swapIndex] = { ...current, step_order: swap.step_order }
    setSteps(updatedSteps.sort((a, b) => a.step_order - b.step_order))
    router.refresh()
  }

  async function deleteStep(stepId: string) {
    const confirmed = window.confirm("Delete this step?")
    if (!confirmed) {
      return
    }

    const supabase = createClient()
    const { error: deleteError } = await supabase.from("humor_flavor_steps").delete().eq("id", stepId)

    if (deleteError) {
      window.alert(deleteError.message)
      return
    }

    setSteps((current) => current.filter((step) => step.id !== stepId))
    router.refresh()
  }

  return (
    <>
      <div className="glass-panel" style={{ borderRadius: 24, padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div>
            <p className="muted-label" style={{ margin: "0 0 8px" }}>
              Prompt Chain
            </p>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.04em" }}>{flavor.slug}</h1>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
              {flavor.description || "No description yet."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href={`/flavors/${flavor.id}/edit`}
              className="secondary-button"
              style={{ padding: "12px 16px", fontWeight: 600 }}
            >
              Edit flavor
            </Link>
            <button
              onClick={openCreateModal}
              className="primary-button"
              style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer" }}
            >
              Add step
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: 18,
            padding: 18,
            borderRadius: 16,
            background: "var(--input-bg)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="muted-label" style={{ margin: "0 0 10px" }}>
            Exact Prompt Chain
          </p>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "var(--font-family-sans)",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--text-primary)",
            }}
          >
            {promptChainPreview || "No steps yet."}
          </pre>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {steps.map((step, index) => {
            return (
              <div
                key={step.id}
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: "var(--surface-strong)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "var(--button-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "var(--text-primary)",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {step.prompt}
                  </p>
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                    Exact step text from `humor_flavor_steps.prompt`
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => moveStep(step.id, "up")}
                    disabled={index === 0}
                    className="secondary-button"
                    style={{ width: 36, height: 32, padding: 0, cursor: "pointer" }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStep(step.id, "down")}
                    disabled={index === steps.length - 1}
                    className="secondary-button"
                    style={{ width: 36, height: 32, padding: 0, cursor: "pointer" }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => openEditModal(step)}
                    className="secondary-button"
                    style={{ width: 36, height: 32, padding: 0, cursor: "pointer" }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteStep(step.id)}
                    className="secondary-button"
                    style={{
                      width: 36,
                      height: 32,
                      padding: 0,
                      cursor: "pointer",
                      color: "var(--accent-negative)",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}

          {steps.length === 0 ? (
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                border: "1px dashed var(--input-border)",
                color: "var(--text-secondary)",
                textAlign: "center",
              }}
            >
              No steps yet. Add the first instruction for this flavor.
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: 24, padding: 24, marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <p className="muted-label" style={{ margin: "0 0 8px" }}>
            Recent Output
          </p>
          <h2 style={{ margin: 0, fontSize: 22 }}>Captions produced by this flavor</h2>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
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
                gridTemplateColumns: "96px 1fr",
                gap: 14,
                padding: 14,
                borderRadius: 14,
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
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
                {caption.images?.image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                    src={caption.images.image_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </>
                ) : null}
              </div>
              <div>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{caption.caption_content}</p>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {new Date(caption.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingStep ? "Edit step" : "Create step"}
        description={
          editingStep
            ? "Edit the exact stored prompt for this step."
            : "Add the next exact prompt in this humor flavor chain."
        }
        onClose={() => {
          if (!saving) {
            setModalOpen(false)
          }
        }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
              Prompt
            </label>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </div>

          {error ? <div className="danger-banner">{error}</div> : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setModalOpen(false)}
              className="secondary-button"
              style={{ padding: "12px 16px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={saveStep}
              disabled={saving}
              className="primary-button"
              style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer" }}
            >
              {saving ? "Saving..." : editingStep ? "Save changes" : "Create step"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
