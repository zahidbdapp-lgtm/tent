import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = await createMiddlewareClient(request, response);

  // You can add additional middleware logic here
  // For example, redirecting unauthenticated users
  // const protectedRoutes = ['/dashboard', '/admin'];
  // const isProtectedRoute = protectedRoutes.some(route =>
  //   request.nextUrl.pathname.startsWith(route)
  // );

  // if (isProtectedRoute && !session) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
