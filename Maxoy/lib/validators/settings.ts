import { z } from "zod";

export const SettingsSchema = z.object({
  brand: z.object({
    siteName: z.string().optional(),
    logoAssetId: z.string().optional().nullable(),
    faviconAssetId: z.string().optional().nullable(),
  }),
  contact: z.object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }),
  shipping: z.object({
    freeShippingThreshold: z.number().optional(),
    estimatedDaysTextTR: z.string().optional(),
    estimatedDaysTextEN: z.string().optional(),
  }),
  social: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
  }),
  legal: z.object({
    companyName: z.string().optional(),
    taxOffice: z.string().optional(),
    taxNo: z.string().optional(),
  }),
});
