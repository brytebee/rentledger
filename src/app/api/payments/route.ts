import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

async function getUserId(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return error || !user ? null : user.id;
}

export interface PaymentRow {
  id: string;
  tenantName: string;
  tenantInitials: string;
  unitLabel: string;
  propertyName: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "rejected";
  dueDate: string;
  paidAt: string | null;
  reference: string | null;
  proofUrl: string | null;
}

// GET /api/payments?status=all|pending|paid|rejected&page=1&limit=10
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const userId = await getUserId(supabase);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const statusFilter = searchParams.get("status") ?? "all";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("payment_list_view")
    .select("*", { count: "exact" })
    .eq("landlord_id", userId)
    .order("payment_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (statusFilter === "pending") {
    query = query.eq("effective_status", "pending");
  } else if (statusFilter === "verified" || statusFilter === "paid") {
    query = query.eq("effective_status", "paid");
  } else if (statusFilter === "rejected") {
    query = query.eq("effective_status", "rejected");
  }

  const { data: rows, count, error } = await query.range(from, to);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped: PaymentRow[] = (rows ?? []).map((p: any) => {
    const name = p.tenant_name ?? "Unknown";
    return {
      id: p.id,
      tenantName: name,
      tenantInitials: name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      unitLabel: `Unit ${p.unit_name ?? "N/A"}`,
      propertyName: p.property_name ?? "",
      amount: p.amount ?? 0,
      status: p.effective_status as "paid" | "pending" | "overdue" | "rejected",
      dueDate: p.due_date,
      paidAt: p.payment_date ?? null,
      reference: p.reference ?? null,
      proofUrl: p.proof_url ?? null,
    };
  });

  const totalPages = Math.ceil((count ?? 0) / limit);

  return NextResponse.json(
    {
      payments: mapped,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages,
      },
    },
    { status: 200 },
  );
}
