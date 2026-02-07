# Maxoy Backlog (P0/P1/P2)

Scope: UI/UX, SEO, performance, security, analytics, checkout, admin.

Legend
- Goal: desired outcome
- Risk: what can go wrong
- Files: likely touch points
- Quick win: fast improvement

## Epics

### Foundation (Audit + Roadmap) - P0
- Goal: Full audit and prioritized roadmap with risks and wins
- Risk: Hidden coupling across pages/components
- Files: `pages/`, `components/`, `lib/`, `constants/`, `styles/`
- Quick win: Trim dead/legacy folders and document active root

### Design System Tokens - P0
- Goal: Centralize colors, spacing, radius, typography, buttons/inputs
- Risk: Inconsistent styles if tokens not adopted everywhere
- Files: `styles/`, `components/**.module.scss`
- Quick win: Add `styles/tokens.scss` + use in top-level layout

### Header / Navigation
- Mega Menu (P0)
  - Goal: Desktop mega-menu + mobile accordion + a11y
  - Risk: Hover flicker, keyboard trap
  - Files: `components/Navbar.jsx`, `components/MobileNav.jsx`, `styles/`
  - Quick win: Add delayed hover open/close
- Search Modal + Autocomplete (P0)
  - Goal: Fast search with debounce, suggestions
  - Risk: Slow queries, UI jank
  - Files: `components/SearchModal.jsx`, `lib/searchService.js`, `pages/search.jsx`
  - Quick win: 200ms debounce + skeleton
- Mini Cart Drawer (P0)
  - Goal: Slide-in cart with subtotal + CTA
  - Risk: State sync issues
  - Files: `components/MiniCart.jsx`, `context/StateContext.js`, `styles/`
  - Quick win: Empty state + subtotal only

### i18n / Localization - P0
- Goal: Route-based language, hreflang, formatting
- Risk: Duplicate content, broken routes
- Files: `constants/i18n.js`, `pages/**`, `lib/seo.js`
- Quick win: Fix encoding + add missing translations

### Home Page
- Hero Slider CMS (P0)
  - Goal: Admin-managed slides with scheduling
  - Risk: Poor LCP if unoptimized images
  - Files: `components/Hero.jsx`, `pages/index.js`, `lib/cms`
  - Quick win: Hardcoded slider data with lazy images
- Hero Contrast + CTA (P0)
  - Goal: Readable text + CTA hierarchy
  - Risk: Mobile overlap
  - Files: `components/Hero.jsx`, `styles/`
  - Quick win: Gradient overlay
- Top Category Strip (P1)
  - Goal: Horizontal quick categories
  - Risk: Layout shift
  - Files: `components/`, `pages/index.js`
  - Quick win: Static list with overflow-x
- Best Sellers Slider + Grid (P0)
  - Goal: 8+ products, toggle slider/grid
  - Risk: Slow data load
  - Files: `components/Plants.jsx`, `lib/catalog.js`
  - Quick win: Static JSON for best sellers
- Trust Icons + Microcopy (P1)
  - Goal: 3-4 benefit cards with icons
  - Risk: Copy inconsistencies
  - Files: `components/FeaturedBrands.jsx` or new `components/TrustBadges.jsx`
  - Quick win: static copy with i18n
- Newsletter + KVKK (P1)
  - Goal: Signup with KVKK consent
  - Risk: Legal compliance
  - Files: `components/Footer.jsx`, `pages/api/`
  - Quick win: UI only + no-op submit

### Product Listing
- Filter UX Pills + Clear All (P0)
  - Goal: Visible selected filters, URL sync
  - Risk: Query desync
  - Files: `components/Plants.jsx`, `lib/queryUtils.js`
  - Quick win: Render pills from query params
- Sticky Filters / Offcanvas (P0)
  - Goal: Desktop sticky, mobile drawer
  - Risk: Scroll lock issues
  - Files: `components/Plants.jsx`, `styles/`
  - Quick win: Sticky sidebar on desktop
- Pagination / Infinite Scroll (P0)
  - Goal: SEO-friendly pagination, optional infinite
  - Risk: Duplicated content
  - Files: `pages/tum-urunler.jsx`, `lib/catalog.js`
  - Quick win: Basic pagination
- Grid Density Toggle (P2)
  - Goal: 2/3/4 columns saved in localStorage
  - Risk: CLS
  - Files: `components/Plants.jsx`, `styles/`
  - Quick win: toggle with CSS classes

