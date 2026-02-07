import { z } from "zod";

export const HomeConfigSchema = z.object({
  announcements: z
    .array(
      z.object({
        id: z.string().optional(),
        messageTR: z.string().min(1),
        messageEN: z.string().min(1),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .optional(),
  heroSlides: z
    .array(
      z.object({
        id: z.string().optional(),
        titleTR: z.string().min(1),
        titleEN: z.string().min(1),
        subtitleTR: z.string().optional().nullable(),
        subtitleEN: z.string().optional().nullable(),
        ctaTextTR: z.string().optional().nullable(),
        ctaTextEN: z.string().optional().nullable(),
        ctaLink: z.string().optional().nullable(),
        imageAssetId: z.string().min(1),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .optional(),
  categoryCards: z
    .array(
      z.object({
        id: z.string().optional(),
        titleTR: z.string().min(1),
        titleEN: z.string().min(1),
        descriptionTR: z.string().optional().nullable(),
        descriptionEN: z.string().optional().nullable(),
        link: z.string().optional().nullable(),
        themeColor: z.string().optional().nullable(),
        imageAssetId: z.string().min(1),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
  featuredProducts: z
    .array(
      z.object({
        id: z.string().optional(),
        productId: z.string().min(1),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
  trustBadges: z
    .array(
      z.object({
        id: z.string().optional(),
        icon: z.string().min(1),
        textTR: z.string().min(1),
        textEN: z.string().min(1),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
});
