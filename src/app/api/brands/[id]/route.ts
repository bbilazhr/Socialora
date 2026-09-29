import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership, requireRoleAtLeast } from "@/lib/auth";

// Edit brand identity: name, logo (data URL), primary/accent color.
// This is what powers the per-brand theme + Settings > Brand page.
const patchSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const brand = await prisma.brand.findUnique({ where: { id: params.id } });
    if (!brand) return NextResponse.json({ error: "Brand tidak ditemukan" }, { status: 404 });

    const membership = await requireMembership(session.userId, brand.workspaceId);
    requireRoleAtLeast(membership.role, "SPECIALIST");

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const updated = await prisma.brand.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ brand: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const brand = await prisma.brand.findUnique({ where: { id: params.id } });
    if (!brand) return NextResponse.json({ error: "Brand tidak ditemukan" }, { status: 404 });

    const membership = await requireMembership(session.userId, brand.workspaceId);
    requireRoleAtLeast(membership.role, "ADMIN");

    await prisma.brand.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
