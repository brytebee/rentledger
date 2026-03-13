import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"

function calculateNextDueDate(startDate: string, rentCycle: string | null): string {
  const date = new Date(startDate);
  if (rentCycle === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString();
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the tenant profile for full_name and role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "tenant") {
    return NextResponse.json({ error: "Only tenants can respond to invitations" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { tenancyId, action } = body

    if (!tenancyId || !action) {
      return NextResponse.json({ error: "tenancyId and action required" }, { status: 400 })
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const newStatus = action === "accept" ? "active" : "rejected"

    if (action === "accept") {
      // Terminate any existing active tenancies for this tenant
      const { error: terminateError } = await supabase
        .from("tenancies")
        .update({ status: "terminated" })
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .neq("id", tenancyId)

      if (terminateError) {
        console.error("Terminate error:", terminateError)
        return NextResponse.json({ error: "Failed to terminate existing tenancy" }, { status: 500 })
      }

      const { data: pendingTenancy, error: fetchError } = await supabase
        .from("tenancies")
        .select("start_date, rent_cycle")
        .eq("id", tenancyId)
        .single()

      if (fetchError || !pendingTenancy) {
        return NextResponse.json({ error: "Tenancy not found" }, { status: 404 })
      }

      const nextDueDate = calculateNextDueDate(
        pendingTenancy.start_date,
        pendingTenancy.rent_cycle
      )

      const { data: updatedRows, error: updateError } = await supabase
        .from("tenancies")
        .update({ 
          status: newStatus,
          next_due_date: nextDueDate,
        })
        .eq("id", tenancyId)
        .eq("tenant_id", user.id)
        .eq("status", "pending")
        .select("id")

      if (updateError) {
        console.error("[respond] Accept update error:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      if (!updatedRows || updatedRows.length === 0) {
        console.error("[respond] Accept: 0 rows updated — RLS may be blocking the update. Check FIX_TENANCY_RLS.sql has been run.")
        return NextResponse.json({ error: "Could not update tenancy — database permission denied. Please contact your administrator." }, { status: 403 })
      }
    } else {
      const { data: rejectedRows, error: updateError } = await supabase
        .from("tenancies")
        .update({ status: newStatus })
        .eq("id", tenancyId)
        .eq("tenant_id", user.id)
        .eq("status", "pending")
        .select("id")

      if (updateError) {
        console.error("[respond] Reject update error:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      if (!rejectedRows || rejectedRows.length === 0) {
        console.error("[respond] Reject: 0 rows updated — RLS may be blocking the update. Check FIX_TENANCY_RLS.sql has been run.")
        return NextResponse.json({ error: "Could not update tenancy — database permission denied. Please contact your administrator." }, { status: 403 })
      }
    }

    // Notify the landlord
    const { data: tenancy } = await supabase
      .from("tenancies")
      .select(`
        id,
        units!inner(
          properties!inner(landlord_id, name),
          name
        )
      `)
      .eq("id", tenancyId)
      .single()

    if (tenancy) {
      const landlordId = (tenancy.units as any).properties.landlord_id
      const unitName = (tenancy.units as any).name
      const propertyName = (tenancy.units as any).properties.name
      const tenantName = profile?.full_name || "A tenant"

      await createNotification({
        userId: landlordId,
        title: action === "accept" ? "Tenancy Accepted" : "Tenancy Declined",
        message: `${tenantName} has ${action === "accept" ? "accepted" : "declined"} the invitation to Unit ${unitName} at ${propertyName}.`,
        type: "system",
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST /api/tenancies/respond]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
