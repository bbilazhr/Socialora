"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { useActiveBrand, useActiveWorkspace, useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";
import { EmptyBrandState } from "../../dashboard/page";

// Note: logos are stored as base64 data URLs directly on the Brand row for
// this scaffold, so there's zero setup needed to try it locally. For
// production, swap this for an upload to S3/Cloudinary/Supabase Storage and
// store the resulting URL instead — the rest of the app only ever reads
// brand.logoUrl as a plain <img src>, so nothing else needs to change.
export default function BrandSettingsPage() {
  const brand = useActiveBrand();
  const workspace = useActiveWorkspace();
  const upsertBrand = useWorkspaceStore((s) => s.upsertBrand);
  const removeBrand = useWorkspaceStore((s) => s.removeBrand);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setName(brand.name);
    setPrimaryColor(brand.primaryColor);
    setAccentColor(brand.accentColor);
    setLogoUrl(brand.logoUrl);
  }, [brand?.id]);

  if (!brand || !workspace) return <EmptyBrandState />;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const { brand: updated } = await api(`/api/brands/${brand!.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, primaryColor, accentColor, logoUrl }),
      });
      upsertBrand(workspace!.id, updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Hapus brand "${brand!.name}"? Semua konten & goal di dalamnya ikut terhapus.`)) return;
    await api(`/api/brands/${brand!.id}`, { method: "DELETE" });
    removeBrand(workspace!.id, brand!.id);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pengaturan Brand</h1>
        <p className="text-sm text-slate-400">Ganti nama, logo, dan warna tema khusus untuk dashboard brand ini.</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Nama Brand</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-primary" />

        <label className="mb-1 block text-xs font-semibold text-slate-500">Logo</label>
        <div className="mb-4 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-14 w-14 rounded-xl border border-slate-100 object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: primaryColor }}>
              {name.slice(0, 1).toUpperCase() || "?"}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Upload size={13} /> Ganti Logo
          </button>
          {logoUrl && (
            <button onClick={() => setLogoUrl(null)} className="text-xs font-semibold text-red-500">Hapus</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Warna Primer</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200" />
              <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Warna Aksen</label>
            <div className="flex items-center gap-2">
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200" />
              <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono outline-none" />
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-slate-100 p-4">
          <div className="mb-2 text-xs font-semibold text-slate-400">Preview Tema</div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>Tombol Utama</button>
            <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>Badge Aksen</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: primaryColor }}>
            {saving ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan Perubahan"}
          </button>
          <button onClick={handleDelete} className="flex items-center justify-center rounded-lg border border-red-100 px-3 py-2.5 text-red-500 hover:bg-red-50">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
