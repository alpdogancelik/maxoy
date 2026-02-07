import { Order, OrderItem } from "@prisma/client";

export function buildWhatsappMessage({
  orderId,
  items,
  total,
  customerName,
}: {
  orderId: string;
  items: Array<Pick<OrderItem, "productName" | "quantity" | "price">>;
  total: number;
  customerName: string;
}) {
  const lines = [
    `Siparis #${orderId}`,
    `Musteri: ${customerName}`,
    ...items.map((item) => `- ${item.productName} x${item.quantity}`),
    `Toplam: ${total}`,
  ];
  return encodeURIComponent(lines.join("\n"));
}

export function buildWhatsappUrl({
  phone,
  message,
}: {
  phone: string;
  message: string;
}) {
  const sanitized = phone.replace(/\D/g, "");
  return `https://wa.me/${sanitized}?text=${message}`;
}
