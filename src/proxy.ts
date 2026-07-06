import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  const { pathname } = request.nextUrl;

  // Intercept socket.io requests and proxy to backend, forwarding upgrade headers
  if (pathname.startsWith("/socket.io")) {
    const cleanPath = request.nextUrl.pathname.endsWith('/') ? request.nextUrl.pathname : request.nextUrl.pathname + '/';
    const backendUrl = new URL(cleanPath + request.nextUrl.search, "http://localhost:5001");
    const requestHeaders = new Headers();
    
    // Explicitly preserve and forward upgrade headers if present
    const upgradeHeader = request.headers.get("upgrade");
    const connectionHeader = request.headers.get("connection");
    
    if (upgradeHeader) {
      requestHeaders.set("Upgrade", upgradeHeader);
    }
    if (connectionHeader) {
      requestHeaders.set("Connection", connectionHeader);
    }

    return NextResponse.rewrite(backendUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle root redirects
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Protect /admin routes (except login, setup-password, forgot-password, reset-password, auth/callback)
  const isAuthRoute = 
    pathname.includes("/admin/login") || 
    pathname.includes("/admin/setup-password") || 
    pathname.includes("/admin/forgot-password") || 
    pathname.includes("/admin/reset-password") ||
    pathname.includes("/admin/auth/callback");

  if (pathname.startsWith("/admin") && !isAuthRoute) {
    if (!token) {
      const nextUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(new URL(`/admin/login?next=${nextUrl}`, request.url));
    }
  }

  // Redirect to dashboard if already logged in and trying to access login page
  if (pathname === "/admin/login" && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/admin/:path*", "/socket.io", "/socket.io/", "/socket.io/:path*"],
};
