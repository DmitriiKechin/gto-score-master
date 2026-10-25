import type {
  BadgeType,
  Discipline,
  DisciplineNorm,
  EvaluationDirection,
  Gender,
  GtoStage,
  Participant,
} from '../types/competition';

export type NormList = readonly DisciplineNorm[];

export interface ScoreResult {
  scores: Record<string, number>;
  totalScore: number;
  awardedBadge: BadgeType;
  missingNorms: string[];
}

export function normKey(disciplineId: string, stage: GtoStage, gender: Gender): string {
  return `${disciplineId}::${stage}::${gender}`;
}

/** Баллы за физический показатель по таблице порогов. */
export function scoreForThresholds(
  thresholds: readonly { value: number; points: number }[],
  direction: EvaluationDirection,
  result: number | null | undefined,
): number {
  if (result == null || !Number.isFinite(result)) {
    return 0;
  }
  if (direction === 'higher_is_better') {
    let best = 0;
    for (const t of thresholds) {
      if (result >= t.value) {
        best = Math.max(best, t.points);
      }
    }
    return best;
  }
  let best = 0;
  for (const t of thresholds) {
    if (result <= t.value) {
      best = Math.max(best, t.points);
    }
  }
  return best;
}

export interface BadgeThresholds {
  bronze: number;
  silver: number;
  gold: number;
}

export function badgeFromTotalScore(totalScore: number, thresholds: BadgeThresholds): BadgeType {
  if (totalScore >= thresholds.gold && thresholds.gold > 0) {
    return 'gold';
  }
  if (totalScore >= thresholds.silver && thresholds.silver > 0) {
    return 'silver';
  }
  if (totalScore >= thresholds.bronze && thresholds.bronze > 0) {
    return 'bronze';
  }
  return 'none';
}

export function sumBadgeThresholds(
  selectedDisciplines: readonly string[],
  stage: GtoStage,
  gender: Gender,
  norms: NormList,
): { bronze: number; silver: number; gold: number; missing: string[] } {
  const thresholds: BadgeThresholds = { bronze: 0, silver: 0, gold: 0 };
  const missing: string[] = [];
  for (const disciplineId of selectedDisciplines) {
    const norm = norms.find(
      (n) => n.disciplineId === disciplineId && n.stage === stage && n.gender === gender,
    );
    if (!norm) {
      missing.push(disciplineId);
      continue;
    }
    thresholds.bronze += norm.bronzeMinPoints ?? 0;
    thresholds.silver += norm.silverMinPoints ?? 0;
    thresholds.gold += norm.goldMinPoints ?? 0;
  }
  return { ...thresholds, missing };
}

/**
 * Полный пересчёт участника: баллы по дисциплинам, сумма, знак отличия.
 * Возвращает новый объект без мутаций исходного.
 */
export function recomputeParticipant(
  participant: Participant,
  selectedDisciplines: readonly string[],
  norms: NormList,
  disciplinesById: ReadonlyMap<string, Discipline>,
): Participant {
  const scores: Record<string, number> = {};
  let totalScore = 0;
  const missingNorms: string[] = [];

  for (const disciplineId of selectedDisciplines) {
    const discipline = disciplinesById.get(disciplineId);
    const norm = norms.find(
      (n) =>
        n.disciplineId === disciplineId && n.stage === participant.stage && n.gender === participant.gender,
    );
    const result = participant.results[disciplineId] ?? null;
    if (!discipline) {
      scores[disciplineId] = 0;
      continue;
    }
    if (!norm) {
      scores[disciplineId] = 0;
      missingNorms.push(disciplineId);
      continue;
    }
    const score = scoreForThresholds(norm.thresholds, discipline.direction, result);
    scores[disciplineId] = score;
    totalScore += score;
  }

  const badgeThresholds = sumBadgeThresholds(
    selectedDisciplines,
    participant.stage,
    participant.gender,
    norms,
  );
  const awardedBadge = badgeFromTotalScore(totalScore, badgeThresholds);

  return {
    ...participant,
    scores,
    totalScore,
    awardedBadge,
    missingNorms,
  } as Participant & { missingNorms: string[] };
}

function compareParticipants(a: Participant, b: Participant): number {
  if (b.totalScore !== a.totalScore) {
    return b.totalScore - a.totalScore;
  }
  const lastNameDiff = a.lastName.localeCompare(b.lastName, 'ru');
  if (lastNameDiff !== 0) {
    return lastNameDiff;
  }
  return a.firstName.localeCompare(b.firstName, 'ru');
}

/**
 * Сортирует участников по убыванию суммы и присваивает места.
 * При равенстве баллов участники получают одинаковое место (зачёт «1224»).
 */
export function rankParticipants(participants: readonly Participant[]): Participant[] {
  const sorted = [...participants].sort(compareParticipants);
  let rank = 0;
  let previousScore = Number.NaN;
  return sorted.map((p, index) => {
    if (p.totalScore !== previousScore) {
      rank = index + 1;
      previousScore = p.totalScore;
    }
    return { ...p, rank };
  });
}

export function maxScoreForNorms(
  selectedDisciplines: readonly string[],
  stage: GtoStage,
  gender: Gender,
  norms: NormList,
): number {
  return selectedDisciplines.reduce((sum, disciplineId) => {
    const norm = norms.find(
      (n) => n.disciplineId === disciplineId && n.stage === stage && n.gender === gender,
    );
    const worst = norm?.thresholds.reduce((min, t) => Math.min(min, t.points), Number.POSITIVE_INFINITY) ?? 0;
    return worst === Number.POSITIVE_INFINITY ? sum : sum + 100;
  }, 0);
}

/** Полный пересчёт мероприятия: баллы, суммы, места и знаки всех участников. */
export function computeEvent(
  event: {
    participants: readonly Participant[];
    selectedDisciplines: readonly string[];
  },
  norms: NormList,
  disciplinesById: ReadonlyMap<string, Discipline>,
): { participants: Participant[] } {
  const computed = event.participants.map((p) =>
    recomputeParticipant(p, event.selectedDisciplines, norms, disciplinesById),
  );
  const ranked = rankParticipants(computed);
  return { participants: ranked };
}
