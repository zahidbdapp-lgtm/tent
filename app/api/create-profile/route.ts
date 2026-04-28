import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  console.warn("[API] ⚠️ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables");
  console.warn("[API] Profile creation during signup may not work properly");
  console.warn("[API] See SIGNUP_FIX_GUIDE.md for instructions on how to set it up");
}

const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

interface CreateProfileRequest {
  userId: string;
  email: string;
  displayName: string;
  phone: string;
  paymentMethod?: string;
  paymentNumber?: string;
  transactionId?: string;
  amount?: number;
  plan?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is available
    if (!supabaseAdmin || !serviceRoleKey) {
      console.warn("[API] Service role key not configured");
      return NextResponse.json(
        {
          warning: "Service role key not configured - using fallback method",
          error: "Service role key required for optimal profile creation",
        },
        { status: 200 } // Return 200 to allow fallback in client
      );
    }

    const body: CreateProfileRequest = await request.json();

    if (!body.userId || !body.email || !body.displayName) {
      return NextResponse.json(
        { error: "Missing required fields: userId, email, displayName" },
        { status: 400 }
      );
    }

    console.log("[API] Creating profile for user:", body.userId);

    const profileData = {
      id: body.userId,
      email: body.email,
      display_name: body.displayName,
      phone: body.phone || null,
      role: "landlord",
      subscription_status: body.plan ? "payment_pending" : "demo",
      subscription_plan: body.plan || null,
      subscription_start_date: null,
      subscription_expiry: null,
      payment_method: body.paymentMethod || null,
      payment_number: body.paymentNumber || null,
      payment_transaction_id: body.transactionId || null,
      payment_amount: body.amount || null,
      payment_date: body.amount ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Use service role to insert profile (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error("[API] Profile creation error:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return NextResponse.json(
        {
          error: `Failed to create profile: ${error.message}`,
          code: error.code,
          hint: "Check browser console for details",
        },
        { status: 400 }
      );
    }

    console.log("[API] ✅ Profile created successfully");

    return NextResponse.json(
      {
        success: true,
        profile: data,
        message: "Profile created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error creating profile:", error);
    return NextResponse.json(
      { error: `Server error: ${(error as any)?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
