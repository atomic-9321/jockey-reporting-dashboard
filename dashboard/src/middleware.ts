import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET
  ? new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
  : null;

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");

  // Auth is enforced by default. Only skip if explicitly disabled.
  if (!process.env.AUTH_USERS) {
    if (process.env.DISABLE_AUTH === "true") {
      return NextResponse.next();
    }
    // AUTH_USERS not configured and auth not explicitly disabled — fail closed
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Server misconfigured: AUTH_USERS is required (set DISABLE_AUTH=true to run without auth)" },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Only /api/refresh validates its own bearer credentials — let those through
  const BEARER_AUTH_ROUTES = ["/api/refresh"];
  if (
    BEARER_AUTH_ROUTES.some((r) => pathname === r) &&
    request.headers.get("authorization")?.startsWith("Bearer ")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("jockey-session")?.value;

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!SECRET) {
    // No signing key configured — cannot verify any session tokens
    if (isApiRoute) {
      return NextResponse.json({ error: "Server misconfigured: NEXTAUTH_SECRET is required" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    // Enforce admin role for mutating API requests (insights is read-only analysis)
    const READ_ONLY_POST_ROUTES = ["/api/insights", "/api/ad-insights"];
    const method = request.method;
    if (
      isApiRoute &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      payload.role !== "admin" &&
      !READ_ONLY_POST_ROUTES.some((r) => pathname === r)
    ) {
      return NextResponse.json(
        { error: "Forbidden: admin role required" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
