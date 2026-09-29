import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const brandId = req.nextUrl.searchParams.get("brandId");
    if (!brandId) return NextResponse.json({ error: "brandId wajib diisi" }, { status: 400 });

    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) return NextResponse.json({ error: "Brand tidak ditemukan" }, { status: 404 });
    await requireMembership(session.userId, brand.workspaceId);

    const goals = await prisma.goal.findMany({ where: { brandId }, orderBy: { deadline: "asc" } });
    return NextResponse.json({ goals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

const createSchema = z.object({
  brandId: z.string(),
  platform: z.string(),
  metric: z.string(),
  targetValue: z.number().positive(),
  currentValue: z.number().min(0).default(0),
  deadline: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data goal tidak valid" }, { status: 400 });

    const brand = await prisma.brand.findUnique({ where: { id: parsed.data.brandId } });
    if (!brand) return NextResponse.json({ error: "Brand tidak ditemukan" }, { status: 404 });
    await requireMembership(session.userId, brand.workspaceId);

    const goal = await prisma.goal.create({
      data: { ...parsed.data, deadline: new Date(parsed.data.deadline) },
    });
    return NextResponse.json({ goal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
