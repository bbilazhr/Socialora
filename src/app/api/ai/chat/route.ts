import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireMembership } from "@/lib/auth";
import { generateAIResponse } from "@/lib/ai";

// List conversations for a brand (sidebar history).
export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const brandId = req.nextUrl.searchParams.get("brandId");
    if (!brandId) return NextResponse.json({ error: "brandId wajib diisi" }, { status: 400 });

    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) return NextResponse.json({ error: "Brand tidak ditemukan" }, { status: 404 });
    await requireMembership(session.userId, brand.workspaceId);

    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (conversationId) {
      const conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      return NextResponse.json({ conversation });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ conversations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

const schema = z.object({
  brandId: z.string(),
  conversationId: z.string().optional(),
  message: z.string().min(1),
});

// Send a message: creates a conversation if needed, calls Socialora AI with
// the brand's real performance data as context, stores both turns.
export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });

    const brand = await prisma.brand.findUnique({ where: { id: parsed.data.brandId } });
    if (!brand) return NextResponse.json({ error: "Brand tidak ditemukan" }, { status: 404 });
    await requireMembership(session.userId, brand.workspaceId);

    let conversationId = parsed.data.conversationId;
    if (!conversationId) {
      const conversation = await prisma.aIConversation.create({
        data: { brandId: parsed.data.brandId, title: parsed.data.message.slice(0, 60) },
      });
      conversationId = conversation.id;
    }

    await prisma.aIMessage.create({
      data: { conversationId, role: "user", content: parsed.data.message },
    });

    const responseText = await generateAIResponse(parsed.data.brandId, parsed.data.message);

    const assistantMessage = await prisma.aIMessage.create({
      data: { conversationId, role: "assistant", content: responseText },
    });

    return NextResponse.json({ conversationId, message: assistantMessage });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
