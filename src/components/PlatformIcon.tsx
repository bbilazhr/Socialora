import { Instagram, Youtube, Facebook, Twitter, MessageCircle, Music2 } from "lucide-react";

export const PLATFORMS = [
  { id: "instagram", label: "IG", icon: Instagram, tone: "bg-pink-50 text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: Music2, tone: "bg-slate-100 text-slate-700" },
  { id: "youtube", label: "YT", icon: Youtube, tone: "bg-red-50 text-red-500" },
  { id: "facebook", label: "FB", icon: Facebook, tone: "bg-blue-50 text-blue-600" },
  { id: "x", label: "X", icon: Twitter, tone: "bg-slate-100 text-slate-800" },
  { id: "threads", label: "Threads", icon: MessageCircle, tone: "bg-slate-100 text-slate-700" },
] as const;

export function platformMeta(id: string) {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}

export function PlatformIcon({ platform, size = 13 }: { platform: string; size?: number }) {
  const meta = platformMeta(platform);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
      <Icon size={size} /> {meta.label}
    </span>
  );
}
