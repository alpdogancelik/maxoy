import "server-only";

import type { NextRequest } from "next/server";
import { getSessionFromRequest, getServerSession, getSessionUser } from "@/lib/admin-auth";
import { hasAnyPermission, type Permission } from "@/lib/admin-permissions";

export async function requirePermissionFromRequest(
  request: NextRequest | Request,
  permission: Permission | Permission[]
) {
  const session = await getSessionFromRequest(request);
  const user = getSessionUser(session as any);
  if (!user) return { user: null, session: null } as const;

  const wanted = Array.isArray(permission) ? permission : [permission];
  if (!hasAnyPermission(user, wanted)) {
    return { user: null, session: null, forbidden: true } as const;
  }

  return { user, session } as const;
}

export async function requirePermissionServer(permission: Permission | Permission[]) {
  const session = await getServerSession();
  const user = getSessionUser(session as any);
  if (!user) return { user: null, session: null } as const;

  const wanted = Array.isArray(permission) ? permission : [permission];
  if (!hasAnyPermission(user, wanted)) {
    return { user: null, session: null, forbidden: true } as const;
  }

  return { user, session } as const;
}

