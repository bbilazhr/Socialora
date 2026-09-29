"use client";
import { useEffect } from "react";
import { useActiveBrand } from "@/stores/useWorkspaceStore";

// Feature 1 "Dynamic Theme Injector": whenever the active brand changes,
// push its colors into CSS variables so every --brand-* utility across the
// whole dashboard re-themes instantly, with no per-component prop drilling.
export function ThemeInjector() {
  const brand = useActiveBrand();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", brand?.primaryColor || "#2563eb");
    root.style.setProperty("--brand-accent", brand?.accentColor || "#f59e0b");
  }, [brand?.primaryColor, brand?.accentColor]);

  return null;
}
