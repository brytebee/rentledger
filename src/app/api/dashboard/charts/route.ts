import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get last 6 months list
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        revenue: 0,
        expenses: 0
      })
    }

    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

    // 1. Fetch verified payments for last 6 months
    const { data: payments } = await supabase
      .from("payments")
      .select(`
        amount,
        payment_date,
        tenancies!inner (
          units!inner (
            properties!inner (landlord_id)
          )
        )
      `)
      .eq("status", "verified")
      .eq("tenancies.units.properties.landlord_id", user.id)
      .gte("payment_date", startDate)

    // 2. Fetch expenses for last 6 months
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount, date")
      .eq("landlord_id", user.id)
      .gte("date", startDate)

    // Aggregate data
    months.forEach(m => {
      // Revenue
      payments?.forEach(p => {
        const pDate = new Date(p.payment_date || "")
        if (pDate.getMonth() + 1 === m.month && pDate.getFullYear() === m.year) {
          m.revenue += Number(p.amount)
        }
      })

      // Expenses
      expenses?.forEach(e => {
        const eDate = new Date(e.date)
        if (eDate.getMonth() + 1 === m.month && eDate.getFullYear() === m.year) {
          m.expenses += Number(e.amount)
        }
      })
    })

    return NextResponse.json({ chartData: months })
  } catch (err: any) {
    console.error("[dashboard/charts] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
