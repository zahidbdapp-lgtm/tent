import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: "আপনি নিজেকে ডিলিট করতে পারবেন না" },
        { status: 400 }
      );
    }

    // Delete all user data in the correct order (foreign key constraints)
    // 1. Delete tickets
    await supabase.from("tickets").delete().eq("owner_id", userId);

    // 2. Delete expenses
    await supabase.from("expenses").delete().eq("owner_id", userId);

    // 3. Delete invoices
    await supabase.from("invoices").delete().eq("owner_id", userId);

    // 4. Delete tenants
    await supabase.from("tenants").delete().eq("owner_id", userId);

    // 5. Delete properties
    await supabase.from("properties").delete().eq("owner_id", userId);

    // 6. Delete user from database
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user from database:", deleteError);
      throw deleteError;
    }

    // 7. Delete user from authentication using admin API
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: authDeleteError } = await serviceRoleClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting user from auth:", authDeleteError);
      // Don't throw here - user is already deleted from database
      // Just log the error
    }

    return NextResponse.json({
      success: true,
      message: "ইউজার এবং সব ডেটা সফলভাবে ডিলিট হয়েছে",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "ইউজার ডিলিট করতে সমস্যা হয়েছে",
      },
      { status: 500 }
    );
  }
}
