import { redirect } from "next/navigation";

function resolveLegacyCategorySlug(slug: string) {
  const s = String(slug || "").trim();
  const lower = s.toLowerCase();

  const map: Record<string, string> = {
    "yapay-cicek": "/cicek-cesitleri",
    "yapay-bitki": "/tum-urunler?category=A",
    ambalaj: "/toptan-cicek-malzemesi-ambalaj-cesitleri",
    oasis: "/toptan-cicek-malzemesi-oasis-cesitleri",
    "hazir-urunler": "/hazir-urunler",
    kurdele: "/kurdele-cesitleri",
  };
  if (map[lower]) return map[lower];

  const upper = s.toUpperCase();
  if (/^[A-Z]\d*$/.test(upper)) {
    return `/tum-urunler?category=${encodeURIComponent(upper)}`;
  }

  return "/tum-urunler";
}

export default function CategoryLegacyNestedRedirectPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(resolveLegacyCategorySlug(params.slug));
}

