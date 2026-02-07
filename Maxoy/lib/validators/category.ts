import { z } from "zod";

export const CategorySchema = z.object({
  nameTR: z.string().min(1),
  nameEN: z.string().min(1),
  slug: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageAssetId: z.string().nullable().optional(),
  descriptionTR: z.string().optional().nullable(),
  descriptionEN: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
