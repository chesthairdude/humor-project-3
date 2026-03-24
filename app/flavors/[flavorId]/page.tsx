import { notFound } from "next/navigation"

import { StepEditor } from "@/components/StepEditor"
import { TestPanel } from "@/components/TestPanel"
import type { FlavorCaption, HumorFlavor, HumorFlavorStep } from "@/lib/types"
import { getAuthorizedProfile } from "@/lib/auth"

export default async function FlavorDetailPage({
  params,
}: {
  params: { flavorId: string }
}) {
  const { supabase } = await getAuthorizedProfile()

  const [{ data: flavor }, { data: steps }, { data: captions }] = await Promise.all([
    supabase
      .from("humor_flavors")
      .select("id, slug, description, created_datetime_utc")
      .eq("id", params.flavorId)
      .single(),
    supabase
      .from("humor_flavor_steps")
      .select("*")
      .eq("humor_flavor_id", params.flavorId)
      .order("step_order", { ascending: true }),
    supabase
      .from("captions")
      .select("id, caption_content, created_at, images(image_url)")
      .eq("humor_flavor_id", params.flavorId)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  if (!flavor) {
    notFound()
  }

  const normalizedCaptions: FlavorCaption[] = (captions || []).map((caption) => ({
    id: caption.id,
    caption_content: caption.caption_content,
    created_at: caption.created_at,
    images: Array.isArray(caption.images) ? caption.images[0] || null : caption.images,
  }))

  return (
    <div className="flavor-detail-grid">
      <div>
        <StepEditor
          flavor={flavor as HumorFlavor}
          initialSteps={(steps || []) as HumorFlavorStep[]}
          initialCaptions={normalizedCaptions}
        />
      </div>
      <div style={{ position: "sticky", top: 84 }}>
        <TestPanel flavorId={params.flavorId} />
      </div>
    </div>
  )
}
