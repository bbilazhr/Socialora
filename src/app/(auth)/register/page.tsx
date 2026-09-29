"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", workspaceName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">S</div>
          <h1 className="text-lg font-bold text-slate-900">Socialora</h1>
          <p className="text-sm text-slate-400">Understand Your Social</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Buat workspace baru</h2>
          {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</div>}

          <label className="mb-1 block text-xs font-semibold text-slate-500">Nama Kamu</label>
          <input required value={form.name} onChange={update("name")} placeholder="Rilsa Rilfidila"
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />

          <label className="mb-1 block text-xs font-semibold text-slate-500">Nama Workspace / Agency</label>
          <input required value={form.workspaceName} onChange={update("workspaceName")} placeholder="Ceritanya Agency"
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />

          <label className="mb-1 block text-xs font-semibold text-slate-500">Email</label>
          <input type="email" required value={form.email} onChange={update("email")} placeholder="kamu@brand.com"
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />

          <label className="mb-1 block text-xs font-semibold text-slate-500">Password</label>
          <input type="password" required value={form.password} onChange={update("password")} placeholder="Minimal 6 karakter"
            className="mb-5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />

          <button disabled={loading} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Memproses..." : "Buat Workspace"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun? <Link href="/login" className="font-semibold text-blue-600">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
