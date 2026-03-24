import { FlavorListClient } from "@/components/FlavorListClient"
import type { HumorFlavor } from "@/lib/types"
import { getAuthorizedProfile } from "@/lib/auth"

export default async function FlavorsPage() {
  const { supabase } = await getAuthorizedProfile()

  const { data: flavors, error: flavorError } = await supabase
    .from("humor_flavors")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false })

  if (flavorError) {
    throw new Error(`Failed to load humor flavors: ${flavorError.message}`)
  }

  const flavorIds = (flavors || []).map((flavor) => flavor.id)
  let stepCounts = new Map<string, number>()

  if (flavorIds.length > 0) {
    const { data: stepRows, error: stepError } = await supabase
      .from("humor_flavor_steps")
      .select("flavor_id")
      .in("flavor_id", flavorIds)

    if (stepError) {
      throw new Error(`Failed to load flavor step counts: ${stepError.message}`)
    }

    stepCounts = new Map<string, number>()
    for (const row of stepRows || []) {
      stepCounts.set(row.flavor_id, (stepCounts.get(row.flavor_id) || 0) + 1)
    }
  }

  const normalizedFlavors: HumorFlavor[] = (flavors || []).map((flavor) => ({
    ...flavor,
    step_count: stepCounts.get(flavor.id) || 0,
  }))

  return <FlavorListClient initialFlavors={normalizedFlavors} />
}
