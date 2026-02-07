# Maxoy Roadmap & TODO

## 0) Gözlem / Stabilizasyon (Öncelik)
- [ ] WhatsApp numarası + mesaj şablonlarını gerçek numarayla doğrula (`constants/contact.js`).
- [ ] Kur oranlarını güncelle ve otomatik kur API opsiyonunu ekle (`constants/currency.js`).
- [ ] TR/EN çevirileri tamamla: Hero, Footer, Quick Order, Get Quote, cart boş metni, filtre başlıkları.
- [ ] Quick Order + Get Quote sayfalarını SCSS ile tasarla (şu an inline style).
- [ ] Base64 görselleri JSON’dan kaldır → URL/Storage (Sanity/S3) ve migration script yaz.
- [ ] CSV import: quoted field desteği + delimiter seçimi + header doğrulama.
- [ ] Sanity schema tekilleştir (src/sanity vs sanity/schemas). Tek veri kaynağına karar ver.
- [ ] API routing tekilleştir (pages/api vs app/api) ve kullanım yerlerini netleştir.
- [ ] Stripe para birimi ve price tier uyumunu doğrula (TRY/USD).
- [ ] Favoriler sayfası veya filtre ekle.

## Sprint 1 (Sales Impact)
- [x] Global search + autocomplete + category suggestions
- [x] Faceted filter UI (color/size/material/usage/stock/new/sale)
- [x] Product card upgrades (stock, SKU, quick add, WhatsApp, favorite)
- [x] Product detail gallery (multi-image, 1:1, hover zoom)
- [x] WhatsApp share (product + cart)
- [x] Admin image upload + auto compression

## Sprint 2 (Operations)
- [x] Variant grouping support (single product page with variant selection)
- [x] CSV import/export (admin)
- [x] Min stock alert in admin
- [x] Stock movement log on edit
- [ ] Bulk stock movement report page
- [ ] Inventory change history UI
- [ ] Stok hareketi filtreleri (tarih/ürün/degisim tipi)

## Sprint 3 (Growth)
- [x] B2B price tiers + min order + quote flow
- [x] Quick order (SKU -> qty -> cart)
- [x] Category SEO pages + schema
- [x] Language + currency switch (TR/EN, ₺/$)
- [ ] Live FX rate integration (optional)
- [ ] SEO: category intro copy, breadcrumbs, OpenGraph defaults
- [ ] Ürün sayfası Product schema + breadcrumb schema

## Data Model Tasks
- [x] Tags + attributes fields (material, usage, package contents, brand)
- [x] Variant group field
- [x] Wholesale price tiers
- [ ] CSV template documentation
- [ ] Sanity/JSON veri eşitleme kılavuzu

## QA
- [ ] Validate WhatsApp number and message templates
- [ ] Create sample products with variantGroup + multi images
- [ ] Test import/export with real CSV
- [ ] Test TR/EN + TRY/USD across product/card/cart
- [ ] Mobile UX (filter panel, cart, navbar)

