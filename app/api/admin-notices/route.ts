import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Notice } from "@/types";

export async function GET(request: NextRequest) {
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

    // Fetch all admin notices with recipient count
    const { data: notices, error } = await supabase
      .from("notices")
      .select(
        `
        *,
        notice_recipients(count)
      `
      )
      .eq("is_admin_notice", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(notices);
  } catch (error) {
    console.error("Error fetching admin notices:", error);
    return NextResponse.json(
      { error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}

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

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      priority,
      expiresAt,
      recipientType,
      recipientUserIds,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Create notice
    const { data: notice, error: noticeError } = await supabase
      .from("notices")
      .insert({
        owner_id: user.id,
        title,
        content,
        priority: priority || "medium",
        expires_at: expiresAt || null,
        is_admin_notice: true,
        recipient_type: recipientType || "all_users",
        property_id: null,
      })
      .select()
      .single();

    if (noticeError) {
      console.error("Notice insert error:", noticeError);
      throw noticeError;
    }

    // Add recipients
    if (recipientType === "all_users") {
      // Get all landlord users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("role", "landlord");

      if (usersError) {
        console.error("Users fetch error:", usersError);
        throw usersError;
      }

      if (users && users.length > 0) {
        const recipients = users.map((u: any) => ({
          notice_id: notice.id,
          user_id: u.id,
        }));

        const { error: recipientError } = await supabase
          .from("notice_recipients")
          .insert(recipients);

        if (recipientError) {
          console.error("Recipients insert error:", recipientError);
          throw recipientError;
        }
      }
    } else if (recipientType === "specific_users" && recipientUserIds?.length) {
      const recipients = recipientUserIds.map((userId: string) => ({
        notice_id: notice.id,
        user_id: userId,
      }));

      const { error: recipientError } = await supabase
        .from("notice_recipients")
        .insert(recipients);

      if (recipientError) {
        console.error("Recipients insert error:", recipientError);
        throw recipientError;
      }
    }

    return NextResponse.json(notice);
  } catch (error: any) {
    console.error("Error creating notice:", error);
    return NextResponse.json(
      { 
        error: "Failed to create notice",
        details: error?.message || error?.toString()
      },
      { status: 500 }
    );
  }
}
