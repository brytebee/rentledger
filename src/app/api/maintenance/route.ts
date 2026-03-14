import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUser } from "@/services/user"
import { createNotification } from "@/lib/notifications"

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  const role = profile?.role || "tenant"

  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")

  let query = supabase
    .from("maintenance_requests")
    .select(`
      *,
      unit:units (
        name,
        property:properties (name)
      ),
      tenant:profiles (full_name)
    `)
    .order("created_at", { ascending: false })

  if (role === "tenant") {
    query = query.eq("tenant_id", user.id)
  }

  if (status && status !== "all") {
    query = query.eq("status", status as any)
  }
  if (priority && priority !== "all") {
    query = query.eq("priority", priority as any)
  }

  const { data, error } = await query

  if (error) {
    console.error("[GET /api/maintenance] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "tenant") {
    return NextResponse.json({ error: "Only tenants can create maintenance requests" }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, unit_id, priority, images } = body

  if (!title || !description || !unit_id) {
    return NextResponse.json({ error: "Title, description, and unit_id are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert({
      tenant_id: user.id,
      unit_id,
      title,
      description,
      priority: priority || "medium",
      images: images || [],
    })
    .select()
    .single()

  if (error) {
    console.error("[POST /api/maintenance] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify the landlord
  try {
    const { data: unitInfo } = await supabase
      .from("units")
      .select(`
        name,
        property:properties (
          landlord_id,
          name
        )
      `)
      .eq("id", unit_id)
      .single()

    const landlordId = (unitInfo?.property as any)?.landlord_id
    if (landlordId) {
      await createNotification({
        userId: landlordId,
        title: "New Maintenance Request",
        message: `${profile.full_name} submitted a new request: "${title}" for ${unitInfo?.name} at ${(unitInfo?.property as any)?.name}.`,
        type: "system",
        data: { requestId: data.id, unitId: unit_id }
      })
    }
  } catch (notifyError) {
    console.error("[POST /api/maintenance] Notification Error:", notifyError)
    // Don't fail the request if notification fails
  }

  return NextResponse.json({ request: data }, { status: 201 })
}
