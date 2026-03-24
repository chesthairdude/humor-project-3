import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", origin))
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth", origin))
  }

  const user = data.user
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single()

  const isAuthorized = profile?.is_superadmin || profile?.is_matrix_admin
  if (!isAuthorized) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=unauthorized", origin))
  }

  return NextResponse.redirect(new URL("/flavors", origin))
}
