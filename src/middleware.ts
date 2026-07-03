import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const STAFF_ROUTES = ["/dashboard", "/pipeline", "/clients", "/staff", "/projects", "/payments", "/settings"]
const PORTAL_ROUTES = ["/portal"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Not logged in → redirect to /login (except login page itself)
  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Already logged in and hitting /login → figure out where to send them
  if (user && pathname === "/login") {
    // Check if this user is a client
    const { data: clientUser } = await supabase
      .from("client_users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (clientUser) {
      return NextResponse.redirect(new URL("/portal", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Logged in — enforce role separation
  if (user) {
    const isPortalRoute = PORTAL_ROUTES.some(r => pathname.startsWith(r))
    const isStaffRoute = STAFF_ROUTES.some(r => pathname.startsWith(r))

    if (isPortalRoute || isStaffRoute) {
      const { data: clientUser } = await supabase
        .from("client_users")
        .select("id")
        .eq("id", user.id)
        .single()

      const isClient = !!clientUser

      // Client trying to access staff routes → send to portal
      if (isClient && isStaffRoute) {
        return NextResponse.redirect(new URL("/portal", request.url))
      }

      // Staff/Admin trying to access portal → send to dashboard
      if (!isClient && isPortalRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
