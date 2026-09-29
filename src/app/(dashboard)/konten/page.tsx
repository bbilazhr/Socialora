"use client";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useActiveBrand } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import { PlatformIcon, PLATFORMS } from "@/components/PlatformIcon";
import { FunnelBadge, ApprovalBadge, STATUS_LABEL } from "@/components/Badges";
import NewContentModal from "@/components/NewContentModal";
import EditContentModal from "@/components/EditContentModal";
import { EmptyBrandState } from "../dashboard/page";

export default function KontenPage() {
  const brand = useActiveBrand();
  const [contents, setContents] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [funnel, setFunnel] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function refresh() {
    if (!brand) return;
    const params = new URLSearchParams({ brandId: brand.id });
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    if (funnel) params.set("funnel", funnel);
    if (q) params.set("q", q);
    const { contents } = await api(`/api/content?${params.toString()}`);
    setContents(contents);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [brand?.id, platform, status, funnel, q]);

  if (!brand) return <EmptyBrandState />;

  return (
    <div className="flex flex-col gap-4">
      {showNew && <NewContentModal brandId={brand.id} onClose={() => setShowNew(false)} onCreated={refresh} />}
      {editing && <EditContentModal content={editing} onClose={() => setEditing(null)} onUpdated={refresh} onDeleted={refresh} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Content Database</h1>
          <p className="text-sm text-slate-400">{contents.length} konten</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <Plus size={15} /> Tambah Konten
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
          <Search size={14} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul atau script..." className="w-full text-sm outline-none" />
        </div>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          <option value="">Semua Platform</option>
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={funnel} onChange={(e) => setFunnel(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
          <option value="">Semua Funnel</option>
          <option value="TOFU">TOFU</option>
          <option value="MOFU">MOFU</option>
          <option value="BOFU">BOFU</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase text-slate-400">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Funnel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Approval</th>
              <th className="px-4 py-3">Views</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((c) => (
              <tr key={c.id} onClick={() => setEditing(c)} className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-800">{c.title}</td>
                <td className="px-4 py-3"><PlatformIcon platform={c.platform} /></td>
                <td className="px-4 py-3 text-slate-500">{c.format}</td>
                <td className="px-4 py-3"><FunnelBadge funnel={c.funnel} /></td>
                <td className="px-4 py-3 text-slate-500">{STATUS_LABEL[c.status]}</td>
                <td className="px-4 py-3"><ApprovalBadge approval={c.approval} /></td>
                <td className="px-4 py-3 text-slate-500">{c.views.toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {contents.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Belum ada konten yang cocok dengan filter ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
