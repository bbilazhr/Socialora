import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership, requireRoleAtLeast, hashPassword } from "@/lib/auth";

// List every member (+ pending invites) of a workspace, for Settings > Team.
export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId wajib diisi" }, { status: 400 });
    await requireMembership(session.userId, workspaceId);

    const memberships = await prisma.membership.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    const invites = await prisma.invite.findMany({ where: { workspaceId } });

    return NextResponse.json({ members: memberships, invites });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

// Invite a teammate by email with a starting role. If the email already has
// an account, they're added to the workspace immediately; otherwise a
// pending Invite is stored and applied automatically the moment they
// register with that same email (see /api/auth/register).
const inviteSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "SPECIALIST", "CREATOR", "CLIENT"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => null);
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data undangan tidak valid" }, { status: 400 });

    const membership = await requireMembership(session.userId, parsed.data.workspaceId);
    requireRoleAtLeast(membership.role, "ADMIN");

    const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existingUser) {
      const already = await prisma.membership.findUnique({
        where: { userId_workspaceId: { userId: existingUser.id, workspaceId: parsed.data.workspaceId } },
      });
      if (already) return NextResponse.json({ error: "User ini sudah jadi anggota tim" }, { status: 409 });

      const created = await prisma.membership.create({
        data: { userId: existingUser.id, workspaceId: parsed.data.workspaceId, role: parsed.data.role },
      });
      return NextResponse.json({ membership: created });
    }

    const invite = await prisma.invite.create({ data: parsed.data });
    return NextResponse.json({ invite });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
