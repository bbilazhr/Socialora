"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Brand = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
};

export type Workspace = {
  id: string;
  name: string;
  role: string;
  brands: Brand[];
};

type State = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeBrandId: string | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string) => void;
  setActiveBrand: (id: string) => void;
  upsertBrand: (workspaceId: string, brand: Brand) => void;
  removeBrand: (workspaceId: string, brandId: string) => void;
};

// Persisted so refreshing the page keeps you on the same brand — this is
// the "instant state mutation" brand switcher described in the spec,
// backed by localStorage instead of only in-memory state.
export const useWorkspaceStore = create<State>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      activeBrandId: null,
      setWorkspaces: (workspaces) => {
        const state = get();
        const activeWorkspaceId =
          state.activeWorkspaceId && workspaces.some((w) => w.id === state.activeWorkspaceId)
            ? state.activeWorkspaceId
            : workspaces[0]?.id ?? null;
        const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
        const activeBrandId =
          state.activeBrandId && activeWs?.brands.some((b) => b.id === state.activeBrandId)
            ? state.activeBrandId
            : activeWs?.brands[0]?.id ?? null;
        set({ workspaces, activeWorkspaceId, activeBrandId });
      },
      setActiveWorkspace: (id) => {
        const ws = get().workspaces.find((w) => w.id === id);
        set({ activeWorkspaceId: id, activeBrandId: ws?.brands[0]?.id ?? null });
      },
      setActiveBrand: (id) => set({ activeBrandId: id }),
      upsertBrand: (workspaceId, brand) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id !== workspaceId
              ? w
              : {
                  ...w,
                  brands: w.brands.some((b) => b.id === brand.id)
                    ? w.brands.map((b) => (b.id === brand.id ? brand : b))
                    : [...w.brands, brand],
                }
          ),
        })),
      removeBrand: (workspaceId, brandId) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id !== workspaceId ? w : { ...w, brands: w.brands.filter((b) => b.id !== brandId) }
          ),
        })),
    }),
    { name: "socialora-workspace" }
  )
);

export function useActiveBrand(): Brand | null {
  const { workspaces, activeWorkspaceId, activeBrandId } = useWorkspaceStore();
  const ws = workspaces.find((w) => w.id === activeWorkspaceId);
  return ws?.brands.find((b) => b.id === activeBrandId) ?? null;
}

export function useActiveWorkspace(): Workspace | null {
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  return workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
}
