import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function log(msg: string) {
  console.log(`[PROXY] ${new Date().toISOString()} ${msg}`);
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("admin-token");
  const { pathname } = request.nextUrl;
  log(`Incoming request: ${pathname} with search: ${request.nextUrl.search}`);

  // Intercept socket.io requests and proxy to backend, forwarding upgrade headers
  if (pathname.startsWith("/socket.io")) {
    const cleanPath = request.nextUrl.pathname.endsWith('/') ? request.nextUrl.pathname : request.nextUrl.pathname + '/';
    const backendUrl = new URL(cleanPath + request.nextUrl.search, "http://localhost:5001");
    log(`Rewriting socket.io to: ${backendUrl.toString()}`);
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

  // Protect /admin routes (except login and setup-password)
  if (pathname.startsWith("/admin") && !pathname.includes("/admin/login") && !pathname.includes("/admin/setup-password")) {
    if (!token) {
      log(`Redirecting unauthenticated admin access to /admin/login`);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Redirect to dashboard/creators if already logged in and trying to access login page
  if (pathname === "/admin/login" && token) {
    log(`Redirecting authenticated user to /admin/creators`);
    return NextResponse.redirect(new URL("/admin/creators", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/socket.io", "/socket.io/", "/socket.io/:path*"],
};
