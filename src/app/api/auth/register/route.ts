import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  workspaceName: z.string().min(2, "Nama workspace minimal 2 karakter"),
});

// Registering creates the User AND their first Workspace in one step —
// that workspace is where they'll add brands next.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const { name, email, password, workspaceName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  const workspace = await prisma.workspace.create({ data: { name: workspaceName } });
  await prisma.membership.create({
    data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
  });
  await prisma.brand.create({
    data: { workspaceId: workspace.id, name: "Brand Pertama Saya" },
  });

  // If a teammate invited this email before they had an account, honor it:
  // join them into that workspace too, with the role they were invited as.
  const pendingInvites = await prisma.invite.findMany({ where: { email } });
  for (const invite of pendingInvites) {
    await prisma.membership.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
      update: {},
      create: { userId: user.id, workspaceId: invite.workspaceId, role: invite.role },
    });
  }
  if (pendingInvites.length > 0) {
    await prisma.invite.deleteMany({ where: { email } });
  }

  const token = signSession({ userId: user.id, email: user.email, name: user.name });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
