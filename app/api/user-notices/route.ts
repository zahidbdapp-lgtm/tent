import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

    // Fetch admin notices for this user
    const { data: adminNotices, error: adminNoticesError } = await supabase
      .from("notice_recipients")
      .select(
        `
        id,
        is_read,
        read_at,
        notice_id,
        notices(*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (adminNoticesError) throw adminNoticesError;

    return NextResponse.json({
      notices: adminNotices || [],
      count: adminNotices?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching user notices:", error);
    return NextResponse.json(
      { error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}
