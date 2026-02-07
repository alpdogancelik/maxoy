import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import Papa from "papaparse";

export async function GET(request: Request) {
  const auth = await requirePermissionFromRequest(request, "products:import-export");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    const products = await prisma.product.findMany({ where: { deletedAt: null } });
    const csv = Papa.unparse(products);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=products-export.csv",
      },
    });
  } catch {
    const csv = Papa.unparse([]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=products-export.csv",
      },
    });
  }
}

