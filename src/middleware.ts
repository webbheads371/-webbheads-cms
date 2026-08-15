import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const STAFF_ROUTES = ["/dashboard", "/pipeline", "/clients", "/staff", "/projects", "/payments", "/settings"]
const PORTAL_ROUTES = ["/portal"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static logo or NextAuth api routes to bypass middleware
  if (pathname === "/logo.png" || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r))

  // Not logged in → redirect to /login (except public auth pages)
  if (!token) {
    if (!isPublicRoute) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Already logged in and trying to access public auth routes → redirect appropriately
  if (isPublicRoute) {
    if (token.userType === "client") {
      return NextResponse.redirect(new URL("/portal", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Logged in — enforce role separation
  const isPortalRoute = PORTAL_ROUTES.some((r) => pathname.startsWith(r))
  const isStaffRoute = STAFF_ROUTES.some((r) => pathname.startsWith(r))
  const isClient = token.userType === "client"

  // Client trying to access staff routes → send to portal
  if (isClient && isStaffRoute) {
    return NextResponse.redirect(new URL("/portal", request.url))
  }

  // Staff trying to access portal routes → send to dashboard
  if (!isClient && isPortalRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js)$).*)",
  ],
}