### Product Card
- Quick Add + Variant (P0)
  - Goal: Add-to-cart from card
  - Risk: Missing variant selection
  - Files: `components/card/*.jsx`, `context/StateContext.js`
  - Quick win: If variants exist, link to PDP
- Wishlist + Compare (P1)
  - Goal: Guest storage + merge on login
  - Risk: Complexity in state sync
  - Files: `context/StateContext.js`, new `pages/wishlist.jsx`
  - Quick win: localStorage only

### PDP (Product Detail)
- Full PDP (P0)
  - Goal: Gallery, zoom, stock, variants, CTA
  - Risk: Data gaps
  - Files: `pages/product/[slug].js`, `components/`
  - Quick win: Image gallery + add-to-cart
- Breadcrumb + Schema (P0)
  - Goal: BreadcrumbList schema
  - Risk: Wrong hierarchy
  - Files: `lib/seo.js`, `pages/product/[slug].js`
  - Quick win: static breadcrumb from category
- Upsell/Cross-sell (P1)
  - Goal: Related products module
  - Risk: relevance
  - Files: `lib/catalog.js`, `components/`
  - Quick win: same-category fallback
- Recently Viewed (P2)
  - Goal: localStorage module
  - Risk: privacy
  - Files: `components/`, `lib/utility.js`
  - Quick win: last 6 items

### Cart
- Cart Improvements (P0)
  - Goal: coupons, shipping threshold, errors
  - Risk: pricing mismatch
  - Files: `pages/cart.jsx`, `lib/cartPricing.js`
  - Quick win: shipping bar from `constants/shipping.js`

### Checkout
- Guest Checkout + Address Book (P0)
  - Goal: guest flow + saved addresses
  - Risk: validation
  - Files: `pages/checkout.jsx`, `components/AddressForm.jsx`
  - Quick win: guest toggle
- Payment Integration Layer (P0)
  - Goal: provider abstraction + webhooks
  - Risk: failed payment states
  - Files: `pages/api/stripe.js`, `lib/`
  - Quick win: mock payment flow

### Orders
- Order Status Tracking (P0)
  - Goal: status page + tracking
  - Risk: data consistency
  - Files: `pages/account.jsx`, `lib/`
  - Quick win: static status page

### Account/Auth
- Auth Flow (P0)
  - Goal: login/register/reset
  - Risk: security
  - Files: `pages/login.jsx`, `pages/register.jsx`, `lib/auth.js`
  - Quick win: validate inputs

### B2B / Pricing
- B2B Onboarding (P0)
  - Goal: company info + approval
  - Risk: fraud
  - Files: `pages/wholesale.jsx`, `lib/`
  - Quick win: form + email submit
- Tiered Pricing (P0)
  - Goal: retail/wholesale/VIP
  - Risk: wrong pricing
  - Files: `lib/cartPricing.js`, `pages/product/[slug].js`
  - Quick win: show tiers on PDP

### Inventory
- Stock + Backorder (P0)
  - Goal: stock labels + warnings
  - Risk: oversell
  - Files: `components/card/`, `pages/product/[slug].js`
  - Quick win: low-stock badge

### Shipping
- Rule Engine (P0)
  - Goal: admin-managed rules
  - Risk: wrong totals
  - Files: `lib/shipping.js`, `constants/shipping.js`
  - Quick win: move rules into JSON

### SEO
- Meta/OG (P0)
  - Goal: dynamic title/desc, canonical
  - Risk: duplicate content
  - Files: `lib/seo.js`, `pages/**`
  - Quick win: base defaults
- Structured Data (P0)
  - Goal: Product + Breadcrumb schema
  - Risk: invalid schema
  - Files: `lib/seo.js`, `components/JsonLd.tsx`
  - Quick win: Organization + WebSite
- Sitemap/Robots (P0)
  - Goal: auto sitemap
  - Risk: stale URLs
  - Files: `pages/sitemap.xml.js`, `pages/robots.txt.js`
  - Quick win: include categories

### Performance
- Image Optimization (P0)
  - Goal: responsive + blur
  - Risk: broken images
  - Files: `components/SmartImage.*`, `next.config.js`
  - Quick win: blur placeholder
- Font Strategy (P1)
  - Goal: self-host + preload
  - Risk: CLS/FOIT
  - Files: `public/`, `styles/global.scss`
  - Quick win: preload primary font
