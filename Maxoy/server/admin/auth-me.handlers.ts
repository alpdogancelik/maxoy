import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, isAdminAuthDisabled } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (isAdminAuthDisabled()) {
    return NextResponse.json({
      user: {
        id: "dev-admin",
        email: "dev-admin@local",
        name: "Dev Admin",
        role: "ADMIN",
      },
      bypass: true,
    });
  }

  const session = await getSessionFromRequest(request);
  if (!session || !session.user || !session.user.isActive) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role.name,
    },
  });
}

