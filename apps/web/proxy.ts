import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getProtectedRedirect } from "@/lib/auth/route-guards";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (process.env.MNEMOSYNE_AUTH_BYPASS === "1") {
    return response;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const redirectPath = getProtectedRedirect(null, request.nextUrl.pathname);
    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const redirectPath = getProtectedRedirect(session, request.nextUrl.pathname);
  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/chat/:path*", "/documents/:path*", "/settings/:path*", "/auth/sign-in", "/auth/sign-up"]
};
