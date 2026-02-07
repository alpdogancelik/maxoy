import { z } from "zod";

export const MediaUploadRequestSchema = z.object({
  fileName: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().int().positive(),
  folder: z.string().optional(),
});

export const MediaCreateSchema = z.object({
  key: z.string().min(1),
  url: z.string().url().or(z.string().min(1)),
  mime: z.string().min(1),
  size: z.number().int().positive(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  altText: z.string().min(1, "altText is required"),
  folder: z.string().optional(),
  blurDataUrl: z.string().optional(),
  variants: z.any().optional(),
});

export const MediaUpdateSchema = z.object({
  altText: z.string().min(1).optional(),
  folder: z.string().optional().nullable(),
  fileName: z.string().min(1).optional(),
  deletedAt: z.string().datetime().optional().nullable(),
});

export const MediaProcessSchema = z.object({
  key: z.string().min(1),
  mime: z.string().optional().default(""),
  size: z.number().int().positive(),
  altText: z.string().min(1),
  folder: z.string().optional(),
});
