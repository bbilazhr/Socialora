import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo data shaped to roughly mirror the reference screenshots, so logging
// in with the seeded account immediately shows a populated dashboard
// instead of an empty state.
async function main() {
  const email = "demo@socialora.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed skipped — demo user already exists.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: { name: "Rilsa Rilfidila", email, passwordHash },
  });

  const workspace = await prisma.workspace.create({ data: { name: "Ceritanya Agency" } });
  await prisma.membership.create({ data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" } });

  const brand = await prisma.brand.create({
    data: {
      workspaceId: workspace.id,
      name: "Ceritanya Brand",
      primaryColor: "#2563eb",
      accentColor: "#f59e0b",
    },
  });

  const secondBrand = await prisma.brand.create({
    data: {
      workspaceId: workspace.id,
      name: "Kopi Senja",
      primaryColor: "#059669",
      accentColor: "#f97316",
    },
  });

  const titles = [
    { title: "Kenapa ikan sapu-sapu nyapu doang tapi gak ngepel", platform: "instagram", funnel: "TOFU", status: "PUBLISHED", views: 1230000, likes: 88000, comments: 2100, shares: 4400 },
    { title: 'Kenapa konten "bagus" bisa sepi?', platform: "instagram", funnel: "TOFU", status: "PUBLISHED", views: 980000, likes: 71000, comments: 1800, shares: 3100 },
    { title: "3 tanda konten lu keliatan desperate jualan", platform: "instagram", funnel: "MOFU", status: "PUBLISHED", views: 12300000, likes: 445000, comments: 12000, shares: 61000 },
    { title: "Template hook buat orang yang jualan di Instagram", platform: "instagram", funnel: "TOFU", status: "PUBLISHED", views: 560000, likes: 34000, comments: 900, shares: 2200 },
    { title: "Cara cari jutaan ide konten bahkan tanpa AI", platform: "instagram", funnel: "MOFU", status: "PUBLISHED", views: 2100000, likes: 156000, comments: 5400, shares: 9800 },
    { title: "Bangga FYP? Views jutaan? Emang pasti bakal cuan?", platform: "instagram", funnel: "TOFU", status: "PUBLISHED", views: 3400000, likes: 210000, comments: 7600, shares: 14000 },
    { title: "Bedah konten brand yang jualan tanpa keliatan jualan", platform: "instagram", funnel: "MOFU", status: "PUBLISHED", views: 1850000, likes: 132000, comments: 4100, shares: 8700 },
    { title: "satu tambah satu sama gufron", platform: "tiktok", funnel: "TOFU", status: "PUBLISHED", views: 410000, likes: 22000, comments: 600, shares: 1300 },
    { title: "Cara makan nasi padang yang bener", platform: "instagram", funnel: "TOFU", status: "SCHEDULED", views: 0, likes: 0, comments: 0, shares: 0 },
    { title: "Cara traveling tanpa mikir uang", platform: "instagram", funnel: "TOFU", status: "IDEATION", views: 0, likes: 0, comments: 0, shares: 0 },
    { title: "cara cepat kaya (Copy)", platform: "instagram", funnel: "TOFU", status: "IDEATION", views: 0, likes: 0, comments: 0, shares: 0 },
    { title: "Gimana cara nemu jodoh? ya tinggal cari", platform: "instagram", funnel: "BOFU", status: "SCRIPTING", views: 0, likes: 0, comments: 0, shares: 0 },
    { title: "Contoh Konten Edukasi", platform: "instagram", funnel: "TOFU", status: "SCRIPTING", views: 0, likes: 0, comments: 0, shares: 0 },
    { title: "Contoh Konten Promosi", platform: "tiktok", funnel: "BOFU", status: "SCRIPTING", views: 0, likes: 0, comments: 0, shares: 0 },
    { title: "test baru", platform: "instagram", funnel: "MOFU", status: "TAKE_KONTEN", approval: "APPROVED", views: 0, likes: 0, comments: 0, shares: 0 },
    { title: "cara cepat kaya", platform: "instagram", funnel: "TOFU", status: "EDITING", views: 0, likes: 0, comments: 0, shares: 0 },
  ] as const;

  for (const t of titles) {
    const clicks = Math.round(t.views * 0.01);
    const conversions = Math.round(clicks * 0.03);
    await prisma.content.create({
      data: {
        brandId: brand.id,
        title: t.title,
        platform: t.platform,
        format: "Video",
        funnel: t.funnel as any,
        status: t.status as any,
        approval: (t as any).approval ?? "PENDING",
        views: t.views,
        likes: t.likes,
        comments: t.comments,
        shares: t.shares,
        saves: Math.round(t.likes * 0.1),
        clicks,
        conversions,
        gmv: conversions * 85000,
        scheduledAt: t.status === "SCHEDULED" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
        publishedAt: t.status === "PUBLISHED" ? new Date() : null,
      },
    });
  }

  // A week of metric snapshots for the engagement trend chart.
  const allContent = await prisma.content.findMany({ where: { brandId: brand.id, status: "PUBLISHED" } });
  const shape = [4200, 180, 210, 260, 300, 340, 4557];
  for (let day = 0; day < 7; day++) {
    const capturedAt = new Date(Date.now() - (6 - day) * 24 * 60 * 60 * 1000);
    for (const c of allContent) {
      await prisma.metricSnapshot.create({
        data: {
          contentId: c.id,
          views: Math.round((c.views / 7) * (shape[day] / 4557)),
          likes: Math.round((c.likes / 7) * (shape[day] / 4557)),
          comments: Math.round((c.comments / 7) * (shape[day] / 4557)),
          shares: Math.round((c.shares / 7) * (shape[day] / 4557)),
          capturedAt,
        },
      });
    }
  }

  await prisma.goal.createMany({
    data: [
      { brandId: brand.id, platform: "instagram", metric: "VIEWS", targetValue: 15000000, currentValue: 10131452, startDate: new Date(Date.now() - 120 * 86400000), deadline: new Date(Date.now() - 30 * 86400000) },
      { brandId: brand.id, platform: "instagram", metric: "FOLLOWERS", targetValue: 50000, currentValue: 23456, startDate: new Date(Date.now() - 120 * 86400000), deadline: new Date(Date.now() - 30 * 86400000) },
      { brandId: brand.id, platform: "instagram", metric: "GMV", targetValue: 1000000000, currentValue: 100000, startDate: new Date(Date.now() - 90 * 86400000), deadline: new Date(Date.now() - 25 * 86400000) },
    ],
  });

  await prisma.aIConversation.create({
    data: {
      brandId: brand.id,
      title: "analisa konten guee, trus kasih insightnya!",
      messages: {
        create: [
          { role: "user", content: "analisa konten guee, trus kasih insightnya!" },
          { role: "assistant", content: 'Oke, gue coba bedah konten lu ya. Konten yang paling nendang dari brand lu itu cenderung yang ngajak audiens mikir tentang jualan atau promosi, tapi dibungkus secara cerdas — contohnya "3 tanda konten lu keliatan desperate jualan" dengan 12.3M views.' },
        ],
      },
    },
  });

  console.log("✅ Seed complete.");
  console.log(`   Login: ${email} / password123`);
  console.log(`   Workspace: ${workspace.name} — Brands: ${brand.name}, ${secondBrand.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
