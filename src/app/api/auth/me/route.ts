import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const memberships = await prisma.membership.findMany({
    where: { userId: session.userId },
    include: { workspace: { include: { brands: true } } },
  });

  return NextResponse.json({
    user: { id: session.userId, name: session.name, email: session.email },
    workspaces: memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      brands: m.workspace.brands,
    })),
  });
}
