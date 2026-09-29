"use client";
import { useEffect, useState } from "react";
import { Printer, Sparkles } from "lucide-react";
import { useActiveBrand } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import { EmptyBrandState } from "../dashboard/page";

export default function ReportPage() {
  const brand = useActiveBrand();
  const [data, setData] = useState<any | null>(null);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (!brand) return;
    api(`/api/analytics/${brand.id}?days=30`).then(setData);
    setSummary("");
    // eslint-disable-next-line
  }, [brand?.id]);

  async function generateSummary() {
    if (!brand) return;
    setLoadingSummary(true);
    try {
      const { message } = await api("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          brandId: brand.id,
          message: "Tulis ringkasan eksekutif (executive summary) singkat 3-4 kalimat tentang performa funnel brand ini bulan ini, dalam bahasa Indonesia yang profesional untuk laporan klien.",
        }),
      });
      setSummary(message.content);
    } finally {
      setLoadingSummary(false);
    }
  }

  if (!brand) return <EmptyBrandState />;
  if (!data) return <div className="text-sm text-slate-400">Menyiapkan laporan...</div>;

  const f = data.funnel;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Report</h1>
          <p className="text-sm text-slate-400">Reporting otomatis, satu klik jadi deck untuk klien</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateSummary} disabled={loadingSummary} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-60">
            <Sparkles size={14} /> {loadingSummary ? "Menulis..." : "Generate Ringkasan AI"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white">
            <Printer size={14} /> Export / Print
          </button>
        </div>
      </div>

      <div id="report-sheet" className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>
                {brand.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-base font-bold text-slate-900">{brand.name}</div>
              <div className="text-xs text-slate-400">Performance Report — {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            Dibuat via <span className="font-semibold" style={{ color: brand.primaryColor }}>Socialora</span>
          </div>
        </div>

        {summary && (
          <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Executive Summary</div>
            {summary}
          </div>
        )}

        <div className="mb-6 grid grid-cols-3 gap-3">
          <ReportStat label="Awareness (Views)" value={f.tofuViews.toLocaleString("id-ID")} />
          <ReportStat label="Consideration (Engagement)" value={f.mofuEngagement.toLocaleString("id-ID")} />
          <ReportStat label="Conversion (GMV)" value={`Rp ${f.totalGmv.toLocaleString("id-ID")}`} />
        </div>

        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Top Performing Content</div>
        <div className="flex flex-col divide-y divide-slate-50">
          {data.topContent.map((c: any, i: number) => (
            <div key={c.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-700">{i + 1}. {c.title}</span>
              <span className="text-slate-400">{c.views.toLocaleString("id-ID")} views · {c.likes.toLocaleString("id-ID")} likes</span>
            </div>
          ))}
          {data.topContent.length === 0 && <p className="py-3 text-center text-sm text-slate-400">Belum ada konten untuk dilaporkan.</p>}
        </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 text-center">
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div className="text-lg font-extrabold text-slate-900">{value}</div>
    </div>
  );
}
