import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_NORMS } from '../data/defaultNorms';
import type { DisciplineNorm, Gender, GtoStage } from '../types/competition';
import { normKey } from '../utils/scoreCalculator';

/** Нормативы не определены в справочнике — пропускаем. */
const DEFAULT_KEYS = new Set(DEFAULT_NORMS.map((n) => normKey(n.disciplineId, n.stage, n.gender)));

export type NormOverrides = Record<string, DisciplineNorm>;

interface NormsState {
  overrides: NormOverrides;
  version: number;
  setNorm(norm: DisciplineNorm): void;
  updateThresholds(key: string, thresholds: DisciplineNorm['thresholds']): void;
  updateBadgePoints(
    key: string,
    badge: Partial<Pick<DisciplineNorm, 'bronzeMinPoints' | 'silverMinPoints' | 'goldMinPoints'>>,
  ): void;
  resetToDefault(): void;
  resetOne(disciplineId: string, stage: GtoStage, gender: Gender): void;
  importNorms(norms: DisciplineNorm[]): void;
}

/** Объединение официальных нормативов с пользовательскими правками. */
export function sortedNorms(overrides: NormOverrides): DisciplineNorm[] {
  const map = new Map<string, DisciplineNorm>();
  for (const norm of DEFAULT_NORMS) {
    map.set(normKey(norm.disciplineId, norm.stage, norm.gender), norm);
  }
  for (const norm of Object.values(overrides)) {
    const key = normKey(norm.disciplineId, norm.stage, norm.gender);
    if (DEFAULT_KEYS.has(key)) {
      map.set(key, norm);
    }
  }
  return [...map.values()];
}

export function findNorm(
  norms: readonly DisciplineNorm[],
  disciplineId: string,
  stage: GtoStage,
  gender: Gender,
): DisciplineNorm | undefined {
  return norms.find((n) => n.disciplineId === disciplineId && n.stage === stage && n.gender === gender);
}

export const useNormsStore = create<NormsState>()(
  persist(
    (set) => ({
      overrides: {},
      version: 0,
      setNorm: (norm) =>
        set((state) => ({
          overrides: { ...state.overrides, [normKey(norm.disciplineId, norm.stage, norm.gender)]: norm },
          version: state.version + 1,
        })),
      updateThresholds: (key, thresholds) =>
        set((state) => {
          const prev = state.overrides[key];
          if (!prev) {
            return state;
          }
          const updated: DisciplineNorm = {
            ...prev,
            thresholds: [...thresholds].sort((a, b) => a.value - b.value),
          };
          return {
            overrides: { ...state.overrides, [key]: updated },
            version: state.version + 1,
          };
        }),
      updateBadgePoints: (key, badge) =>
        set((state) => {
          const prev = state.overrides[key];
          if (!prev) {
            return state;
          }
          const updated: DisciplineNorm = {
            ...prev,
            bronzeMinPoints: badge.bronzeMinPoints ?? prev.bronzeMinPoints,
            silverMinPoints: badge.silverMinPoints ?? prev.silverMinPoints,
            goldMinPoints: badge.goldMinPoints ?? prev.goldMinPoints,
          };
          return {
            overrides: { ...state.overrides, [key]: updated },
            version: state.version + 1,
          };
        }),
      resetToDefault: () => set((state) => ({ overrides: {}, version: state.version + 1 })),
      resetOne: (disciplineId, stage, gender) =>
        set((state) => {
          const key = normKey(disciplineId, stage, gender);
          if (!state.overrides[key]) {
            return state;
          }
          const next = { ...state.overrides };
          delete next[key];
          return { overrides: next, version: state.version + 1 };
        }),
      importNorms: (norms) =>
        set((state) => {
          const next: NormOverrides = {};
          for (const norm of norms) {
            const key = normKey(norm.disciplineId, norm.stage, norm.gender);
            if (DEFAULT_KEYS.has(key)) {
              next[key] = norm;
            }
          }
          return { overrides: next, version: state.version + 1 };
        }),
    }),
    {
      name: 'gto-norms-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ overrides: state.overrides }),
    },
  ),
);

export function useCustomizedNorms(): { norms: DisciplineNorm[]; customized: boolean } {
  const overrides = useNormsStore((s) => s.overrides);
  return {
    norms: sortedNorms(overrides),
    customized: Object.keys(overrides).length > 0,
  };
}
