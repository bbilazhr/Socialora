import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership, requireRoleAtLeast } from "@/lib/auth";

// List brands for a workspace the current user belongs to.
export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId wajib diisi" }, { status: 400 });
    await requireMembership(session.userId, workspaceId);

    const brands = await prisma.brand.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ brands });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

// Manually add a new brand into a workspace ("bisa masukin brand-brand nya
// manually"). Requires at least SPECIALIST role.
const createSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1, "Nama brand wajib diisi"),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const membership = await requireMembership(session.userId, parsed.data.workspaceId);
    requireRoleAtLeast(membership.role, "SPECIALIST");

    const brand = await prisma.brand.create({
      data: { workspaceId: parsed.data.workspaceId, name: parsed.data.name },
    });
    return NextResponse.json({ brand });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
