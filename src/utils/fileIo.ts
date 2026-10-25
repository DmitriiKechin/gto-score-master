import { z } from 'zod';
import type {
  CompetitionEvent,
  Discipline,
  DisciplineNorm,
  GtoStage,
  Participant,
} from '../types/competition';
import { slugify } from './formatters';

export const COMPETITION_FILE_VERSION = 1;
export const NORMS_FILE_VERSION = 1;
export const COMPETITION_EXTENSION = '.gto.json';

const genderSchema = z.enum(['male', 'female']);
const stageSchema = z.number().int().min(1).max(18);

const scoreThresholdSchema = z.object({
  value: z.number(),
  points: z.number(),
});

const disciplineNormSchema = z.object({
  disciplineId: z.string(),
  stage: stageSchema,
  gender: genderSchema,
  thresholds: z.array(scoreThresholdSchema),
  bronzeMinPoints: z.number().optional(),
  silverMinPoints: z.number().optional(),
  goldMinPoints: z.number().optional(),
});

const participantSchema = z.object({
  id: z.string(),
  bibNumber: z.string().optional(),
  lastName: z.string(),
  firstName: z.string(),
  middleName: z.string().optional(),
  gender: genderSchema,
  stage: stageSchema,
  age: z.number().optional(),
  team: z.string().optional(),
  results: z.record(z.string(), z.number().nullable()).optional(),
  scores: z.record(z.string(), z.number()).optional(),
  totalScore: z.number().optional(),
  rank: z.number().optional(),
  awardedBadge: z.enum(['none', 'bronze', 'silver', 'gold']).optional(),
});

const competitionEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  chiefJudge: z.string().optional(),
  chiefSecretary: z.string().optional(),
  selectedDisciplines: z.array(z.string()),
  participants: z.array(participantSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const competitionFileSchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  event: competitionEventSchema,
});

const normsFileSchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  norms: z.array(disciplineNormSchema),
});

function downloadTextFile(filename: string, content: string, mime = 'application/json'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function competitionFileName(event: CompetitionEvent): string {
  const date = event.date.replaceAll('-', '');
  return `${slugify(event.title)}_${date}${COMPETITION_EXTENSION}`;
}

export function exportCompetitionJson(event: CompetitionEvent): void {
  const payload: z.infer<typeof competitionFileSchema> = {
    version: COMPETITION_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    event: flattenEvent(event),
  };
  downloadTextFile(competitionFileName(event), JSON.stringify(payload, null, 2));
}

/** Обновляет модифицируемые поля участников перед экспортом. */
function flattenEvent(event: CompetitionEvent): CompetitionEvent {
  return {
    ...event,
    participants: event.participants.map((p) => ({
      lastName: p.lastName,
      firstName: p.firstName,
      middleName: p.middleName,
      bibNumber: p.bibNumber,
      gender: p.gender,
      stage: p.stage,
      age: p.age,
      team: p.team,
      results: p.results,
      scores: p.scores,
      totalScore: p.totalScore,
      rank: p.rank,
      awardedBadge: p.awardedBadge,
      id: p.id,
    })),
  };
}

export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsText(file);
  });
}

export async function importCompetitionFile(file: File): Promise<CompetitionEvent> {
  const raw = await readTextFile(file);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Файл не является корректным JSON');
  }
  const parsed = competitionFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Неверный формат файла проекта: ${parsed.error.issues[0]?.message ?? 'неизвестная ошибка'}`,
    );
  }
  const event = parsed.data.event;
  return {
    ...event,
    participants: event.participants.map((p) => ({
      ...p,
      stage: p.stage as GtoStage,
      results: p.results ?? {},
      scores: p.scores ?? {},
      totalScore: p.totalScore ?? 0,
      awardedBadge: p.awardedBadge ?? 'none',
    })),
  };
}

export function exportNormsJson(norms: DisciplineNorm[]): void {
  const payload: z.infer<typeof normsFileSchema> = {
    version: NORMS_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    norms,
  };
  downloadTextFile(
    `gto_norms_${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(payload, null, 2),
  );
}

export async function importNormsFile(file: File): Promise<DisciplineNorm[]> {
  const raw = await readTextFile(file);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Файл не является корректным JSON');
  }
  const parsed = normsFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Неверный формат файла нормативов: ${parsed.error.issues[0]?.message ?? 'неизвестная ошибка'}`,
    );
  }
  return parsed.data.norms.map((n) => ({ ...n, stage: n.stage as GtoStage }));
}

export function exportParticipantsCsv(event: CompetitionEvent, disciplines: readonly Discipline[]): void {
  const discs = event.selectedDisciplines
    .map((id) => disciplines.find((d) => d.id === id))
    .filter((d): d is Discipline => Boolean(d));
  const rows: string[][] = [];
  const header = [
    '№ п/п',
    'Фамилия',
    'Имя',
    'Отчество',
    'Пол',
    'Ступень',
    'Возраст',
    'Организация',
    ...discs.flatMap((d) => [`${d.shortName}: результат`, `${d.shortName}: баллы`]),
    'Сумма баллов',
    'Место',
    'Знак',
  ];
  rows.push(header);
  const sorted = [...event.participants].sort(
    (a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER),
  );
  sorted.forEach((p, index) => {
    const row: string[] = [
      String(index + 1),
      p.lastName,
      p.firstName,
      p.middleName ?? '',
      p.gender === 'male' ? 'М' : 'Ж',
      String(p.stage),
      p.age != null ? String(p.age) : '',
      p.team ?? '',
    ];
    for (const disc of discs) {
      const result = p.results[disc.id] ?? null;
      row.push(result != null ? String(result).replace('.', ',') : '');
      row.push(String(p.scores[disc.id] ?? 0));
    }
    row.push(String(p.totalScore));
    row.push(p.rank != null ? String(p.rank) : '');
    row.push(badgeLabel(p.awardedBadge));
    rows.push(row);
  });
  const csv = rows.map((r) => r.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n');
  downloadTextFile(`${slugify(event.title)}_${event.date}.csv`, `\uFEFF${csv}`, 'text/csv');
}

const BADGE_LABELS: Record<string, string> = {
  none: '—',
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
};

export function badgeLabel(badge: Participant['awardedBadge'] | undefined): string {
  return badge ? (BADGE_LABELS[badge] ?? '—') : '—';
}
