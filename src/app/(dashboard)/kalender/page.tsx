"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useActiveBrand } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import NewContentModal from "@/components/NewContentModal";
import { EmptyBrandState } from "../dashboard/page";

const WEEKDAYS = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

const TAG_TONE: Record<string, string> = {
  IDEATION: "bg-slate-100 text-slate-600",
  SCRIPTING: "bg-emerald-50 text-emerald-600",
  TAKE_KONTEN: "bg-pink-50 text-pink-600",
  EDITING: "bg-violet-50 text-violet-600",
  REVIEW: "bg-amber-50 text-amber-600",
  SCHEDULED: "bg-sky-50 text-sky-600",
  PUBLISHED: "bg-green-50 text-green-600",
};

export default function KalenderPage() {
  const brand = useActiveBrand();
  const [month, setMonth] = useState(new Date());
  const [contents, setContents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function refresh() {
    if (!brand) return;
    const { contents } = await api(`/api/content?brandId=${brand.id}`);
    setContents(contents.filter((c: any) => c.scheduledAt));
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [brand?.id]);

  if (!brand) return <EmptyBrandState />;

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="flex flex-col gap-4">
      {showModal && <NewContentModal brandId={brand.id} onClose={() => setShowModal(false)} onCreated={refresh} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-sm text-slate-400">Jadwalkan dan kelola konten secara visual</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <Plus size={15} /> Konten Baru
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMonth((m) => subMonths(m, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
              <ChevronLeft size={15} />
            </button>
            <span className="w-40 text-center text-sm font-bold text-slate-800">{format(month, "MMMM yyyy", { locale: idLocale })}</span>
            <button onClick={() => setMonth((m) => addMonths(m, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
              <ChevronRight size={15} />
            </button>
          </div>
          <button onClick={() => setMonth(new Date())} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Hari Ini
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-[11px] font-semibold text-slate-400">
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayContents = contents.filter((c) => isSameDay(new Date(c.scheduledAt), day));
            return (
              <div key={day.toISOString()} className={`min-h-[100px] border-b border-r border-slate-50 p-1.5 ${isSameMonth(day, month) ? "" : "bg-slate-50/50"}`}>
                <div className={`mb-1 text-xs ${isSameDay(day, new Date()) ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary font-bold text-white" : isSameMonth(day, month) ? "text-slate-500" : "text-slate-300"}`}>
                  {format(day, "d")}
                </div>
                <div className="flex flex-col gap-1">
                  {dayContents.slice(0, 3).map((c) => (
                    <div key={c.id} className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${TAG_TONE[c.status] ?? "bg-slate-100"}`} title={c.title}>
                      {c.title}
                    </div>
                  ))}
                  {dayContents.length > 3 && <div className="text-[10px] text-slate-400">+{dayContents.length - 3} lagi</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
