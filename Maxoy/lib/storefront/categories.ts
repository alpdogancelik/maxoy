import { prisma } from "@/lib/db";
import { withStorefrontDbTimeout } from "./db-utils";

export type StoreCategory = {
  id: string;
  slug: string;
  nameTR: string;
  nameEN: string;
  parentId?: string | null;
  sortOrder?: number;
};

export async function getStorefrontCategories(): Promise<StoreCategory[]> {
  return withStorefrontDbTimeout(
    prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameTR: "asc" }],
    }).then((items) =>
      items.map((c) => ({
        id: c.id,
        slug: c.slug,
        nameTR: c.nameTR,
        nameEN: c.nameEN,
        parentId: c.parentId ?? null,
        sortOrder: c.sortOrder ?? 0,
      }))
    ),
    () => []
  );
}
