import { notFound } from "next/navigation"

import { RecentOutputPanel } from "@/components/RecentOutputPanel"
import { StepEditor } from "@/components/StepEditor"
import { TestPanel } from "@/components/TestPanel"
import type {
  FlavorCaption,
  HumorFlavor,
  HumorFlavorStep,
  HumorFlavorStepType,
  LlmInputType,
  LlmModel,
  LlmOutputType,
} from "@/lib/types"
import { getAuthorizedProfile } from "@/lib/auth"

export default async function FlavorDetailPage({
  params,
}: {
  params: { flavorId: string }
}) {
  const { supabase } = await getAuthorizedProfile()

  const [
    { data: flavor },
    { data: steps, error: stepsError },
    { data: captions },
    { data: inputTypes, error: inputTypesError },
    { data: outputTypes, error: outputTypesError },
    { data: models, error: modelsError },
    { data: stepTypes, error: stepTypesError },
  ] = await Promise.all([
    supabase
      .from("humor_flavors")
      .select("id, slug, description, created_datetime_utc")
      .eq("id", params.flavorId)
      .single(),
    supabase
      .from("humor_flavor_steps")
      .select(
        "id, humor_flavor_id, order_by, llm_system_prompt, llm_user_prompt, description, llm_temperature, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, created_datetime_utc, modified_datetime_utc"
      )
      .eq("humor_flavor_id", params.flavorId)
      .order("order_by", { ascending: true }),
    supabase
      .from("captions")
      .select("id, content, created_datetime_utc, images(url)")
      .eq("humor_flavor_id", params.flavorId)
      .order("created_datetime_utc", { ascending: false })
      .limit(20),
    supabase.from("llm_input_types").select("id, slug, description").order("id", { ascending: true }),
    supabase.from("llm_output_types").select("id, slug, description").order("id", { ascending: true }),
    supabase
      .from("llm_models")
      .select("id, name, provider_model_id, is_temperature_supported")
      .order("id", { ascending: true }),
    supabase
      .from("humor_flavor_step_types")
      .select("id, slug, description")
      .order("id", { ascending: true }),
  ])

  if (!flavor) {
    notFound()
  }

  const normalizedCaptions: FlavorCaption[] = (captions || []).map((caption) => ({
    id: caption.id,
    content: caption.content,
    created_datetime_utc: caption.created_datetime_utc,
    images: Array.isArray(caption.images) ? caption.images[0] || null : caption.images,
  }))

  return (
    <div className="flavor-detail-grid">
      <div>
        <StepEditor
          flavor={flavor as HumorFlavor}
          initialSteps={(steps || []) as HumorFlavorStep[]}
          inputTypes={(inputTypes || []) as LlmInputType[]}
          outputTypes={(outputTypes || []) as LlmOutputType[]}
          models={(models || []) as LlmModel[]}
          stepTypes={(stepTypes || []) as HumorFlavorStepType[]}
          stepLoadError={
            [
              stepsError ? `Failed to load prompt chain: ${stepsError.message}` : null,
              inputTypesError ? `Failed to load input types: ${inputTypesError.message}` : null,
              outputTypesError ? `Failed to load output types: ${outputTypesError.message}` : null,
              modelsError ? `Failed to load models: ${modelsError.message}` : null,
              stepTypesError ? `Failed to load step types: ${stepTypesError.message}` : null,
            ]
              .filter(Boolean)
              .join(" ")
          }
        />
      </div>
      <div style={{ position: "sticky", top: 84, display: "grid", gap: 16 }}>
        <TestPanel flavorId={params.flavorId} />
        <RecentOutputPanel captions={normalizedCaptions} />
      </div>
    </div>
  )
}
