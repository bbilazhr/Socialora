import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership } from "@/lib/auth";
import { computeFunnel, computeGoalHealth } from "@/lib/data";

// One endpoint powers Dashboard, Analytics and Report — the funnel math,
// goal health, and a day-by-day engagement trend for the last N days.
export async function GET(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const session = requireSession();
    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand) return NextResponse.json({ error: "Brand tidak ditemukan" }, { status: 404 });
    await requireMembership(session.userId, brand.workspaceId);

    const days = Number(req.nextUrl.searchParams.get("days") ?? 7);
    const platform = req.nextUrl.searchParams.get("platform") || undefined;

    const contents = await prisma.content.findMany({
      where: { brandId: params.brandId, ...(platform ? { platform } : {}) },
    });
    const funnel = computeFunnel(contents);

    const goals = await prisma.goal.findMany({ where: { brandId: params.brandId } });
    const goalHealth = goals.map((g) => ({ ...g, health: computeGoalHealth(g) }));

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const snapshots = await prisma.metricSnapshot.findMany({
      where: { content: { brandId: params.brandId }, capturedAt: { gte: since } },
      orderBy: { capturedAt: "asc" },
    });

    // Bucket snapshots per calendar day for the trend chart.
    const byDay = new Map<string, { views: number; engagement: number }>();
    for (const s of snapshots) {
      const key = s.capturedAt.toISOString().slice(0, 10);
      const prev = byDay.get(key) ?? { views: 0, engagement: 0 };
      prev.views += s.views;
      prev.engagement += s.likes + s.comments + s.shares;
      byDay.set(key, prev);
    }
    const trend = Array.from(byDay.entries()).map(([date, v]) => ({
      date,
      engagementRate: v.views > 0 ? Number(((v.engagement / v.views) * 100).toFixed(2)) : 0,
    }));

    const totals = {
      totalContent: contents.length,
      published: contents.filter((c) => c.status === "PUBLISHED").length,
      scheduled: contents.filter((c) => c.status === "SCHEDULED").length,
      avgEngagementRate: Number(funnel.engagementRate.toFixed(1)),
    };

    const topContent = [...contents].sort((a, b) => b.views - a.views).slice(0, 5);
    const upcoming = contents
      .filter((c) => c.scheduledAt && new Date(c.scheduledAt) >= new Date())
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .slice(0, 5);

    return NextResponse.json({ funnel, goalHealth, trend, totals, topContent, upcoming });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
