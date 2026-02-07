import { revalidatePath, revalidateTag } from "next/cache";

export const RevalidateTags = {
  home: "home",
  categories: "categories",
  products: "products",
  settings: "settings",
} as const;

export function revalidateHome() {
  revalidateTag(RevalidateTags.home);
  revalidatePath("/");
}

export function revalidateCategories() {
  revalidateTag(RevalidateTags.categories);
  revalidatePath("/category");
}

export function revalidateProducts() {
  revalidateTag(RevalidateTags.products);
  revalidatePath("/product");
}

export function revalidateSettings() {
  revalidateTag(RevalidateTags.settings);
}
