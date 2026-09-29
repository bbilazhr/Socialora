import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership } from "@/lib/auth";

async function assertBrandAccess(userId: string, brandId: string) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    const err = new Error("Brand tidak ditemukan");
    (err as any).status = 404;
    throw err;
  }
  await requireMembership(userId, brand.workspaceId);
  return brand;
}

// List content for a brand, with optional filters used by Content Database,
// Kanban Board and Calendar (they all share this one endpoint).
export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const brandId = req.nextUrl.searchParams.get("brandId");
    if (!brandId) return NextResponse.json({ error: "brandId wajib diisi" }, { status: 400 });
    await assertBrandAccess(session.userId, brandId);

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const funnel = searchParams.get("funnel") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const q = searchParams.get("q") || undefined;

    const contents = await prisma.content.findMany({
      where: {
        brandId,
        ...(status ? { status: status as any } : {}),
        ...(funnel ? { funnel: funnel as any } : {}),
        ...(platform ? { platform } : {}),
        ...(q ? { title: { contains: q } } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ contents });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

const createSchema = z.object({
  brandId: z.string(),
  title: z.string().min(1, "Judul wajib diisi"),
  platform: z.string().default("instagram"),
  format: z.string().default("Video"),
  pillar: z.string().optional(),
  funnel: z.enum(["TOFU", "MOFU", "BOFU"]).default("TOFU"),
  status: z.enum(["IDEATION", "SCRIPTING", "TAKE_KONTEN", "EDITING", "REVIEW", "SCHEDULED", "PUBLISHED"]).default("IDEATION"),
  postUrl: z.string().optional(),
  scriptText: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    await assertBrandAccess(session.userId, parsed.data.brandId);

    const content = await prisma.content.create({
      data: {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      },
    });
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
