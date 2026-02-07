import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "./lib/admin-constants";
import { AUTH_COOKIE } from "./lib/auth";

const LOCALES = new Set(["tr", "en"]);

function stripLocalePrefix(pathname: string) {
  const parts = pathname.split("/");
  const maybeLocale = parts[1];
  if (!maybeLocale || !LOCALES.has(maybeLocale)) return pathname;
  const rest = "/" + parts.slice(2).filter(Boolean).join("/");
  return rest === "/" ? "/" : rest;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Support legacy/automatic locale prefixes (e.g. /en/*, /tr/*) by mapping them
  // to the existing route structure.
  const strippedPathname = stripLocalePrefix(pathname);
  if (strippedPathname !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = strippedPathname;
    if (request.method === "GET" || request.method === "HEAD") {
      return NextResponse.redirect(url);
    }
    return NextResponse.rewrite(url);
  }

  const adminAuthDisabled =
    process.env.ADMIN_AUTH_DISABLED === "1" ||
    (process.env.ADMIN_AUTH_DISABLED !== "0" && process.env.NODE_ENV !== "production");

  if (pathname.startsWith("/api/admin")) {
    if (adminAuthDisabled) return NextResponse.next();
    // Allow login (and CORS/preflight) without a session cookie
    if (request.method === "OPTIONS") return NextResponse.next();
    if (pathname.startsWith("/api/admin/auth/login")) {
      return NextResponse.next();
    }

    const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    if (adminAuthDisabled) return NextResponse.next();

    const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!adminCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/account")) {
    const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
    if (!authCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on "real" routes but skip Next internals and static assets.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
