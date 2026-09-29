import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// Create an additional workspace (e.g. an agency onboarding a second client
// org). The creator automatically becomes OWNER.
export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => null);
    const schema = z.object({ name: z.string().min(2) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Nama workspace tidak valid" }, { status: 400 });

    const workspace = await prisma.workspace.create({ data: { name: parsed.data.name } });
    await prisma.membership.create({
      data: { userId: session.userId, workspaceId: workspace.id, role: "OWNER" },
    });
    return NextResponse.json({ workspace });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
