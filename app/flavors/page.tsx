import { FlavorListClient } from "@/components/FlavorListClient"
import type { HumorFlavor } from "@/lib/types"
import { getAuthorizedProfile } from "@/lib/auth"

export default async function FlavorsPage() {
  const { supabase } = await getAuthorizedProfile()

  const { data } = await supabase
    .from("humor_flavors")
    .select("id, name, description, created_at, humor_flavor_steps(count)")
    .order("created_at", { ascending: false })

  return <FlavorListClient initialFlavors={(data || []) as HumorFlavor[]} />
}
