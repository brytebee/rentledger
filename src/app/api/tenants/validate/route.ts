import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { normalizePhoneNumber } from "@/lib/utils/phone"

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const phone = req.nextUrl.searchParams.get("phone")
  if (!phone?.trim()) {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  const normalizedPhone = normalizePhoneNumber(phone)

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone_number", normalizedPhone)
    .maybeSingle()

  if (error) {
    console.error("[validate] DB error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!profile) {
    // No profile found
    return NextResponse.json({ valid: false }, { status: 200 })
  }

  return NextResponse.json({ valid: true }, { status: 200 })
}
