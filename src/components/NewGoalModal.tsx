"use client";
import { useState } from "react";
import { Modal, Field, inputCls } from "./Modal";
import { api } from "@/lib/api";
import { PLATFORMS } from "./PlatformIcon";

export default function NewGoalModal({ brandId, onClose, onCreated }: { brandId: string; onClose: () => void; onCreated: () => void }) {
  const [platform, setPlatform] = useState("instagram");
  const [metric, setMetric] = useState("VIEWS");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/goals", {
        method: "POST",
        body: JSON.stringify({
          brandId,
          platform,
          metric,
          targetValue: Number(targetValue),
          currentValue: Number(currentValue),
          deadline: new Date(deadline).toISOString(),
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
    <Modal title="Set Goal Baru" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls}>
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Metrik">
            <select value={metric} onChange={(e) => setMetric(e.target.value)} className={inputCls}>
              <option value="VIEWS">Views</option>
              <option value="FOLLOWERS">Followers</option>
              <option value="GMV">GMV</option>
              <option value="ENGAGEMENT">Engagement</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nilai Saat Ini">
            <input type="number" required value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Target">
            <input type="number" required value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Deadline">
          <input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
        </Field>
        <button disabled={loading} className="mt-2 w-full rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Menyimpan..." : "Simpan Goal"}
        </button>
      </form>
    </Modal>
  );
}
