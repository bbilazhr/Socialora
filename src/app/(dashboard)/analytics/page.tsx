"use client";
import { useEffect, useState } from "react";
import { Eye, Heart, TrendingUp, MousePointerClick } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useActiveBrand } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import { PLATFORMS } from "@/components/PlatformIcon";
import { EmptyBrandState } from "../dashboard/page";

export default function AnalyticsPage() {
  const brand = useActiveBrand();
  const [platform, setPlatform] = useState("");
  const [data, setData] = useState<any | null>(null);

  async function refresh() {
    if (!brand) return;
    const params = new URLSearchParams({ days: "30" });
    if (platform) params.set("platform", platform);
    const res = await api(`/api/analytics/${brand.id}?${params.toString()}`);
    setData(res);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [brand?.id, platform]);

  if (!brand) return <EmptyBrandState />;
  if (!data) return <div className="text-sm text-slate-400">Memuat analytics...</div>;

  const f = data.funnel;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-400">Pantau performa dan insight konten brand kamu</p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-full border border-slate-100 bg-white p-1 shadow-sm w-fit">
        <button onClick={() => setPlatform("")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${platform === "" ? "bg-brand-primary text-white" : "text-slate-500"}`}>Semua</button>
        {PLATFORMS.map((p) => (
          <button key={p.id} onClick={() => setPlatform(p.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${platform === p.id ? "bg-brand-primary text-white" : "text-slate-500"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Eye} label="TOTAL TAYANGAN" value={f.tofuViews.toLocaleString("id-ID")} />
        <MetricCard icon={Heart} label="TOTAL ENGAGEMENT" value={f.mofuEngagement.toLocaleString("id-ID")} />
        <MetricCard icon={TrendingUp} label="RATA-RATA ENGAGEMENT" value={`${f.engagementRate.toFixed(1)}%`} />
        <MetricCard icon={MousePointerClick} label="GMV / PURCHASE" value={`Rp ${f.totalGmv.toLocaleString("id-ID")}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-bold text-slate-900">Funnel Flow</h3>
          <p className="mb-4 text-xs text-slate-400">Awareness → Consideration → Conversion</p>
          <FunnelStage n={1} label="Awareness" tone="bg-orange-50 text-orange-600" value={f.tofuViews.toLocaleString("id-ID")} sub="Views" />
          <div className="my-1 text-center text-[11px] font-semibold text-slate-400">↓ CVR {f.cvrAwarenessToConsideration.toFixed(1)}%</div>
          <FunnelStage n={2} label="Consideration" tone="bg-sky-50 text-sky-600" value={f.mofuEngagement.toLocaleString("id-ID")} sub="Total Engagement" />
          <div className="my-1 text-center text-[11px] font-semibold text-slate-400">↓ CVR {f.cvrConsiderationToConversion.toFixed(1)}%</div>
          <FunnelStage n={3} label="Conversion" tone="bg-emerald-50 text-emerald-600" value={f.bofuOrders.toLocaleString("id-ID")} sub="GMV / Purchase" />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-sm font-bold text-slate-900">Performa Tren</h3>
          <p className="mb-3 text-xs text-slate-400">Engagement rate 30 hari terakhir</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Engagement Rate"]} />
                <Area type="monotone" dataKey="engagementRate" stroke="var(--brand-primary)" strokeWidth={2.5} fill="url(#analyticsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Top Konten</h3>
        <div className="flex flex-col divide-y divide-slate-50">
          {data.topContent.map((c: any, i: number) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5">
              <span className="w-5 text-xs font-bold text-slate-300">{i + 1}</span>
              <span className="flex-1 truncate text-sm font-medium text-slate-700">{c.title}</span>
              <span className="text-xs text-slate-400">{c.views.toLocaleString("id-ID")} views</span>
            </div>
          ))}
          {data.topContent.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Belum ada data konten.</p>}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400">
        <Icon size={16} /> {label}
      </div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function FunnelStage({ n, label, tone, value, sub }: { n: number; label: string; tone: string; value: string; sub: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 ${tone}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">{n}</span>
      <div>
        <div className="text-[11px] font-semibold uppercase opacity-70">{sub}</div>
        <div className="text-base font-bold">{label}</div>
        <div className="text-lg font-extrabold">{value}</div>
      </div>
    </div>
  );
}
