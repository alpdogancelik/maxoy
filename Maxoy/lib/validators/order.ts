import { z } from "zod";

export const OrderCreateSchema = z.object({
  paymentMethod: z.enum(["WHATSAPP", "BANK_TRANSFER"]),
  customer: z.object({
    fullName: z.string().min(1),
    email: z.string().email().optional().nullable(),
    phone: z.string().min(5),
    whatsapp: z.string().optional().nullable(),
  }),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    district: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().min(1),
  }),
  shippingNote: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().optional().nullable(),
        productName: z.string().min(1),
        sku: z.string().optional().nullable(),
        price: z.number().min(0),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

export const OrderStatusSchema = z
  .object({
    status: z
      .enum(["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
      .optional(),
    adminNote: z.string().optional().nullable(),
    force: z.boolean().optional(),
  })
  .refine((data) => data.status || data.adminNote, {
    message: "status or adminNote required",
  })
  .refine(
    (data) => {
      if (!data.status) return true;
      if (data.status !== "CANCELLED" && data.status !== "REFUNDED") return true;
      return Boolean(data.adminNote && data.adminNote.trim().length >= 3);
    },
    {
      message: "adminNote (reason) is required for CANCELLED/REFUNDED",
      path: ["adminNote"],
    }
  );
