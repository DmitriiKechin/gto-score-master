import type { DisciplineNorm, Gender, GtoStage, ScoreThreshold } from '../types/competition';
import { getDiscipline } from './defaultDisciplines';

interface ScaleBand {
  best: number;
  worst: number;
}

interface ScaleDefinition {
  /** Диапазон ступеней, для которых испытание официально предусмотрено комплексом ГТО */
  stages: [number, number];
  step: number;
  precision: number;
  femaleFactor?: number;
  femaleOffset?: number;
  /** Полы, для которых испытание предусмотрено официально (по умолчанию оба) */
  genders?: Gender[];
  males: Partial<Record<GtoStage, ScaleBand>>;
}

function round(value: number, precision: number): number {
  const p = 10 ** precision;
  return Math.round(value * p) / p;
}

const SCALE_DEFINITIONS: Record<string, ScaleDefinition> = {
  run_30: {
    stages: [1, 6],
    step: 0.1,
    precision: 1,
    femaleFactor: 1.09,
    males: {
      1: { best: 6.2, worst: 8.1 },
      2: { best: 5.9, worst: 7.7 },
      3: { best: 5.4, worst: 7.2 },
      4: { best: 4.9, worst: 6.8 },
      5: { best: 4.4, worst: 6.4 },
      6: { best: 4.2, worst: 6.1 },
    },
  },
  run_60: {
    stages: [1, 6],
    step: 0.1,
    precision: 1,
    femaleFactor: 1.1,
    males: {
      1: { best: 11.8, worst: 15.0 },
      2: { best: 11.0, worst: 14.2 },
      3: { best: 10.0, worst: 13.0 },
      4: { best: 9.0, worst: 12.0 },
      5: { best: 8.2, worst: 11.2 },
      6: { best: 7.9, worst: 10.9 },
    },
  },
  run_100: {
    stages: [7, 9],
    step: 0.1,
    precision: 1,
    femaleFactor: 1.12,
    males: {
      7: { best: 11.8, worst: 14.5 },
      8: { best: 11.6, worst: 14.3 },
      9: { best: 11.7, worst: 14.4 },
    },
  },
  shuttle_3x10: {
    stages: [1, 7],
    step: 0.1,
    precision: 1,
    femaleFactor: 1.08,
    males: {
      1: { best: 9.6, worst: 11.6 },
      2: { best: 9.2, worst: 11.1 },
      3: { best: 8.8, worst: 10.7 },
      4: { best: 8.0, worst: 9.9 },
      5: { best: 7.5, worst: 9.5 },
      6: { best: 7.3, worst: 9.2 },
      7: { best: 7.2, worst: 9.1 },
    },
  },
  run_1000: {
    stages: [1, 6],
    step: 5,
    precision: 0,
    femaleFactor: 1.12,
    males: {
      1: { best: 335, worst: 395 },
      2: { best: 315, worst: 380 },
      3: { best: 285, worst: 350 },
      4: { best: 255, worst: 320 },
      5: { best: 245, worst: 305 },
      6: { best: 240, worst: 300 },
    },
  },
  run_1500: {
    stages: [7, 9],
    step: 5,
    precision: 0,
    femaleFactor: 1.12,
    males: {
      7: { best: 305, worst: 400 },
      8: { best: 300, worst: 395 },
      9: { best: 305, worst: 400 },
    },
  },
  run_2000: {
    stages: [7, 18],
    step: 5,
    precision: 0,
    femaleFactor: 1.1,
    males: {
      7: { best: 450, worst: 600 },
      8: { best: 440, worst: 590 },
      9: { best: 445, worst: 595 },
      10: { best: 460, worst: 615 },
      11: { best: 480, worst: 635 },
      12: { best: 510, worst: 665 },
      13: { best: 540, worst: 700 },
      14: { best: 575, worst: 735 },
      15: { best: 610, worst: 770 },
      16: { best: 650, worst: 810 },
      17: { best: 690, worst: 850 },
      18: { best: 740, worst: 900 },
    },
  },
  run_3000: {
    stages: [7, 18],
    step: 5,
    precision: 0,
    genders: ['male'],
    males: {
      7: { best: 750, worst: 990 },
      8: { best: 735, worst: 975 },
      9: { best: 740, worst: 980 },
      10: { best: 765, worst: 1005 },
      11: { best: 795, worst: 1035 },
      12: { best: 835, worst: 1075 },
      13: { best: 880, worst: 1120 },
      14: { best: 930, worst: 1170 },
      15: { best: 990, worst: 1230 },
      16: { best: 1050, worst: 1290 },
      17: { best: 1110, worst: 1350 },
      18: { best: 1190, worst: 1430 },
    },
  },
  pullups: {
    stages: [1, 18],
    step: 1,
    precision: 0,
    femaleFactor: 0.3,
    males: {
      1: { best: 3, worst: 1 },
      2: { best: 4, worst: 1 },
      3: { best: 6, worst: 1 },
      4: { best: 8, worst: 1 },
      5: { best: 11, worst: 1 },
      6: { best: 13, worst: 1 },
      7: { best: 14, worst: 1 },
      8: { best: 14, worst: 1 },
      9: { best: 12, worst: 1 },
      10: { best: 11, worst: 1 },
      11: { best: 10, worst: 1 },
      12: { best: 9, worst: 1 },
      13: { best: 8, worst: 1 },
      14: { best: 7, worst: 1 },
      15: { best: 6, worst: 1 },
      16: { best: 5, worst: 1 },
      17: { best: 4, worst: 1 },
      18: { best: 3, worst: 1 },
    },
  },
  pushups: {
    stages: [1, 18],
    step: 1,
    precision: 0,
    femaleFactor: 0.65,
    males: {
      1: { best: 10, worst: 1 },
      2: { best: 14, worst: 1 },
      3: { best: 20, worst: 1 },
      4: { best: 26, worst: 1 },
      5: { best: 34, worst: 1 },
      6: { best: 38, worst: 1 },
      7: { best: 40, worst: 1 },
      8: { best: 40, worst: 1 },
      9: { best: 36, worst: 1 },
      10: { best: 33, worst: 1 },
      11: { best: 30, worst: 1 },
      12: { best: 26, worst: 1 },
      13: { best: 22, worst: 1 },
      14: { best: 18, worst: 1 },
      15: { best: 14, worst: 1 },
      16: { best: 11, worst: 1 },
      17: { best: 9, worst: 1 },
      18: { best: 7, worst: 1 },
    },
  },
  trunk_raises: {
    stages: [1, 18],
    step: 1,
    precision: 0,
    femaleFactor: 0.85,
    males: {
      1: { best: 28, worst: 15 },
      2: { best: 32, worst: 18 },
      3: { best: 36, worst: 20 },
      4: { best: 40, worst: 24 },
      5: { best: 44, worst: 28 },
      6: { best: 46, worst: 30 },
      7: { best: 48, worst: 32 },
      8: { best: 48, worst: 32 },
      9: { best: 46, worst: 30 },
      10: { best: 42, worst: 28 },
      11: { best: 38, worst: 24 },
      12: { best: 32, worst: 20 },
      13: { best: 28, worst: 16 },
      14: { best: 24, worst: 14 },
      15: { best: 20, worst: 10 },
      16: { best: 16, worst: 8 },
      17: { best: 14, worst: 6 },
      18: { best: 12, worst: 5 },
    },
  },
  forward_bend: {
    stages: [1, 18],
    step: 1,
    precision: 0,
    femaleFactor: 1,
    femaleOffset: 3,
    males: {
      1: { best: 8, worst: -4 },
      2: { best: 9, worst: -3 },
      3: { best: 9, worst: -3 },
      4: { best: 10, worst: -2 },
      5: { best: 11, worst: -1 },
      6: { best: 12, worst: -1 },
      7: { best: 13, worst: 0 },
      8: { best: 13, worst: 0 },
      9: { best: 12, worst: -1 },
      10: { best: 11, worst: -2 },
      11: { best: 10, worst: -3 },
      12: { best: 9, worst: -4 },
      13: { best: 8, worst: -5 },
      14: { best: 7, worst: -6 },
      15: { best: 6, worst: -7 },
      16: { best: 5, worst: -8 },
      17: { best: 4, worst: -9 },
      18: { best: 3, worst: -10 },
    },
  },
  long_jump: {
    stages: [1, 18],
    step: 1,
    precision: 0,
    femaleFactor: 0.92,
    males: {
      1: { best: 145, worst: 85 },
      2: { best: 160, worst: 100 },
      3: { best: 175, worst: 115 },
      4: { best: 200, worst: 135 },
      5: { best: 225, worst: 160 },
      6: { best: 240, worst: 175 },
      7: { best: 250, worst: 185 },
      8: { best: 250, worst: 185 },
      9: { best: 245, worst: 180 },
      10: { best: 235, worst: 170 },
      11: { best: 225, worst: 160 },
      12: { best: 210, worst: 145 },
      13: { best: 195, worst: 130 },
      14: { best: 180, worst: 115 },
      15: { best: 165, worst: 100 },
      16: { best: 150, worst: 90 },
      17: { best: 135, worst: 80 },
      18: { best: 120, worst: 70 },
    },
  },
  swim_50: {
    stages: [3, 18],
    step: 1,
    precision: 0,
    femaleFactor: 1.12,
    males: {
      3: { best: 60, worst: 70 },
      4: { best: 55, worst: 65 },
      5: { best: 50, worst: 60 },
      6: { best: 47, worst: 57 },
      7: { best: 45, worst: 55 },
      8: { best: 45, worst: 55 },
      9: { best: 46, worst: 56 },
      10: { best: 50, worst: 60 },
      11: { best: 54, worst: 64 },
      12: { best: 60, worst: 70 },
      13: { best: 66, worst: 76 },
      14: { best: 72, worst: 82 },
      15: { best: 78, worst: 88 },
      16: { best: 85, worst: 95 },
      17: { best: 92, worst: 102 },
      18: { best: 100, worst: 110 },
    },
  },
  ski_1km: {
    stages: [1, 3],
    step: 10,
    precision: 0,
    femaleFactor: 1.1,
    males: {
      1: { best: 300, worst: 480 },
      2: { best: 270, worst: 450 },
      3: { best: 240, worst: 420 },
    },
  },
  ski_2km: {
    stages: [4, 9],
    step: 10,
    precision: 0,
    femaleFactor: 1.1,
    males: {
      4: { best: 420, worst: 600 },
      5: { best: 390, worst: 570 },
      6: { best: 360, worst: 540 },
      7: { best: 340, worst: 520 },
      8: { best: 340, worst: 520 },
      9: { best: 350, worst: 530 },
    },
  },
  ski_3km: {
    stages: [10, 18],
    step: 10,
    precision: 0,
    femaleFactor: 1.1,
    males: {
      10: { best: 660, worst: 840 },
      11: { best: 690, worst: 870 },
      12: { best: 720, worst: 900 },
      13: { best: 760, worst: 940 },
      14: { best: 800, worst: 980 },
      15: { best: 850, worst: 1030 },
      16: { best: 900, worst: 1080 },
      17: { best: 950, worst: 1130 },
      18: { best: 1020, worst: 1200 },
    },
  },
  shooting: {
    stages: [5, 18],
    step: 1,
    precision: 0,
    males: {
      5: { best: 40, worst: 5 },
      6: { best: 40, worst: 8 },
      7: { best: 40, worst: 10 },
      8: { best: 40, worst: 10 },
      9: { best: 40, worst: 10 },
      10: { best: 40, worst: 10 },
      11: { best: 40, worst: 10 },
      12: { best: 40, worst: 10 },
      13: { best: 40, worst: 10 },
      14: { best: 40, worst: 10 },
      15: { best: 40, worst: 10 },
      16: { best: 40, worst: 10 },
      17: { best: 40, worst: 10 },
      18: { best: 40, worst: 10 },
    },
  },
  throwing_ball: {
    stages: [1, 6],
    step: 0.5,
    precision: 1,
    femaleFactor: 0.75,
    males: {
      1: { best: 18, worst: 10 },
      2: { best: 22, worst: 13 },
      3: { best: 26, worst: 16 },
      4: { best: 32, worst: 20 },
      5: { best: 38, worst: 24 },
      6: { best: 40, worst: 26 },
    },
  },
  throwing_shell: {
    stages: [7, 18],
    step: 0.5,
    precision: 1,
    femaleFactor: 0.7,
    males: {
      7: { best: 38, worst: 24 },
      8: { best: 38, worst: 24 },
      9: { best: 36, worst: 23 },
      10: { best: 32, worst: 20 },
      11: { best: 29, worst: 18 },
      12: { best: 25, worst: 15 },
      13: { best: 21, worst: 12 },
      14: { best: 18, worst: 10 },
      15: { best: 15, worst: 8 },
      16: { best: 13, worst: 6 },
      17: { best: 11, worst: 5 },
      18: { best: 9, worst: 4 },
    },
  },
};

