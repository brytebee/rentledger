import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      property:properties (name)
    `)
    .eq("landlord_id", user.id)
    .order("date", { ascending: false })

  if (error) {
    console.error("[GET /api/expenses] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expenses: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { amount, category, description, date, property_id } = body

  if (!amount || !category || !date) {
    return NextResponse.json({ error: "Amount, category, and date are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      landlord_id: user.id,
      amount,
      category,
      description,
      date,
      property_id: property_id || null,
    })
    .select()
    .single()

  if (error) {
    console.error("[POST /api/expenses] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expense: data }, { status: 201 })
}
