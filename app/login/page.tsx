import { redirect } from "next/navigation"

import { LoginCard } from "@/components/LoginCard"
import { createClient } from "@/utils/supabase/server"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_superadmin, is_matrix_admin")
      .eq("id", user.id)
      .single()

    if (profile?.is_superadmin || profile?.is_matrix_admin) {
      redirect("/flavors")
    }
  }

  return <LoginCard error={searchParams.error} />
}
