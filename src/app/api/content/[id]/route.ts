import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership } from "@/lib/auth";

async function loadWithAccess(userId: string, id: string) {
  const content = await prisma.content.findUnique({ where: { id }, include: { brand: true } });
  if (!content) {
    const err = new Error("Konten tidak ditemukan");
    (err as any).status = 404;
    throw err;
  }
  await requireMembership(userId, content.brand.workspaceId);
  return content;
}

// Generic update — used by the edit modal, the Kanban drag-and-drop
// (status only), and the approval dropdown in Content Database.
const patchSchema = z.object({
  title: z.string().min(1).optional(),
  platform: z.string().optional(),
  format: z.string().optional(),
  pillar: z.string().nullable().optional(),
  funnel: z.enum(["TOFU", "MOFU", "BOFU"]).optional(),
  status: z.enum(["IDEATION", "SCRIPTING", "TAKE_KONTEN", "EDITING", "REVIEW", "SCHEDULED", "PUBLISHED"]).optional(),
  approval: z.enum(["PENDING", "APPROVED", "REVISION"]).optional(),
  postUrl: z.string().nullable().optional(),
  scriptText: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  views: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  saves: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  gmv: z.number().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    await loadWithAccess(session.userId, params.id);

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const { scheduledAt, publishedAt, ...rest } = parsed.data;
    const updated = await prisma.content.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
        ...(publishedAt !== undefined ? { publishedAt: publishedAt ? new Date(publishedAt) : null } : {}),
      },
    });

    // Log a metric snapshot whenever engagement numbers move, so trend
    // charts have real history to plot.
    if (["views", "likes", "comments", "shares"].some((k) => k in parsed.data)) {
      await prisma.metricSnapshot.create({
        data: {
          contentId: params.id,
          views: updated.views,
          likes: updated.likes,
          comments: updated.comments,
          shares: updated.shares,
        },
      });
    }

    return NextResponse.json({ content: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    await loadWithAccess(session.userId, params.id);
    await prisma.content.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
