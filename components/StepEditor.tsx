"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Modal } from "@/components/Modal"
import type {
  HumorFlavor,
  HumorFlavorStep,
  HumorFlavorStepType,
  LlmInputType,
  LlmModel,
  LlmOutputType,
} from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

type StepEditorProps = {
  flavor: HumorFlavor
  initialSteps: HumorFlavorStep[]
  inputTypes: LlmInputType[]
  outputTypes: LlmOutputType[]
  models: LlmModel[]
  stepTypes: HumorFlavorStepType[]
  stepLoadError?: string | null
}

function getDuplicateSlug(sourceSlug: string, existingSlugs: string[]) {
  const normalizedSlugs = new Set(existingSlugs.map((slug) => slug.trim().toLowerCase()))
  let nextSlug = `copy-of-${sourceSlug.trim()}`

  while (normalizedSlugs.has(nextSlug.toLowerCase())) {
    nextSlug = `copy-of-${nextSlug}`
  }

  return nextSlug
}

function getDefaultStepTypeId(stepTypes: HumorFlavorStepType[], nextOrder: number) {
  const slug =
    nextOrder === 1 ? "celebrity-recognition" : nextOrder === 2 ? "image-description" : "general"

  return stepTypes.find((stepType) => stepType.slug === slug)?.id ?? stepTypes[0]?.id ?? 0
}

function getDefaultInputTypeId(inputTypes: LlmInputType[], stepTypeSlug?: string) {
  const slug = stepTypeSlug === "celebrity-recognition" ? "image-and-text" : "text-only"
  return inputTypes.find((inputType) => inputType.slug === slug)?.id ?? inputTypes[0]?.id ?? 0
}

function getDefaultOutputTypeId(outputTypes: LlmOutputType[], nextOrder: number) {
  const slug = nextOrder >= 3 ? "array" : "string"
  return outputTypes.find((outputType) => outputType.slug === slug)?.id ?? outputTypes[0]?.id ?? 0
}

function getDefaultModelId(models: LlmModel[]) {
  return (
    models.find((model) => model.provider_model_id === "gpt-4.1-2025-04-14")?.id ??
    models.find((model) => model.name === "GPT-4.1")?.id ??
    models[0]?.id ??
    0
  )
}

