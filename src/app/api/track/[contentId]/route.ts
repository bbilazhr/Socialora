import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership } from "@/lib/auth";

/**
 * Link tracking ("melacak by link platform sosmed").
 *
 * Honest limitation, documented here rather than faked: Instagram, TikTok
 * and most short-video platforms do not expose public metric APIs without
 * an authenticated developer app, and headless-scraping them at scale
 * requires a rotating-proxy/Playwright worker (see README "Production
 * scraping" section for how FEATURE 2 of the spec would be wired up with
 * BullMQ + Playwright workers).
 *
 * What this route does for real, right now:
 *  - YouTube: calls YouTube's public oEmbed endpoint to confirm the link
 *    resolves and pull its title/thumbnail (no API key required).
 *  - Every platform: takes whatever manual metrics are already stored on
 *    the Content row and writes a MetricSnapshot, so the trend chart still
 *    has a real history to plot even before automated scraping exists.
 */
export async function POST(_req: Request, { params }: { params: { contentId: string } }) {
  try {
    const session = requireSession();
    const content = await prisma.content.findUnique({ where: { id: params.contentId }, include: { brand: true } });
    if (!content) return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
    await requireMembership(session.userId, content.brand.workspaceId);

    let note = "Snapshot dibuat dari metrik manual yang sudah tersimpan.";

    if (content.postUrl && content.platform === "youtube") {
      try {
        const oembed = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(content.postUrl)}&format=json`
        );
        if (oembed.ok) {
          const data = await oembed.json();
          note = `Link terverifikasi via YouTube oEmbed: "${data.title}".`;
        }
      } catch {
        note = "Link tidak bisa diverifikasi otomatis — cek URL-nya.";
      }
    } else if (content.postUrl) {
      note = `Scraping otomatis untuk platform "${content.platform}" butuh worker Playwright + proxy (lihat README). Untuk sekarang, update metrik secara manual lalu klik Refresh untuk mencatat snapshot.`;
    }

    const snapshot = await prisma.metricSnapshot.create({
      data: {
        contentId: content.id,
        views: content.views,
        likes: content.likes,
        comments: content.comments,
        shares: content.shares,
      },
    });

    return NextResponse.json({ snapshot, note });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
