"use client";
import { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { Modal, Field, inputCls } from "./Modal";
import { api } from "@/lib/api";
import { PLATFORMS } from "./PlatformIcon";
import { STATUS_LABEL } from "./Badges";

export default function EditContentModal({ content, onClose, onUpdated, onDeleted }: {
  content: any; onClose: () => void; onUpdated: () => void; onDeleted: () => void;
}) {
  const [form, setForm] = useState({
    title: content.title,
    platform: content.platform,
    status: content.status,
    funnel: content.funnel,
    approval: content.approval,
    postUrl: content.postUrl ?? "",
    views: content.views,
    likes: content.likes,
    comments: content.comments,
    shares: content.shares,
    saves: content.saves,
    clicks: content.clicks,
    conversions: content.conversions,
    gmv: content.gmv,
  });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);

  function num(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }));
  }
  function str(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await api(`/api/content/${content.id}`, { method: "PATCH", body: JSON.stringify(form) });
      onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleTrack() {
    setTracking(true);
    try {
      // Persist any manual metric edits first so the snapshot reflects them.
      await api(`/api/content/${content.id}`, { method: "PATCH", body: JSON.stringify(form) });
      const { note } = await api(`/api/track/${content.id}`, { method: "POST" });
      setNote(note);
      onUpdated();
    } finally {
      setTracking(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus konten ini?")) return;
    await api(`/api/content/${content.id}`, { method: "DELETE" });
    onDeleted();
    onClose();
  }

  return (
    <Modal title="Edit Konten" onClose={onClose} wide>
      <Field label="Judul"><input value={form.title} onChange={str("title")} className={inputCls} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Platform">
          <select value={form.platform} onChange={str("platform")} className={inputCls}>
            {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={str("status")} className={inputCls}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Approval">
          <select value={form.approval} onChange={str("approval")} className={inputCls}>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REVISION">Revisi</option>
          </select>
        </Field>
      </div>
      <Field label="Funnel">
        <select value={form.funnel} onChange={str("funnel")} className={inputCls}>
          <option value="TOFU">TOFU</option>
          <option value="MOFU">MOFU</option>
          <option value="BOFU">BOFU</option>
        </select>
      </Field>

      <div className="mb-1 mt-4 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500">Link Tracking</label>
        <button onClick={handleTrack} disabled={tracking} className="flex items-center gap-1 text-xs font-semibold text-brand-primary disabled:opacity-50">
          <RefreshCw size={12} className={tracking ? "animate-spin" : ""} /> {tracking ? "Menyinkronkan..." : "Refresh metrik dari link"}
        </button>
      </div>
      <input value={form.postUrl} onChange={str("postUrl")} className={`${inputCls} mb-2`} placeholder="https://..." />
      {note && <p className="mb-3 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500">{note}</p>}

      <div className="mb-1 mt-3 text-xs font-semibold text-slate-500">Metrik (manual atau hasil tracking)</div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {(["views", "likes", "comments", "shares", "saves", "clicks", "conversions", "gmv"] as const).map((k) => (
          <div key={k}>
            <label className="mb-0.5 block text-[10px] uppercase text-slate-400">{k}</label>
            <input type="number" value={form[k]} onChange={num(k)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-brand-primary" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={loading} className="flex-1 rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button onClick={handleDelete} className="flex items-center justify-center rounded-lg border border-red-100 px-3 py-2.5 text-red-500 hover:bg-red-50">
          <Trash2 size={16} />
        </button>
      </div>
    </Modal>
  );
}