export function StepEditor({
  flavor,
  initialSteps,
  inputTypes,
  outputTypes,
  models,
  stepTypes,
  stepLoadError,
}: StepEditorProps) {
  const router = useRouter()
  const [steps, setSteps] = useState(initialSteps)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<HumorFlavorStep | null>(null)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [userPrompt, setUserPrompt] = useState("")
  const [description, setDescription] = useState("")
  const [llmInputTypeId, setLlmInputTypeId] = useState(0)
  const [llmOutputTypeId, setLlmOutputTypeId] = useState(0)
  const [llmModelId, setLlmModelId] = useState(0)
  const [stepTypeId, setStepTypeId] = useState(0)
  const [saving, setSaving] = useState(false)
  const [duplicatingFlavor, setDuplicatingFlavor] = useState(false)
  const [deletingFlavor, setDeletingFlavor] = useState(false)
  const [error, setError] = useState("")

  function openCreateModal() {
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((step) => step.order_by)) + 1 : 1
    const defaultStepTypeId = getDefaultStepTypeId(stepTypes, nextOrder)
    const defaultStepTypeSlug = stepTypes.find((stepType) => stepType.id === defaultStepTypeId)?.slug

    setEditingStep(null)
    setSystemPrompt("")
    setUserPrompt("")
    setDescription("")
    setStepTypeId(defaultStepTypeId)
    setLlmInputTypeId(getDefaultInputTypeId(inputTypes, defaultStepTypeSlug))
    setLlmOutputTypeId(getDefaultOutputTypeId(outputTypes, nextOrder))
    setLlmModelId(getDefaultModelId(models))
    setError("")
    setModalOpen(true)
  }

  function openEditModal(step: HumorFlavorStep) {
    setEditingStep(step)
    setSystemPrompt(step.llm_system_prompt || "")
    setUserPrompt(step.llm_user_prompt || "")
    setDescription(step.description || "")
    setLlmInputTypeId(step.llm_input_type_id || inputTypes[0]?.id || 0)
    setLlmOutputTypeId(step.llm_output_type_id || outputTypes[0]?.id || 0)
    setLlmModelId(step.llm_model_id || models[0]?.id || 0)
    setStepTypeId(step.humor_flavor_step_type_id || stepTypes[0]?.id || 0)
    setError("")
    setModalOpen(true)
  }

  function handleStepTypeChange(nextStepTypeId: number) {
    const nextStepType = stepTypes.find((stepType) => stepType.id === nextStepTypeId)
    setStepTypeId(nextStepTypeId)
    setLlmInputTypeId(getDefaultInputTypeId(inputTypes, nextStepType?.slug))
  }

  async function saveStep() {
    if (!systemPrompt.trim() && !userPrompt.trim()) {
      setError("At least one prompt is required.")
      return
    }

    if (!llmInputTypeId || !llmOutputTypeId || !llmModelId || !stepTypeId) {
      setError("Input type, output type, model, and step type are all required.")
      return
    }

    setSaving(true)
    setError("")
    const supabase = createClient()

    if (editingStep) {
      const { data, error: updateError } = await supabase
        .from("humor_flavor_steps")
        .update({
          llm_system_prompt: systemPrompt.trim() || null,
          llm_user_prompt: userPrompt.trim() || null,
          description: description.trim() || null,
          llm_input_type_id: llmInputTypeId,
          llm_output_type_id: llmOutputTypeId,
          llm_model_id: llmModelId,
          humor_flavor_step_type_id: stepTypeId,
          modified_datetime_utc: new Date().toISOString(),
        })
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
      const nextOrder = steps.length > 0 ? Math.max(...steps.map((step) => step.order_by)) + 1 : 1
      const { data, error: createError } = await supabase
        .from("humor_flavor_steps")
        .insert({
          humor_flavor_id: flavor.id,
          llm_system_prompt: systemPrompt.trim() || null,
          llm_user_prompt: userPrompt.trim() || null,
          description: description.trim() || null,
          order_by: nextOrder,
          llm_input_type_id: llmInputTypeId,
          llm_output_type_id: llmOutputTypeId,
          llm_model_id: llmModelId,
          humor_flavor_step_type_id: stepTypeId,
          created_datetime_utc: new Date().toISOString(),
          modified_datetime_utc: new Date().toISOString(),
        })
        .select("*")
        .single()

      if (createError || !data) {
        setSaving(false)
        setError(createError?.message || "Failed to create step.")
        return
      }

      setSteps((current) =>
        [...current, data as HumorFlavorStep].sort((a, b) => a.order_by - b.order_by)
      )
    }

    setSaving(false)
    setModalOpen(false)
    router.refresh()
  }

  async function moveStep(stepId: number, direction: "up" | "down") {
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
        .update({ order_by: swap.order_by, modified_datetime_utc: new Date().toISOString() })
        .eq("id", current.id),
      supabase
        .from("humor_flavor_steps")
        .update({ order_by: current.order_by, modified_datetime_utc: new Date().toISOString() })
        .eq("id", swap.id),
    ])

    if (currentError || swapError) {
      window.alert(currentError?.message || swapError?.message || "Failed to reorder step.")
      return
    }

    const updatedSteps = [...steps]
    updatedSteps[currentIndex] = { ...swap, order_by: current.order_by }
    updatedSteps[swapIndex] = { ...current, order_by: swap.order_by }
    setSteps(updatedSteps.sort((a, b) => a.order_by - b.order_by))
    router.refresh()
  }

  async function deleteStep(stepId: number) {
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

  async function duplicateFlavor() {
    setDuplicatingFlavor(true)
    const supabase = createClient()
    const timestamp = new Date().toISOString()

    const { data: flavors, error: flavorsError } = await supabase.from("humor_flavors").select("slug")

    if (flavorsError) {
      setDuplicatingFlavor(false)
      window.alert(flavorsError.message)
      return
    }

    const nextSlug = getDuplicateSlug(
      flavor.slug,
      (flavors || []).map((currentFlavor) => currentFlavor.slug)
    )

    const { data: createdFlavor, error: createError } = await supabase
      .from("humor_flavors")
      .insert({
        slug: nextSlug,
        description: flavor.description,
        created_datetime_utc: timestamp,
        modified_datetime_utc: timestamp,
      })
      .select("id")
      .single()

    if (createError || !createdFlavor) {
      setDuplicatingFlavor(false)
      window.alert(createError?.message || "Failed to duplicate flavor.")
      return
    }

    if (steps.length > 0) {
      const { error: stepInsertError } = await supabase.from("humor_flavor_steps").insert(
        steps.map((step) => ({
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
        setDuplicatingFlavor(false)
        window.alert(stepInsertError.message)
        return
      }
    }

    setDuplicatingFlavor(false)
    router.push(`/flavors/${createdFlavor.id}`)
    router.refresh()
  }

  async function deleteFlavor() {
    const confirmed = window.confirm("Delete this flavor and its steps?")
    if (!confirmed) {
      return
    }

    setDeletingFlavor(true)
    const supabase = createClient()
    const { error: deleteError } = await supabase.from("humor_flavors").delete().eq("id", flavor.id)

    if (deleteError) {
      setDeletingFlavor(false)
      window.alert(deleteError.message)
      return
    }

    router.push("/flavors")
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
              Edit name
            </Link>
            <button
              onClick={openCreateModal}
              className="primary-button"
              style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer" }}
            >
              Add step
            </button>
            <button
              onClick={duplicateFlavor}
              disabled={duplicatingFlavor || deletingFlavor}
              className="secondary-button"
              style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer" }}
            >
              {duplicatingFlavor ? "Duplicating..." : "Duplicate"}
            </button>
            <button
              onClick={deleteFlavor}
              disabled={duplicatingFlavor || deletingFlavor}
              className="secondary-button"
              style={{
                padding: "12px 16px",
                fontWeight: 600,
                cursor: "pointer",
                color: "var(--accent-negative)",
              }}
            >
              {deletingFlavor ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {stepLoadError ? (
          <div className="danger-banner" style={{ marginBottom: 18 }}>
            {stepLoadError}
          </div>
        ) : null}

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
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div>
                      <p className="muted-label" style={{ margin: "0 0 6px" }}>
                        System Prompt
                      </p>
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
                        {step.llm_system_prompt || "No system prompt."}
                      </p>
                    </div>
                    <div>
                      <p className="muted-label" style={{ margin: "0 0 6px" }}>
                        User Prompt
                      </p>
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
                        {step.llm_user_prompt || "No user prompt."}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                    Exact stored values from `humor_flavor_steps.llm_system_prompt` and
                    `humor_flavor_steps.llm_user_prompt`
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

      <Modal
        open={modalOpen}
        title={editingStep ? "Edit step" : "Create step"}
        description={
          editingStep
            ? "Edit the exact stored system and user prompts for this step."
            : "Add the next exact system and user prompts in this humor flavor chain."
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
              Step Description
            </label>
            <input value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div>
              <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
                Step Type
              </label>
              <select
                value={stepTypeId}
                onChange={(event) => handleStepTypeChange(Number(event.target.value))}
                style={{ width: "100%" }}
              >
                {stepTypes.map((stepType) => (
                  <option key={stepType.id} value={stepType.id}>
                    {stepType.slug}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
                Model
              </label>
              <select
                value={llmModelId}
                onChange={(event) => setLlmModelId(Number(event.target.value))}
                style={{ width: "100%" }}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div>
              <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
                Input Type
              </label>
              <select
                value={llmInputTypeId}
                onChange={(event) => setLlmInputTypeId(Number(event.target.value))}
                style={{ width: "100%" }}
              >
                {inputTypes.map((inputType) => (
                  <option key={inputType.id} value={inputType.id}>
                    {inputType.slug}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
                Output Type
              </label>
              <select
                value={llmOutputTypeId}
                onChange={(event) => setLlmOutputTypeId(Number(event.target.value))}
                style={{ width: "100%" }}
              >
                {outputTypes.map((outputType) => (
                  <option key={outputType.id} value={outputType.id}>
                    {outputType.slug}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
              LLM System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
            />
          </div>

          <div>
            <label className="muted-label" style={{ display: "block", marginBottom: 8 }}>
              LLM User Prompt
            </label>
            <textarea value={userPrompt} onChange={(event) => setUserPrompt(event.target.value)} />
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
