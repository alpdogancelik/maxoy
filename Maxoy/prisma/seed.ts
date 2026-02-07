import bcrypt from "bcryptjs";
import { Prisma, PrismaClient, PublishStatus, RoleName } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@maxoy.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const roles = [RoleName.ADMIN, RoleName.EDITOR, RoleName.VIEWER, RoleName.ORDER_MANAGER];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.ADMIN } });
  if (!adminRole) {
    throw new Error("Admin role missing after seed");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: "Maxoy Admin",
        passwordHash,
        roleId: adminRole.id,
      },
    });
  }

  const settings = await prisma.settings.findFirst();
  if (!settings) {
    await prisma.settings.create({
      data: {
        data: {
          brand: { siteName: "Maxoy", logoAssetId: null, faviconAssetId: null },
          contact: { phone: "", whatsapp: "", email: "", address: "" },
          shipping: { freeShippingThreshold: 0, estimatedDaysTextTR: "", estimatedDaysTextEN: "" },
          social: { instagram: "", facebook: "", tiktok: "" },
          legal: { companyName: "", taxOffice: "", taxNo: "" },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Demo data (idempotent)
  // ---------------------------------------------------------------------------

  const actor = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

  const heroAsset = await prisma.mediaAsset.upsert({
    where: { key: "hero-image.png" },
    update: { url: "/hero-image.png", mime: "image/png", size: 0, altText: "Maxoy hero image", folder: "seed" },
    create: { key: "hero-image.png", url: "/hero-image.png", mime: "image/png", size: 0, altText: "Maxoy hero image", folder: "seed" },
  });

  const placeholderAsset = await prisma.mediaAsset.upsert({
    where: { key: "placeholder-product.png" },
    update: { url: "/placeholder-product.png", mime: "image/png", size: 0, altText: "Maxoy product placeholder", folder: "seed" },
    create: { key: "placeholder-product.png", url: "/placeholder-product.png", mime: "image/png", size: 0, altText: "Maxoy product placeholder", folder: "seed" },
  });

  const categories = [
    { slug: "maxoy-koleksiyon", nameTR: "Maxoy Koleksiyon", nameEN: "Maxoy Collection", sortOrder: 1 },
    { slug: "dekor", nameTR: "Dekor", nameEN: "Decor", sortOrder: 2 },
    { slug: "hediyelik", nameTR: "Hediyelik", nameEN: "Gifts", sortOrder: 3 },
  ];

  const categoryRecords = [];
  for (const c of categories) {
    categoryRecords.push(
      await prisma.category.upsert({
        where: { slug: c.slug },
        update: { nameTR: c.nameTR, nameEN: c.nameEN, isActive: true, sortOrder: c.sortOrder, imageAssetId: placeholderAsset.id },
        create: { slug: c.slug, nameTR: c.nameTR, nameEN: c.nameEN, isActive: true, sortOrder: c.sortOrder, imageAssetId: placeholderAsset.id },
      })
    );
  }

  const products = [
    {
      sku: "MAX-001",
      slug: "maxoy-baslangic-seti",
      nameTR: "Maxoy Başlangıç Seti",
      nameEN: "Maxoy Starter Set",
      categorySlug: "maxoy-koleksiyon",
      priceRetail: "299.90",
      stockQty: 25,
      isFeatured: true,
      tags: ["maxoy", "starter"],
    },
    {
      sku: "MAX-002",
      slug: "minimal-vazo",
      nameTR: "Minimal Vazo",
      nameEN: "Minimal Vase",
      categorySlug: "dekor",
      priceRetail: "149.90",
      stockQty: 50,
      isFeatured: false,
      tags: ["decor"],
    },
    {
      sku: "MAX-003",
      slug: "hediye-kutusu",
      nameTR: "Hediye Kutusu",
      nameEN: "Gift Box",
      categorySlug: "hediyelik",
      priceRetail: "199.90",
      stockQty: 40,
      isFeatured: true,
      tags: ["gift"],
    },
    {
      sku: "MAX-004",
      slug: "premium-ambalaj",
      nameTR: "Premium Ambalaj",
      nameEN: "Premium Packaging",
      categorySlug: "hediyelik",
      priceRetail: "59.90",
      stockQty: 120,
      isFeatured: false,
      tags: ["packaging"],
    },
    {
      sku: "MAX-005",
      slug: "dekoratif-sepet",
      nameTR: "Dekoratif Sepet",
      nameEN: "Decorative Basket",
      categorySlug: "dekor",
      priceRetail: "239.90",
      stockQty: 12,
      isFeatured: false,
      tags: ["decor"],
    },
  ];

  const productRecords = [];
  for (const p of products) {
    const category = categoryRecords.find((c) => c.slug === p.categorySlug) || categoryRecords[0];
    const record = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        nameTR: p.nameTR,
        nameEN: p.nameEN,
        slug: p.slug,
        categoryId: category.id,
        priceRetail: new Prisma.Decimal(p.priceRetail),
        stockQty: p.stockQty,
        isActive: true,
        isFeatured: p.isFeatured,
        tags: p.tags,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        sku: p.sku,
        slug: p.slug,
        nameTR: p.nameTR,
        nameEN: p.nameEN,
        categoryId: category.id,
        priceRetail: new Prisma.Decimal(p.priceRetail),
        stockQty: p.stockQty,
        isActive: true,
        isFeatured: p.isFeatured,
        tags: p.tags,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    productRecords.push(record);

    await prisma.productMedia.upsert({
      where: { productId_mediaId: { productId: record.id, mediaId: placeholderAsset.id } },
      update: { sortOrder: 0 },
      create: { productId: record.id, mediaId: placeholderAsset.id, sortOrder: 0 },
    });
  }

  // Home page demo
  const home = await prisma.homePage.findFirst().catch(() => null);
  const homePage = home
    ? await prisma.homePage.update({ where: { id: home.id }, data: { status: PublishStatus.DRAFT } })
    : await prisma.homePage.create({ data: { status: PublishStatus.DRAFT } });

  await prisma.announcement.deleteMany({ where: { homePageId: homePage.id } });
  await prisma.heroSlide.deleteMany({ where: { homePageId: homePage.id } });
  await prisma.categoryCard.deleteMany({ where: { homePageId: homePage.id } });
  await prisma.homeFeaturedProduct.deleteMany({ where: { homePageId: homePage.id } });
  await prisma.trustBadge.deleteMany({ where: { homePageId: homePage.id } });

  await prisma.announcement.createMany({
    data: [
      { homePageId: homePage.id, messageTR: "Maxoy demo admin kurulumu hazır.", messageEN: "Maxoy demo admin is ready.", sortOrder: 0, isActive: true },
    ],
  });

  await prisma.heroSlide.createMany({
    data: [
      {
        homePageId: homePage.id,
        titleTR: "Maxoy Admin Demo",
        titleEN: "Maxoy Admin Demo",
        subtitleTR: "Yerel veritabanı + gerçek CRUD",
        subtitleEN: "Local DB + real CRUD",
        ctaTextTR: "Katalog",
        ctaTextEN: "Catalog",
        ctaLink: "/",
        imageAssetId: heroAsset.id,
        sortOrder: 0,
        isActive: true,
      },
    ],
  });

  await prisma.trustBadge.createMany({
    data: [
      { homePageId: homePage.id, icon: "truck", textTR: "Hızlı kargo", textEN: "Fast shipping", sortOrder: 0 },
      { homePageId: homePage.id, icon: "shield", textTR: "Güvenli ödeme", textEN: "Secure payment", sortOrder: 1 },
    ],
  });

  await prisma.homeFeaturedProduct.createMany({
    data: productRecords.slice(0, 3).map((product, index) => ({
      homePageId: homePage.id,
      productId: product.id,
      sortOrder: index,
    })),
  });

  // Catalog pages demo (keeps URL paths stable)
  const catalogPages = [
    { key: "COLLECTION", path: "/koleksiyon", titleTR: "Koleksiyon", titleEN: "Collection", sortOrder: 0 },
    { key: "GIFTS", path: "/hediyelik", titleTR: "Hediyelik", titleEN: "Gifts", sortOrder: 1 },
  ];
  for (const p of catalogPages) {
    await prisma.catalogPage.upsert({
      where: { key: p.key },
      update: { path: p.path, titleTR: p.titleTR, titleEN: p.titleEN, sortOrder: p.sortOrder, status: PublishStatus.PUBLISHED, publishedAt: new Date() },
      create: { key: p.key, path: p.path, titleTR: p.titleTR, titleEN: p.titleEN, sortOrder: p.sortOrder, navVisible: true, status: PublishStatus.PUBLISHED, publishedAt: new Date(), allowedMainCategories: [], allowedSubcategories: [] },
    });
  }

  // Orders demo
  const customer = await prisma.customerInfo.upsert({
    where: { phone: "+905555551234" },
    update: { fullName: "Maxoy Demo Customer" },
    create: { fullName: "Maxoy Demo Customer", phone: "+905555551234", email: "demo@maxoy.local", whatsapp: "+905555551234" },
  });
  const address = await prisma.address.create({
    data: { line1: "Demo Street 1", line2: null, city: "Istanbul", district: "Kadikoy", postalCode: "34000", country: "TR" },
  });

  const existingOrder = await prisma.order.findFirst({ where: { customerInfoId: customer.id } });
  if (!existingOrder) {
    const itemA = productRecords[0];
    const itemB = productRecords[1];
    const qtyA = 1;
    const qtyB = 2;
    const priceA = itemA.priceRetail as any as Prisma.Decimal;
    const priceB = itemB.priceRetail as any as Prisma.Decimal;
    const subtotal = priceA.mul(qtyA).add(priceB.mul(qtyB));
    const total = subtotal;

    await prisma.order.create({
      data: {
        status: "PAID",
        paymentMethod: "WHATSAPP",
        customerInfoId: customer.id,
        addressId: address.id,
        subtotal,
        total,
        shippingNote: "Seeded demo order",
        adminNote: "Maxoy demo",
        items: {
          create: [
            { productId: itemA.id, productName: itemA.nameTR, sku: itemA.sku, price: priceA, quantity: qtyA, lineTotal: priceA.mul(qtyA) },
            { productId: itemB.id, productName: itemB.nameTR, sku: itemB.sku, price: priceB, quantity: qtyB, lineTotal: priceB.mul(qtyB) },
          ],
        },
      },
    });
  }

  // Minimal audit trail demo so Activity isn't empty.
  if (actor) {
    const existingLog = await prisma.auditLog.findFirst({ where: { actorId: actor.id } });
    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "CREATE",
          entityType: "Seed",
          entityId: "maxoy-demo",
          before: Prisma.DbNull,
          after: { ok: true, brand: "Maxoy" },
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
