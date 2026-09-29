"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useActiveBrand } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";
import { FunnelBadge, ApprovalBadge, STATUS_LABEL } from "@/components/Badges";
import NewContentModal from "@/components/NewContentModal";
import { EmptyBrandState } from "../dashboard/page";

const COLUMNS = Object.keys(STATUS_LABEL);

function Card({ content }: { content: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: content.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
      className="mb-2 cursor-grab rounded-xl border border-slate-100 bg-white p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-slate-800">{content.title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <PlatformIcon platform={content.platform} />
        <FunnelBadge funnel={content.funnel} />
        <ApprovalBadge approval={content.approval} />
      </div>
      {content.scheduledAt && (
        <div className="mt-1.5 text-[11px] text-slate-400">
          {new Date(content.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
        </div>
      )}
    </div>
  );
}

function Column({ status, items, onAdd }: { status: string; items: any[]; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{STATUS_LABEL[status]}</span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{items.length}</span>
      </div>
      <div ref={setNodeRef} className={`min-h-[120px] flex-1 rounded-xl p-1 transition-colors ${isOver ? "bg-brand-primary/5" : ""}`}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((c) => <Card key={c.id} content={c} />)}
        </SortableContext>
        <button onClick={onAdd} className="mt-1 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-400 hover:border-brand-primary hover:text-brand-primary">
          <Plus size={13} /> Tambah ide
        </button>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const brand = useActiveBrand();
  const [contents, setContents] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function refresh() {
    if (!brand) return;
    const { contents } = await api(`/api/content?brandId=${brand.id}`);
    setContents(contents);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [brand?.id]);

  if (!brand) return <EmptyBrandState />;

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const overId = over.id as string;
    const newStatus = COLUMNS.includes(overId) ? overId : contents.find((c) => c.id === overId)?.status;
    const dragged = contents.find((c) => c.id === active.id);
    if (!newStatus || !dragged || dragged.status === newStatus) return;

    setContents((prev) => prev.map((c) => (c.id === active.id ? { ...c, status: newStatus } : c)));
    await api(`/api/content/${active.id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
  }

  return (
    <div className="flex flex-col gap-4">
      {modalStatus && (
        <NewContentModal brandId={brand.id} defaultStatus={modalStatus} onClose={() => setModalStatus(null)} onCreated={refresh} />
      )}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Content Board</h1>
        <p className="text-sm text-slate-400">Tampilkan ide & kelola status konten dengan kanban board</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <Column
              key={status}
              status={status}
              items={contents.filter((c) => c.status === status)}
              onAdd={() => setModalStatus(status)}
            />
          ))}
        </div>
        <DragOverlay>{activeId ? <Card content={contents.find((c) => c.id === activeId)} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
