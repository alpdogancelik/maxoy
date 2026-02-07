import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { RoleName } from "@prisma/client";
import { prisma } from "./db";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from "./admin-constants";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: { name: RoleName };
};

/**
 * Temporary dev bypass: when developing locally (or if explicitly enabled),
 * skip DB-backed admin auth and treat the user as an ADMIN.
 *
 * - Enabled by default in non-production to keep the admin UI usable without a DB.
 * - Force-enable in production by setting ADMIN_AUTH_DISABLED=1 (NOT recommended).
 * - Force-disable in development by setting ADMIN_AUTH_DISABLED=0.
 */
export function isAdminAuthDisabled() {
  const flag = process.env.ADMIN_AUTH_DISABLED;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return process.env.NODE_ENV !== "production";
}

const DEV_ADMIN_USER: SessionUser = {
  id: "dev-admin",
  email: "dev-admin@local",
  name: "Dev Admin",
  role: { name: "ADMIN" as RoleName },
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession({
  userId,
  ip,
  userAgent,
}: {
  userId: string;
  ip?: string;
  userAgent?: string;
}) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ip,
      userAgent,
    },
  });
  return { token, expiresAt };
}

export async function revokeSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : request.ip ?? undefined;
  const userAgent = request.headers.get("user-agent") || undefined;
  return { ip, userAgent };
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc: Record<string, string>, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function getTokenFromRequest(request: NextRequest | Request) {
  if ("cookies" in request) {
    return (request as NextRequest).cookies.get(ADMIN_SESSION_COOKIE)?.value;
  }
  const cookiesHeader = request.headers.get("cookie");
  const parsed = parseCookieHeader(cookiesHeader);
  return parsed[ADMIN_SESSION_COOKIE];
}

export async function getSessionFromRequest(request: NextRequest | Request) {
  if (isAdminAuthDisabled()) {
    // Avoid DB access in dev when auth is disabled.
    return { token: "dev", userId: DEV_ADMIN_USER.id, user: DEV_ADMIN_USER } as any;
  }
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: { include: { role: true } } },
  });
}

export async function getServerSession() {
  if (isAdminAuthDisabled()) {
    return { token: "dev", userId: DEV_ADMIN_USER.id, user: DEV_ADMIN_USER } as any;
  }
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: { include: { role: true } } },
  });
}

export function getSessionUser(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session) return null;
  return session.user as SessionUser;
}

export function requireAuth(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session || !session.user || !session.user.isActive) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user as SessionUser;
}

export function hasRole(user: SessionUser, roles: string[]) {
  return roles.includes(user.role.name);
}

export async function requireRoleFromRequest(request: NextRequest | Request, roles: string[]) {
  if (isAdminAuthDisabled()) {
    return { user: DEV_ADMIN_USER, session: { token: "dev" } } as const;
  }
  const session = await getSessionFromRequest(request);
  if (!session || !session.user || !session.user.isActive) {
    return { user: null, session: null };
  }
  const user = session.user as SessionUser;
  if (!hasRole(user, roles)) {
    return { user: null, session: null, forbidden: true } as const;
  }
  return { user, session } as const;
}

export async function requireRoleServer(roles: string[]) {
  if (isAdminAuthDisabled()) {
    return { user: DEV_ADMIN_USER, session: { token: "dev" } } as const;
  }
  const session = await getServerSession();
  if (!session || !session.user || !session.user.isActive) {
    return { user: null, session: null };
  }
  const user = session.user as SessionUser;
  if (!hasRole(user, roles)) {
    return { user: null, session: null, forbidden: true } as const;
  }
  return { user, session } as const;
}
