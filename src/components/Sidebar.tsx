"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Trello,
  Sparkles,
  BarChart3,
  FileBarChart,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
import { BrandSwitcher } from "./BrandSwitcher";
import { api } from "@/lib/api";

const NAV = [
  { group: "MENU UTAMA", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/kalender", label: "Kalender", icon: Calendar },
    { href: "/konten", label: "Konten", icon: FileText },
    { href: "/kanban", label: "Kanban Board", icon: Trello },
    { href: "/ai", label: "Socialora AI", icon: Sparkles },
  ]},
  { group: "INSIGHT", items: [
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/report", label: "Report", icon: FileBarChart },
  ]},
  { group: "ADMIN", items: [
    { href: "/settings/brand", label: "Pengaturan Brand", icon: Settings },
    { href: "/settings/team", label: "Tim & Akses", icon: Users },
  ]},
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-5 md:flex">
      <div className="mb-5 flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">S</div>
        <div>
          <div className="text-sm font-bold leading-none text-slate-900">Socialora</div>
          <div className="text-[10px] leading-tight text-slate-400">Understand Your Social</div>
        </div>
      </div>

      <div className="mb-4 truncate px-1 text-xs text-slate-400">
        Halo, <span className="font-medium text-slate-600">{userName}</span>
      </div>

      <div className="mb-5">
        <BrandSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto">
        {NAV.map((section) => (
          <div key={section.group} className="mb-4">
            <div className="mb-1 px-2 text-[11px] font-semibold text-slate-400">{section.group}</div>
            <nav className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-brand-primary/10 text-brand-primary" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="mt-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50"
      >
        <LogOut size={16} /> Keluar
      </button>
    </aside>
  );
}
