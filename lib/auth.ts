import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"
import type { Profile } from "@/lib/types"

export async function getAuthorizedProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single<Profile>()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    redirect("/login?error=unauthorized")
  }

  return { supabase, user, profile }
}
