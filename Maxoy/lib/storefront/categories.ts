import { prisma } from "@/lib/db";

export type StoreCategory = {
  id: string;
  slug: string;
  nameTR: string;
  nameEN: string;
  parentId?: string | null;
  sortOrder?: number;
};

export async function getStorefrontCategories(): Promise<StoreCategory[]> {
  try {
    const items = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameTR: "asc" }],
    });

    return items.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameTR: c.nameTR,
      nameEN: c.nameEN,
      parentId: c.parentId ?? null,
      sortOrder: c.sortOrder ?? 0,
    }));
  } catch {
    return [];
  }
}
