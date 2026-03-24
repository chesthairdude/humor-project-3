import { FlavorListClient } from "@/components/FlavorListClient"
import type { HumorFlavor } from "@/lib/types"
import { getAuthorizedProfile } from "@/lib/auth"

export default async function FlavorsPage() {
  const { supabase } = await getAuthorizedProfile()

  const { data: flavors, error: flavorError } = await supabase
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false })

  const loadErrors: string[] = []
  if (flavorError) {
    loadErrors.push(`Failed to load humor flavors: ${flavorError.message}`)
  }

  const flavorIds = (flavors || []).map((flavor) => flavor.id)
  let stepCounts = new Map<string, number>()

  if (flavorIds.length > 0) {
    const { data: stepRows, error: stepError } = await supabase
      .from("humor_flavor_steps")
      .select("humor_flavor_id")
      .in("humor_flavor_id", flavorIds)

    if (stepError) {
      loadErrors.push(`Failed to load flavor step counts: ${stepError.message}`)
    } else {
      stepCounts = new Map<string, number>()
      for (const row of stepRows || []) {
        stepCounts.set(String(row.humor_flavor_id), (stepCounts.get(String(row.humor_flavor_id)) || 0) + 1)
      }
    }
  }

  const normalizedFlavors: HumorFlavor[] = (flavors || []).map((flavor) => ({
    ...flavor,
    step_count: stepCounts.get(String(flavor.id)) || 0,
  }))

  return (
    <FlavorListClient
      initialFlavors={normalizedFlavors}
      loadError={loadErrors.length > 0 ? loadErrors.join(" ") : null}
    />
  )
}
