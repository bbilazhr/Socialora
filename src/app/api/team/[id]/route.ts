import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership, requireRoleAtLeast } from "@/lib/auth";

// Change a member's role, or remove them from the workspace.
const patchSchema = z.object({ role: z.enum(["OWNER", "ADMIN", "SPECIALIST", "CREATOR", "CLIENT"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const target = await prisma.membership.findUnique({ where: { id: params.id } });
    if (!target) return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });

    const membership = await requireMembership(session.userId, target.workspaceId);
    requireRoleAtLeast(membership.role, "ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });

    const updated = await prisma.membership.update({ where: { id: params.id }, data: { role: parsed.data.role } });
    return NextResponse.json({ membership: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const target = await prisma.membership.findUnique({ where: { id: params.id } });
    if (!target) return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });

    const membership = await requireMembership(session.userId, target.workspaceId);
    requireRoleAtLeast(membership.role, "ADMIN");

    await prisma.membership.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
