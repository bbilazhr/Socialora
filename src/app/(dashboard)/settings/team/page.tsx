"use client";
import { useEffect, useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { useActiveWorkspace } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";

const ROLES = ["OWNER", "ADMIN", "SPECIALIST", "CREATOR", "CLIENT"] as const;
const ROLE_DESC: Record<string, string> = {
  OWNER: "Akses penuh, termasuk hapus workspace",
  ADMIN: "Kelola brand, konten, dan anggota tim",
  SPECIALIST: "Kelola konten & brand, tidak bisa kelola tim",
  CREATOR: "Buat & edit konten saja",
  CLIENT: "Lihat dashboard & report saja",
};

export default function TeamSettingsPage() {
  const workspace = useActiveWorkspace();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("SPECIALIST");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!workspace) return;
    const { members, invites } = await api(`/api/team?workspaceId=${workspace.id}`);
    setMembers(members);
    setInvites(invites);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [workspace?.id]);

  if (!workspace) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/team", { method: "POST", body: JSON.stringify({ workspaceId: workspace!.id, email, role }) });
      setEmail("");
      refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(membershipId: string, newRole: string) {
    await api(`/api/team/${membershipId}`, { method: "PATCH", body: JSON.stringify({ role: newRole }) });
    refresh();
  }

  async function removeMember(membershipId: string) {
    if (!confirm("Keluarkan anggota ini dari workspace?")) return;
    await api(`/api/team/${membershipId}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tim & Akses</h1>
        <p className="text-sm text-slate-400">Undang rekan kerja ke "{workspace.name}" dan atur level aksesnya.</p>
      </div>

      <form onSubmit={handleInvite} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Email Rekan Kerja</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teman@agency.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <UserPlus size={14} /> Undang
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
        <p className="mt-2 text-[11px] text-slate-400">{ROLE_DESC[role]}</p>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-400">Anggota Aktif</div>
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between border-b border-slate-50 px-4 py-3 last:border-0">
            <div>
              <div className="text-sm font-medium text-slate-800">{m.user.name}</div>
              <div className="text-xs text-slate-400">{m.user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <select value={m.role} onChange={(e) => updateRole(m.id, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => removeMember(m.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {members.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">Belum ada anggota.</p>}
      </div>

      {invites.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-400">Undangan Tertunda</div>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate-600">{inv.email}</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">{inv.role} · menunggu daftar</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
