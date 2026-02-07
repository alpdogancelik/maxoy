import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermissionFromRequest } from "@/lib/admin-permissions-server";
import { HomeConfigSchema } from "@/lib/validators/home";
import { logAdminAction } from "@/lib/admin-audit";
import { AuditAction } from "@prisma/client";

async function getHome() {
  const existing = await prisma.homePage.findFirst({
    include: {
      announcements: true,
      heroSlides: true,
      categoryCards: true,
      featured: true,
      trustBadges: true,
    },
  });
  if (existing) return existing;
  return prisma.homePage.create({
    data: {},
    include: {
      announcements: true,
      heroSlides: true,
      categoryCards: true,
      featured: true,
      trustBadges: true,
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "home-builder:read");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  try {
    const home = await getHome();
    return NextResponse.json({
      announcements: home.announcements,
      heroSlides: home.heroSlides,
      categoryCards: home.categoryCards,
      featuredProducts: home.featured,
      trustBadges: home.trustBadges,
      status: home.status,
      publishedAt: home.publishedAt,
    });
  } catch {
    return NextResponse.json({ error: "Database unavailable", dbOffline: true }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermissionFromRequest(request, "home-builder:update");
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.forbidden ? "Forbidden" : "Unauthorized" },
      { status: auth.forbidden ? 403 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = HomeConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const home = await getHome();

    await prisma.$transaction([
      prisma.announcement.deleteMany({ where: { homePageId: home.id } }),
      prisma.heroSlide.deleteMany({ where: { homePageId: home.id } }),
      prisma.categoryCard.deleteMany({ where: { homePageId: home.id } }),
      prisma.homeFeaturedProduct.deleteMany({ where: { homePageId: home.id } }),
      prisma.trustBadge.deleteMany({ where: { homePageId: home.id } }),
    ]);

    await prisma.$transaction([
      prisma.announcement.createMany({
        data: (parsed.data.announcements || []).map((item, index) => ({
          homePageId: home.id,
          messageTR: item.messageTR,
          messageEN: item.messageEN,
          sortOrder: item.sortOrder ?? index,
          isActive: item.isActive ?? true,
        })),
      }),
      prisma.heroSlide.createMany({
        data: (parsed.data.heroSlides || []).map((item, index) => ({
          homePageId: home.id,
          titleTR: item.titleTR,
          titleEN: item.titleEN,
          subtitleTR: item.subtitleTR || null,
          subtitleEN: item.subtitleEN || null,
          ctaTextTR: item.ctaTextTR || null,
          ctaTextEN: item.ctaTextEN || null,
          ctaLink: item.ctaLink || null,
          imageAssetId: item.imageAssetId,
          sortOrder: item.sortOrder ?? index,
          isActive: item.isActive ?? true,
        })),
      }),
      prisma.categoryCard.createMany({
        data: (parsed.data.categoryCards || []).map((item, index) => ({
          homePageId: home.id,
          titleTR: item.titleTR,
          titleEN: item.titleEN,
          descriptionTR: item.descriptionTR || null,
          descriptionEN: item.descriptionEN || null,
          link: item.link || null,
          themeColor: item.themeColor || null,
          imageAssetId: item.imageAssetId,
          sortOrder: item.sortOrder ?? index,
        })),
      }),
      prisma.homeFeaturedProduct.createMany({
        data: (parsed.data.featuredProducts || []).map((item, index) => ({
          homePageId: home.id,
          productId: item.productId,
          sortOrder: item.sortOrder ?? index,
        })),
      }),
      prisma.trustBadge.createMany({
        data: (parsed.data.trustBadges || []).map((item, index) => ({
          homePageId: home.id,
          icon: item.icon,
          textTR: item.textTR,
          textEN: item.textEN,
          sortOrder: item.sortOrder ?? index,
        })),
      }),
    ]);

    await prisma.homePage.update({ where: { id: home.id }, data: { status: "DRAFT" } });

    await logAdminAction({
      actorId: auth.user.id,
      action: AuditAction.UPDATE,
      entityType: "HomePage",
      entityId: home.id,
      after: parsed.data,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

