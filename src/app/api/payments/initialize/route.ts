import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, email, tenancyId } = await req.json();

    if (!amount || !email || !tenancyId) {
      return NextResponse.json({ error: "Amount, email, and tenancyId are required" }, { status: 400 });
    }

    // Amount in Kobo for Paystack
    const paystackAmount = Math.round(parseFloat(amount) * 100);

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: paystackAmount,
        metadata: {
          tenancyId,
          userId: user.id
        },
        callback_url: `${req.nextUrl.origin}/dashboard`
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("[Paystack Initialize]", error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
