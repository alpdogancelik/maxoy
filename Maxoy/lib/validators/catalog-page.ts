import { z } from "zod";

export const CatalogPageSchema = z.object({
  key: z.string().min(1),
  path: z.string().min(1).startsWith("/"),
  titleTR: z.string().min(1),
  titleEN: z.string().min(1),
  seoTitleTR: z.string().optional().nullable(),
  seoTitleEN: z.string().optional().nullable(),
  seoDescTR: z.string().optional().nullable(),
  seoDescEN: z.string().optional().nullable(),
  initialMainCategory: z.string().optional().nullable(),
  initialSubcategory: z.string().optional().nullable(),
  allowedMainCategories: z.array(z.string()).default([]),
  allowedSubcategories: z.array(z.string()).default([]),
  sortOrder: z.number().int().optional().default(0),
  navVisible: z.boolean().optional().default(false),
  sidebarItems: z
    .array(
      z.object({
        labelTR: z.string().min(1),
        labelEN: z.string().optional().nullable(),
        category: z.string().optional().nullable(),
      })
    )
    .optional()
    .nullable(),
});
