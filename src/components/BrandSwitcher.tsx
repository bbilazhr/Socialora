"use client";
import { useState } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { useWorkspaceStore, useActiveBrand, useActiveWorkspace } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";

export function BrandSwitcher() {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const workspace = useActiveWorkspace();
  const activeBrand = useActiveBrand();
  const setActiveBrand = useWorkspaceStore((s) => s.setActiveBrand);
  const upsertBrand = useWorkspaceStore((s) => s.upsertBrand);

  if (!workspace) return null;

  async function handleCreate() {
    if (!name.trim() || !workspace) return;
    const { brand } = await api("/api/brands", {
      method: "POST",
      body: JSON.stringify({ workspaceId: workspace.id, name: name.trim() }),
    });
    upsertBrand(workspace.id, brand);
    setActiveBrand(brand.id);
    setName("");
    setCreating(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
        <span className="truncate">{activeBrand?.name ?? "Pilih Brand"}</span>
        <ChevronDown size={14} className="ml-auto shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
          <div className="max-h-56 overflow-y-auto">
            {workspace.brands.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setActiveBrand(b.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {b.logoUrl ? (
                  <img src={b.logoUrl} alt="" className="h-5 w-5 rounded object-cover" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white" style={{ backgroundColor: b.primaryColor }}>
                    {b.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="flex-1 truncate">{b.name}</span>
                {b.id === activeBrand?.id && <Check size={14} className="text-brand-primary" />}
              </button>
            ))}
          </div>
          <div className="mt-1 border-t border-slate-100 pt-2">
            {creating ? (
              <div className="flex items-center gap-1.5 px-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Nama brand baru..."
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                />
                <button onClick={handleCreate} className="rounded-lg bg-brand-primary px-2.5 py-1.5 text-xs font-semibold text-white">
                  Tambah
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-brand-primary hover:bg-slate-50"
              >
                <Plus size={15} /> Tambah Brand Baru
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
