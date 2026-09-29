import { prisma } from "./prisma";
import { computeFunnel } from "./data";

export type TopContent = {
  title: string;
  platform: string;
  funnel: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

/** Pulls the brand's top-performing content — the RAG "context injection" described in the spec. */
export async function getBrandContext(brandId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const topContents = await prisma.content.findMany({
    where: { brandId, createdAt: { gte: since } },
    orderBy: { views: "desc" },
    take: 5,
    select: { title: true, platform: true, funnel: true, views: true, likes: true, comments: true, shares: true },
  });
  const all = await prisma.content.findMany({ where: { brandId } });
  const funnel = computeFunnel(all);
  return { topContents, funnel, brandContentCount: all.length };
}

function buildSystemPrompt(topContents: TopContent[]) {
  const contextLines = topContents
    .map(
      (c) =>
        `- "${c.title}" | ${c.platform} | funnel: ${c.funnel} | views: ${c.views} | likes: ${c.likes} | comments: ${c.comments} | shares: ${c.shares}`
    )
    .join("\n");

  return `You are Socialora AI, an elite social media strategist and scriptwriter embedded inside the Socialora dashboard ("Understand Your Social").
Respond in casual Indonesian (Bahasa gaul, like talking to a social media specialist friend), using markdown.

Here is the last 30 days of this brand's top-performing content (highest views first):
${contextLines || "(belum ada data konten untuk brand ini)"}

When asked to write a script, ALWAYS structure it as:
1. **[Hook]** — 0-3 detik pertama buat nahan orang scroll
2. **[Body/Value]** — inti pesan, jelas dan engaging
3. **[Call to Action (CTA)]** — dorongan buat engage/beli
4. **[Visual/Audio Direction]** — arahan visual & audio

When asked to audit performance, identify winning patterns, top hooks, and content gaps grounded in the data above — never invent numbers that aren't in the context.`;
}

/** Rule-based fallback so the product still demos meaningfully without an API key. */
function offlineFallback(userPrompt: string, ctx: Awaited<ReturnType<typeof getBrandContext>>) {
  const { topContents, funnel } = ctx;
  const top = topContents[0];
  const wantsScript = /script|hook|caption|konten baru|bikinin/i.test(userPrompt);

  if (wantsScript) {
    return `**[Hook]**\n${top ? `Kenapa "${top.title}" bisa nembus ${top.views.toLocaleString("id-ID")} views? Ini alasannya...` : "Lo tau gak kenapa konten lo susah nembus FYP?"}\n\n**[Body/Value]**\nJelasin masalah yang audiens lo rasain, terus kasih 1 insight konkret yang langsung related sama produk/brand kamu. Jangan jualan dulu di 15 detik pertama.\n\n**[Call to Action (CTA)]**\nAjak audiens komen pengalaman mereka, atau save konten ini buat referensi nanti.\n\n**[Visual/Audio Direction]**\nJump cut cepat tiap 2-3 detik, teks besar di tengah frame, pakai audio trending yang tempo-nya nge-drive energi hook.\n\n_(Mode offline — hubungkan ANTHROPIC_API_KEY atau OPENAI_API_KEY di .env untuk hasil yang lebih personal dan variatif.)_`;
  }

  return `**Analisa singkat**\n\nDari ${ctx.brandContentCount} konten yang tercatat, funnel brand ini sekarang: Awareness ${funnel.tofuViews.toLocaleString("id-ID")} views → Consideration ${funnel.mofuEngagement.toLocaleString("id-ID")} engagement (CVR ${funnel.cvrAwarenessToConsideration.toFixed(1)}%) → Conversion ${funnel.bofuOrders.toLocaleString("id-ID")} orders (CVR ${funnel.cvrConsiderationToConversion.toFixed(1)}%).\n\n${top ? `**Konten yang bekerja**\n"${top.title}" di ${top.platform} jadi yang paling nendang dengan ${top.views.toLocaleString("id-ID")} views — pola ini layak direplikasi di konten berikutnya.` : "Belum ada cukup data konten untuk menarik pola yang solid — coba tambahkan beberapa konten dulu di Kanban Board."}\n\n_(Mode offline — hubungkan ANTHROPIC_API_KEY atau OPENAI_API_KEY di .env untuk audit yang lebih dalam.)_`;
}

export async function generateAIResponse(brandId: string, userPrompt: string) {
  const ctx = await getBrandContext(brandId);
  const provider = process.env.AI_PROVIDER;

  try {
    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          system: buildSystemPrompt(ctx.topContents),
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic API error ${res.status}`);
      const data = await res.json();
      const text = data.content?.map((b: any) => b.text || "").join("\n") ?? "";
      return text || offlineFallback(userPrompt, ctx);
    }

    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            { role: "system", content: buildSystemPrompt(ctx.topContents) },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI API error ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || offlineFallback(userPrompt, ctx);
    }
  } catch (e) {
    console.error("[socialora-ai] provider call failed, falling back to offline mode:", e);
  }

  return offlineFallback(userPrompt, ctx);
}
