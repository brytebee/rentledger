import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Fetch all active tenancies for this landlord
    const { data: tenancies, error: tenanciesError } = await supabase
      .from("tenancies")
      .select(`
        id,
        tenant_id,
        unit_id,
        next_due_date,
        rent_cycle,
        unit:units (
          name,
          rent_amount,
          property:properties (name)
        )
      `)
      .eq("status", "active")
      .in("unit_id", 
        (await supabase
          .from("units")
          .select("id")
          .in("property_id", 
            (await supabase
              .from("properties")
              .select("id")
              .eq("landlord_id", user.id)
            ).data?.map(p => p.id) || []
          )
        ).data?.map(u => u.id) || []
      )

    if (tenanciesError) throw tenanciesError

    const now = new Date()
    const results = { generated: 0, skipped: 0, errors: 0 }

    for (const tenancy of (tenancies || [])) {
      if (!tenancy.next_due_date) continue

      const dueDate = new Date(tenancy.next_due_date)
      
      // Check if we need to generate rent
      // For simplicity, we generate if the due date is in the past or within 5 days
      const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 5) {
        // Check if a pending payment already exists for this tenancy and due date
        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("tenancy_id", tenancy.id)
          .eq("status", "pending")
          .eq("payment_date", tenancy.next_due_date)
          .maybeSingle()

        if (!existingPayment) {
          // Generate pending payment
          const { error: insertError } = await supabase
            .from("payments")
            .insert({
              tenancy_id: tenancy.id,
              amount: tenancy.unit.rent_amount,
              status: "pending",
              payment_date: tenancy.next_due_date,
            })

          if (!insertError) {
            results.generated++
            
            // Notify tenant
            if (tenancy.tenant_id) {
              await createNotification({
                userId: tenancy.tenant_id,
                title: "Rent Generated",
                message: `New rent of ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(tenancy.unit.rent_amount)} is due on ${tenancy.next_due_date} for ${tenancy.unit.name}.`,
                type: "payment",
                data: { tenancyId: tenancy.id }
              })
            }
          } else {
            console.error("Insert error:", insertError)
            results.errors++
          }
        } else {
          results.skipped++
        }
      } else {
        results.skipped++
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("[POST /api/payments/generate] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