- Cache + ISR (P0)
  - Goal: faster TTFB
  - Risk: stale data
  - Files: `pages/**`, `lib/revalidate.ts`
  - Quick win: cache headers on APIs

### Accessibility (P1)
- Goal: keyboard nav + aria
- Risk: unusable modals
- Files: `components/`, `styles/`
- Quick win: focus outline + aria-label

### Analytics
- GA4 Taxonomy (P0)
  - Goal: track key events
  - Risk: missing payloads
  - Files: `lib/analytics.js`, `components/`
  - Quick win: view_item + add_to_cart
- Consent Banner (P0)
  - Goal: KVKK/GDPR consent
  - Risk: compliance
  - Files: `components/`, `lib/`
  - Quick win: banner UI only

### Marketing
- Abandoned Cart Flow (P1)
  - Goal: email sequence
  - Risk: spam
  - Files: `pages/api/`, `lib/`
  - Quick win: save cart email

### Support
- WhatsApp Floating Button (P2)
  - Goal: quick support
  - Risk: UI overlap
  - Files: `components/StickyBar.jsx`
  - Quick win: simple CTA

### Content
- FAQ + Policy Pages (P0)
  - Goal: manageable content
  - Risk: outdated copy
  - Files: `pages/`, `components/PolicyPage.jsx`
  - Quick win: static pages

### Admin
- Admin Content (P0)
  - Goal: edit homepage blocks
  - Risk: permissions
  - Files: `pages/admin.jsx`, `lib/admin-*`
  - Quick win: simple CMS form
- Admin Product CRUD (P0)
  - Goal: manage products + media
  - Risk: data loss
  - Files: `pages/admin.jsx`, `lib/`
  - Quick win: CSV import/export
- Admin Campaigns (P0)
  - Goal: discounts rules
  - Risk: rule conflicts
  - Files: `lib/coupons.js`, `pages/admin.jsx`
  - Quick win: simple percent discount
- Admin Orders (P0)
  - Goal: manage order status
  - Risk: permission leakage
  - Files: `pages/admin.jsx`, `lib/`
  - Quick win: status update

### Security
- Rate Limit + Bot (P0)
  - Goal: protect endpoints
  - Risk: false positives
  - Files: `lib/rate-limit.ts`, `pages/api/`
  - Quick win: basic throttle
- Input Validation (P0)
  - Goal: Zod validation
  - Risk: breaking forms
  - Files: `lib/validators/`, `pages/api/`
  - Quick win: validate checkout payload

### DevEx
- Sentry (P1)
  - Goal: error visibility
  - Risk: PII
  - Files: `lib/`, `pages/_app.js`
  - Quick win: basic error capture
- CI Pipeline (P1)
  - Goal: lint/build checks
  - Risk: flaky tests
  - Files: `.github/workflows/`
  - Quick win: lint + build only
- Playwright Smoke (P1)
  - Goal: checkout smoke test
  - Risk: flake
  - Files: `tests/`
  - Quick win: one happy path

### UX
- Skeleton/Empty states (P0)
  - Goal: consistent states
  - Risk: inconsistent UI
  - Files: `components/Skeletons.jsx`, `components/EmptyState.jsx`
  - Quick win: standard empty state
- Toasts (P2)
  - Goal: consistent notifications
  - Risk: spam
  - Files: `components/`, `context/StateContext.js`
  - Quick win: one toast util

### Footer
- Dynamic Footer (P0)
  - Goal: real contact/socials
  - Risk: stale info
  - Files: `components/Footer.jsx`, `constants/contact.js`
  - Quick win: pull from constants

### Product Data
- Tag Taxonomy (P0)
  - Goal: consistent filters
  - Risk: data mismatch
  - Files: `lib/catalog.js`, `constants/filters.js`
  - Quick win: map tags to filters

### Search
- Relevancy + DidYouMean (P1)
  - Goal: better results
  - Risk: complexity
  - Files: `lib/searchService.js`, `pages/search.jsx`
  - Quick win: keyword weight

### PWA (P2)
- Goal: installable app
- Risk: cache bugs
- Files: `public/manifest.json`, `pages/_app.js`
- Quick win: manifest only

### Docs (P1)
- Goal: setup docs + env example
- Risk: drift
- Files: `README.md`, `docs/`
- Quick win: ENV template

---

## Fast Start (Suggested)
1) Fix homepage data source and category menu
2) Implement Search Modal + Mini Cart
3) Clean SEO meta + Product schema
4) Admin content controls for hero + footer
