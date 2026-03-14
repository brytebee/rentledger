import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/request";
import { normalizePhoneNumber } from "@/lib/utils/phone";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone, role } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const nigerianPhoneRegex = /^(?:(?:\+234)|0)(?:70|80|81|82|83|90|91)\d{8}$/;
    if (!nigerianPhoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid Nigerian phone number" },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    const { supabase } = createServerClient(req);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: normalizedPhone,
          phone: normalizedPhone, // Add this too
          role: role || "tenant",
        },
        emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      // console.log(`Failed to signUp User: ${error}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        phone: normalizedPhone,
        role: role || "tenant",
      },
    });
  } catch (error) {
    console.warn("[auth/signup]", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
