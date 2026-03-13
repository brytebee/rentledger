import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUser } from "@/services/user"
import { createNotification } from "@/lib/notifications"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(`
      *,
      unit:units (
        name,
        property:properties (name, address)
      ),
      tenant:profiles (full_name, phone_number)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`[GET /api/maintenance/${id}] Error:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { status, priority, landlord_comment } = body

  // Fetch the request first to check ownership/permissions and get details for notification
  const { data: request, error: fetchError } = await supabase
    .from("maintenance_requests")
    .select("tenant_id, title, unit_id")
    .eq("id", id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  // Define update payload
  const update: any = {}
  if (status) update.status = status
  if (priority) update.priority = priority
  if (landlord_comment !== undefined) update.landlord_comment = landlord_comment
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("maintenance_requests")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`[PATCH /api/maintenance/${id}] Error:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger notification if status or comment changed
  if ((status || landlord_comment) && request.tenant_id) {
    let message = `Your maintenance request "${request.title}" has been updated.`
    if (status) message = `The status of your maintenance request "${request.title}" has been updated to ${status}.`
    if (landlord_comment) message += ` Landlord comment: "${landlord_comment}"`

    await createNotification({
      userId: request.tenant_id,
      title: "Maintenance Update",
      message: message,
      type: "system",
      data: { requestId: id, unitId: request.unit_id }
    })
  }

  return NextResponse.json({ request: data })
}
