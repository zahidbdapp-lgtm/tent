import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const {
      title,
      content,
      priority,
      expiresAt,
      recipientType,
      recipientUserIds,
    } = body;

    // Update notice
    const { data: notice, error: noticeError } = await supabase
      .from("notices")
      .update({
        title,
        content,
        priority,
        expires_at: expiresAt,
        recipient_type: recipientType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (noticeError) throw noticeError;

    // Delete existing recipients
    await supabase.from("notice_recipients").delete().eq("notice_id", id);

    // Add new recipients
    if (recipientType === "all_users") {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("role", "landlord");

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        const recipients = users.map((u: any) => ({
          notice_id: id,
          user_id: u.id,
        }));

        const { error: recipientError } = await supabase
          .from("notice_recipients")
          .insert(recipients);

        if (recipientError) throw recipientError;
      }
    } else if (recipientType === "specific_users" && recipientUserIds?.length) {
      const recipients = recipientUserIds.map((userId: string) => ({
        notice_id: id,
        user_id: userId,
      }));

      const { error: recipientError } = await supabase
        .from("notice_recipients")
        .insert(recipients);

      if (recipientError) throw recipientError;
    }

    return NextResponse.json(notice);
  } catch (error: any) {
    console.error("Error updating notice:", error);
    const details = error?.message || "Unknown error";
    return NextResponse.json(
      { error: "Failed to update notice", details },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Delete recipients first
    await supabase.from("notice_recipients").delete().eq("notice_id", id);

    // Delete notice
    const { error: noticeError } = await supabase
      .from("notices")
      .delete()
      .eq("id", id);

    if (noticeError) throw noticeError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting notice:", error);
    const details = error?.message || "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete notice", details },
      { status: 500 }
    );
  }
}
