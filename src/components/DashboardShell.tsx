"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ThemeInjector } from "./ThemeInjector";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { api } from "@/lib/api";

export function DashboardShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api("/api/auth/me")
      .then((data) => {
        setWorkspaces(data.workspaces ?? []);
      })
      .finally(() => setReady(true));
  }, [setWorkspaces]);

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <ThemeInjector />
      <Sidebar userName={userName} />
      <div className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-xs font-bold text-white">S</div>
            <span className="font-bold text-slate-900">Socialora</span>
          </div>
          <div className="hidden md:block" />
          <Bell size={18} className="text-slate-400" />
        </div>
        <main className="p-6">{ready ? children : <div className="p-10 text-sm text-slate-400">Memuat workspace...</div>}</main>
      </div>
    </div>
  );
}
