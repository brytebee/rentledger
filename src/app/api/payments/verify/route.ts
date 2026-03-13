import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { status, data } = response.data;

    if (status && data.status === "success") {
      const { tenancyId } = data.metadata;
      const amount = data.amount / 100;

      // Record the payment in the DB
      const { error: insertError } = await supabase.from("payments").insert({
        tenancy_id: tenancyId,
        amount,
        status: "verified",
        payment_date: new Date().toISOString().split("T")[0],
        reference: reference
      });

      if (insertError) {
        console.error("[Paystack Verify] DB Insert Error:", insertError);
        return NextResponse.json({ error: "Payment verified but failed to record in DB" }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, message: data.gateway_response || "Payment not successful" });
  } catch (error: any) {
    console.error("[Paystack Verify]", error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
