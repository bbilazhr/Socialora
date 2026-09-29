"use client";
import { useState } from "react";
import { Modal, Field, inputCls } from "./Modal";
import { api } from "@/lib/api";
import { PLATFORMS } from "./PlatformIcon";

export default function NewContentModal({
  brandId,
  onClose,
  onCreated,
  defaultStatus,
}: {
  brandId: string;
  onClose: () => void;
  onCreated: () => void;
  defaultStatus?: string;
}) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [format, setFormat] = useState("Video");
  const [funnel, setFunnel] = useState("TOFU");
  const [postUrl, setPostUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/content", {
        method: "POST",
        body: JSON.stringify({
          brandId,
          title,
          platform,
          format,
          funnel,
          status: defaultStatus ?? "IDEATION",
          postUrl: postUrl || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Konten Baru" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</div>}
        <Field label="Judul / Ide Konten">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Contoh: 3 tanda konten lu keliatan desperate jualan" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls}>
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Format">
            <select value={format} onChange={(e) => setFormat(e.target.value)} className={inputCls}>
              <option>Video</option>
              <option>Carousel</option>
              <option>Image</option>
            </select>
          </Field>
        </div>
        <Field label="Funnel Tag">
          <select value={funnel} onChange={(e) => setFunnel(e.target.value)} className={inputCls}>
            <option value="TOFU">TOFU — Awareness</option>
            <option value="MOFU">MOFU — Consideration</option>
            <option value="BOFU">BOFU — Conversion</option>
          </select>
        </Field>
        <Field label="Link Postingan (opsional — untuk link tracking)">
          <input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} className={inputCls} placeholder="https://instagram.com/reel/..." />
        </Field>
        <Field label="Jadwal Tayang (opsional)">
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
        </Field>
        <button disabled={loading} className="mt-2 w-full rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Menyimpan..." : "Simpan Konten"}
        </button>
      </form>
    </Modal>
  );
}