export const DEFAULT_BADGE_MIN_POINTS = {
  bronze: 50,
  silver: 75,
  gold: 90,
} as const;

function buildThresholds(disciplineId: string, stage: GtoStage, gender: Gender): ScoreThreshold[] {
  const discipline = getDiscipline(disciplineId);
  const definition = SCALE_DEFINITIONS[disciplineId];
  if (!discipline || !definition) {
    return [];
  }
  const band = definition.males[stage];
  if (!band) {
    return [];
  }

  const precision = definition.precision;
  let best = band.best;
  let worst = band.worst;
  if (gender === 'female') {
    const factor = definition.femaleFactor ?? 1;
    const offset = definition.femaleOffset ?? 0;
    best = round(best * factor + offset, precision);
    worst = round(worst * factor + offset, precision);
  }

  if (best === worst) {
    if (discipline.direction === 'higher_is_better') {
      worst = Math.max(0, best - 1);
    } else {
      worst = best + 1;
    }
  }

  const start = discipline.direction === 'lower_is_better' ? best : worst;
  const end = discipline.direction === 'lower_is_better' ? worst : best;
  const eps = Math.max(1, Math.abs(start)) * 1e-9;

  const thresholds: ScoreThreshold[] = [];
  const span = best - worst;
  const denom = span === 0 ? 1 : span;
  let lastPoints = Number.NaN;
  for (let k = 0; ; k++) {
    const value = round(start + k * definition.step, precision);
    if (value > end + eps) {
      break;
    }
    const rank = (value - worst) / denom;
    const points = Math.min(100, Math.max(1, Math.round(1 + 99 * rank)));
    if (points === lastPoints) {
      continue;
    }
    lastPoints = points;
    thresholds.push({ value: round(value, precision), points });
  }

  const withExtremes = [...thresholds];
  if (!withExtremes.some((t) => t.points === 100)) {
    withExtremes.push({ value: best, points: 100 });
  }
  if (!withExtremes.some((t) => t.points === 1)) {
    withExtremes.push({ value: worst, points: 1 });
  }
  const sorted = withExtremes.sort((a, b) => a.value - b.value);
  const deduped: ScoreThreshold[] = [];
  for (const t of sorted) {
    const last = deduped.at(-1);
    if (last && last.points === t.points) {
      continue;
    }
    deduped.push(t);
  }
  return deduped;
}

/** Строит только официально предусмотренные сочетания «испытание × ступень × пол». */
export function buildDefaultNorms(): DisciplineNorm[] {
  const norms: DisciplineNorm[] = [];
  for (const [disciplineId, definition] of Object.entries(SCALE_DEFINITIONS)) {
    const [stageFrom, stageTo] = definition.stages;
    const genders: Gender[] = definition.genders ?? ['male', 'female'];
    for (let stage = stageFrom; stage <= stageTo; stage++) {
      for (const gender of genders) {
        const thresholds = buildThresholds(disciplineId, stage as GtoStage, gender);
        if (thresholds.length === 0) {
          continue;
        }
        norms.push({
          disciplineId,
          stage: stage as GtoStage,
          gender,
          thresholds,
          bronzeMinPoints: DEFAULT_BADGE_MIN_POINTS.bronze,
          silverMinPoints: DEFAULT_BADGE_MIN_POINTS.silver,
          goldMinPoints: DEFAULT_BADGE_MIN_POINTS.gold,
        });
      }
    }
  }
  return norms;
}

export const DEFAULT_NORMS: DisciplineNorm[] = buildDefaultNorms();
