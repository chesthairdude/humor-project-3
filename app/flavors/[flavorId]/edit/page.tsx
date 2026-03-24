import { notFound } from "next/navigation"

import { FlavorEditForm } from "@/components/FlavorEditForm"
import type { HumorFlavor } from "@/lib/types"
import { getAuthorizedProfile } from "@/lib/auth"

export default async function FlavorEditPage({
  params,
}: {
  params: { flavorId: string }
}) {
  const { supabase } = await getAuthorizedProfile()

  const { data: flavor } = await supabase
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc, modified_datetime_utc")
    .eq("id", params.flavorId)
    .single()

  if (!flavor) {
    notFound()
  }

  return <FlavorEditForm flavor={flavor as HumorFlavor} />
}
