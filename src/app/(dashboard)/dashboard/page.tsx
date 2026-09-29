"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, Calendar, BarChart3, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useActiveBrand } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";
import { STATUS_LABEL } from "@/components/Badges";
import NewContentModal from "@/components/NewContentModal";
import NewGoalModal from "@/components/NewGoalModal";

type Analytics = {
  totals: { totalContent: number; published: number; scheduled: number; avgEngagementRate: number };
  goalHealth: any[];
  trend: { date: string; engagementRate: number }[];
  upcoming: any[];
};

export default function DashboardPage() {
  const brand = useActiveBrand();
  const [data, setData] = useState<Analytics | null>(null);
  const [goalPage, setGoalPage] = useState(0);
  const [showNewContent, setShowNewContent] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);

  async function refresh() {
    if (!brand) return;
    const res = await api(`/api/analytics/${brand.id}`);
    setData(res);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?.id]);

  if (!brand) return <EmptyBrandState />;
  if (!data) return <div className="text-sm text-slate-400">Memuat data brand...</div>;

  const goalChunks: any[][] = [];
  for (let i = 0; i < data.goalHealth.length; i += 3) goalChunks.push(data.goalHealth.slice(i, i + 3));
  if (goalChunks.length === 0) goalChunks.push([]);

  return (
    <div className="flex flex-col gap-6">
      {showNewContent && <NewContentModal brandId={brand.id} onClose={() => setShowNewContent(false)} onCreated={refresh} />}
      {showNewGoal && <NewGoalModal brandId={brand.id} onClose={() => setShowNewGoal(false)} onCreated={refresh} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Halo, {brand.name}</h1>
          <p className="text-sm text-slate-400">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setShowNewContent(true)}
          className="flex items-center gap-1.5 self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <Plus size={15} /> Konten Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="TOTAL KONTEN" value={data.totals.totalContent} />
        <StatCard icon={Clock} label="DIPUBLIKASIKAN" value={data.totals.published} />
        <StatCard icon={Calendar} label="TERJADWAL" value={data.totals.scheduled} />
        <StatCard icon={BarChart3} label="RATA-RATA ENGAGEMENT" value={`${data.totals.avgEngagementRate}%`} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <BarChart3 size={15} className="text-slate-400" /> Goal Health
            </h2>
            <p className="text-xs text-slate-400">Progress target platform aktif brand ini</p>
          </div>
          <button onClick={() => setShowNewGoal(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            + Set Goal
          </button>
        </div>

        {data.goalHealth.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            Belum ada goal untuk brand ini. Klik "+ Set Goal" untuk mulai memantau progres.
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => setGoalPage((p) => Math.max(0, p - 1))} disabled={goalPage === 0}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
              {goalChunks[goalPage].map((g) => <GoalCard key={g.id} g={g} />)}
            </div>
            <button onClick={() => setGoalPage((p) => Math.min(goalChunks.length - 1, p + 1))} disabled={goalPage === goalChunks.length - 1}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-sm font-bold text-slate-900">Engagement Rate Tren</h3>
          <p className="mb-3 text-xs text-slate-400">7 hari terakhir</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="engFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Engagement Rate"]} />
                <Area type="monotone" dataKey="engagementRate" stroke="var(--brand-primary)" strokeWidth={2.5} fill="url(#engFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {data.trend.length === 0 && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Belum ada snapshot metrik. Update angka views/likes di halaman Konten untuk mulai membangun tren.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Calendar size={15} className="text-slate-400" /> Akan Datang
            </h3>
            <Link href="/kalender" className="text-xs font-semibold text-brand-primary">Kalender</Link>
          </div>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada konten terjadwal.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.upcoming.map((u: any) => (
                <div key={u.id} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <PlatformIcon platform={u.platform} />
                  <div className="flex-1">
                    <div className="text-sm font-medium leading-snug text-slate-800">{u.title}</div>
                    <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                      {STATUS_LABEL[u.status]}
                    </span>
                  </div>
                  <div className="shrink-0 text-xs text-slate-400">
                    {u.scheduledAt ? new Date(u.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400">
        <Icon size={16} className="text-slate-400" /> {label}
      </div>
      <div className="text-3xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function GoalCard({ g }: { g: any }) {
  const tone = g.health.daysDelayed > 14 ? "red" : g.health.daysDelayed > 0 ? "orange" : "green";
  const barTone = tone === "red" ? "bg-red-400" : tone === "orange" ? "bg-orange-400" : "bg-green-500";
  const dotTone = tone === "red" ? "bg-red-500" : tone === "orange" ? "bg-orange-400" : "bg-green-500";
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <PlatformIcon platform={g.platform} />
        <span className={`h-2 w-2 rounded-full ${dotTone}`} />
      </div>
      <div className="mb-2 text-3xl font-extrabold text-slate-900">{g.health.percentage}%</div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${g.health.percentage}%` }} />
      </div>
      {g.health.daysDelayed > 0 ? (
        <div className="mb-1 flex items-center gap-1 text-xs font-medium text-red-500">
          <Clock size={12} /> Terlambat {g.health.daysDelayed} hari
        </div>
      ) : (
        <div className="mb-1 flex items-center gap-1 text-xs font-medium text-green-600">
          <Clock size={12} /> On Track
        </div>
      )}
      <div className="text-xs font-medium text-slate-400">
        {g.metric}: {Math.round(g.currentValue).toLocaleString("id-ID")} / {Math.round(g.targetValue).toLocaleString("id-ID")}
      </div>
    </div>
  );
}

export function EmptyBrandState() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
      <h2 className="text-base font-bold text-slate-800">Belum ada brand</h2>
      <p className="max-w-xs text-sm text-slate-400">Tambahkan brand pertama kamu lewat dropdown brand di sidebar.</p>
    </div>
  );
}
