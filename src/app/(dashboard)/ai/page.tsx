"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Plus, Sparkles } from "lucide-react";
import { useActiveBrand } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import { EmptyBrandState } from "../dashboard/page";

export default function AIPage() {
  const brand = useActiveBrand();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function refreshList() {
    if (!brand) return;
    const { conversations } = await api(`/api/ai/chat?brandId=${brand.id}`);
    setConversations(conversations);
  }

  async function loadConversation(id: string) {
    if (!brand) return;
    setActiveId(id);
    const { conversation } = await api(`/api/ai/chat?brandId=${brand.id}&conversationId=${id}`);
    setMessages(conversation?.messages ?? []);
  }

  useEffect(() => { refreshList(); setActiveId(null); setMessages([]); /* eslint-disable-next-line */ }, [brand?.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!brand) return <EmptyBrandState />;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !brand) return;
    const userMsg = { role: "user", content: input, id: `temp-${Date.now()}` };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const { conversationId, message } = await api("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ brandId: brand.id, conversationId: activeId ?? undefined, message: userMsg.content }),
      });
      setActiveId(conversationId);
      setMessages((m) => [...m, message]);
      refreshList();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Sparkles size={18} className="text-brand-primary" /> Socialora AI</h1>
        <p className="text-sm text-slate-400">Brainstorming & Script Assistant</p>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="hidden w-64 shrink-0 flex-col gap-2 sm:flex">
          <button onClick={() => { setActiveId(null); setMessages([]); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white">
            <Plus size={15} /> Chat Baru
          </button>
          <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => loadConversation(c.id)} className={`mb-1 block w-full truncate rounded-lg px-3 py-2 text-left text-sm ${activeId === c.id ? "bg-brand-primary/10 text-brand-primary" : "text-slate-600 hover:bg-slate-50"}`}>
                {c.title}
              </button>
            ))}
            {conversations.length === 0 && <p className="p-3 text-center text-xs text-slate-400">Belum ada riwayat chat.</p>}
          </div>
        </div>

        <div className="flex flex-1 flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
                <Sparkles size={28} className="text-brand-primary" />
                <p className="max-w-xs text-sm">
                  Coba tanya "analisa konten gue, kasih insightnya!" atau "bikinin script hook buat konten TikTok."
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-brand-primary text-white" : "bg-slate-50 text-slate-700"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && <div className="text-xs text-slate-400">Socialora AI sedang mengetik...</div>}
              <div ref={bottomRef} />
            </div>
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis ide, brief, atau masalah konten lo di sini..."
              className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            />
            <button disabled={sending} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white disabled:opacity-50">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
