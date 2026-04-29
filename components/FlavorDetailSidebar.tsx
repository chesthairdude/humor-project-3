"use client"

import { useState } from "react"

import { RecentOutputPanel } from "@/components/RecentOutputPanel"
import { TestPanel } from "@/components/TestPanel"
import type { FlavorCaption } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

function normalizeCaptions(captions: any[] | null | undefined): FlavorCaption[] {
  return (captions || []).map((caption) => ({
    id: caption.id,
    content: caption.content,
    created_datetime_utc: caption.created_datetime_utc,
    images: Array.isArray(caption.images) ? caption.images[0] || null : caption.images,
  }))
}

export function FlavorDetailSidebar({
  flavorId,
  initialCaptions,
}: {
  flavorId: string
  initialCaptions: FlavorCaption[]
}) {
  const [captions, setCaptions] = useState(initialCaptions)

  async function refreshCaptions() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("captions")
      .select("id, content, created_datetime_utc, images(url)")
      .eq("humor_flavor_id", flavorId)
      .order("created_datetime_utc", { ascending: false })
      .limit(20)

    if (!error) {
      setCaptions(normalizeCaptions(data))
    }
  }

  return (
    <div className="detail-sidebar">
      <TestPanel flavorId={flavorId} onGenerationComplete={refreshCaptions} />
      <RecentOutputPanel captions={captions} />
    </div>
  )
}
