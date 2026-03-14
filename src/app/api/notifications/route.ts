import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUser } from "@/services/user"
import { createNotification } from "@/lib/notifications"

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Use official getUser() for better reliability and security
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";

    let query = supabase
      .from("notifications")
      .select("id, title, message, type, read, created_at, data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[notifications] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    const { count, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (countError) {
      console.error("[notifications] Count error:", countError);
    }

    return NextResponse.json({
      notifications: data ?? [],
      unreadCount: count ?? 0,
    });
  } catch (err: any) {
    console.error("[notifications] Caught exception:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notification_id, mark_all_read, action, tenancy_id } = body;

    if (mark_all_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("[notifications] Mark all read error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (notification_id) {
      if (action === "accept" || action === "reject") {
        if (!tenancy_id) {
          return NextResponse.json({ error: "Tenancy ID required" }, { status: 400 });
        }

        const newStatus = action === "accept" ? "active" : "rejected";

        if (action === "accept") {
          // 1. Terminate any other active tenancies this tenant has
          await supabase
            .from("tenancies")
            .update({ status: "terminated" })
            .eq("tenant_id", user.id)
            .eq("status", "active")
            .neq("id", tenancy_id);

          // 2. Fetch the tenancy details to calculate next_due_date
          const { data: pendingTenancy } = await supabase
            .from("tenancies")
            .select("start_date, rent_cycle")
            .eq("id", tenancy_id)
            .single();

          if (pendingTenancy) {
            const startDate = new Date(pendingTenancy.start_date);
            if (pendingTenancy.rent_cycle === "monthly") {
              startDate.setMonth(startDate.getMonth() + 1);
            } else {
              startDate.setFullYear(startDate.getFullYear() + 1);
            }
            const nextDueDate = startDate.toISOString();

            const { error: updateError } = await supabase
              .from("tenancies")
              .update({ status: newStatus, next_due_date: nextDueDate })
              .eq("id", tenancy_id)
              .eq("tenant_id", user.id);

            if (updateError) {
              console.error("[notifications] Tenancy accept error:", updateError);
              return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
          } else {
            return NextResponse.json({ error: "Tenancy not found" }, { status: 404 });
          }
        } else {
          // Reject
          const { error: updateError } = await supabase
            .from("tenancies")
            .update({ status: newStatus })
            .eq("id", tenancy_id)
            .eq("tenant_id", user.id);

          if (updateError) {
            console.error("[notifications] Tenancy reject error:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
          }
        }

        const { data: tenancy } = await supabase
          .from("tenancies")
          .select(`
            id,
            units!inner(
              name,
              properties!inner(landlord_id, name)
            )
          `)
          .eq("id", tenancy_id)
          .single();

        if (tenancy) {
          const landlordId = tenancy.units.properties.landlord_id;
          const unitName = tenancy.units.name;
          const propertyName = tenancy.units.properties.name;
          const tenantName = user.user_metadata?.full_name || user.email || "A tenant";

          
          await createNotification({
            userId: landlordId,
            title: action === "accept" ? "Tenancy Accepted" : "Tenancy Declined",
            message: `${tenantName} has ${action === "accept" ? "accepted" : "declined"} the invitation to Unit ${unitName} at ${propertyName}.`,
            type: "system",
          });
          
        } else {
          console.error("[notifications] Could not find tenancy for loop-back notification:", tenancy_id);
        }
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notification_id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[notifications] Mark read error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[notifications] PATCH exception:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
