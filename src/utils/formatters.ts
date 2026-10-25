import type { GtoStage, MetricUnit, Participant } from '../types/competition';

export const STAGE_LABELS: Record<GtoStage, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII',
  13: 'XIII',
  14: 'XIV',
  15: 'XV',
  16: 'XVI',
  17: 'XVII',
  18: 'XVIII',
};

export const ALL_STAGES: GtoStage[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export const GENDER_LABELS = {
  male: 'Мужской',
  female: 'Женский',
} as const;

export const GENDER_SHORT_LABELS = {
  male: 'М',
  female: 'Ж',
} as const;

export const UNIT_LABELS: Record<MetricUnit, string> = {
  seconds: 'сек',
  minutes_seconds: 'мин:сек',
  count: 'раз',
  meters: 'м',
  centimeters: 'см',
};

export function formatStage(stage: GtoStage): string {
  return STAGE_LABELS[stage] ?? String(stage);
}

export function stageAgeRange(stage: GtoStage): string {
  const ranges: Record<number, string> = {
    1: '6-7 лет',
    2: '8-9 лет',
    3: '10-11 лет',
    4: '12-13 лет',
    5: '14-15 лет',
    6: '16-17 лет',
    7: '18-19 лет',
    8: '20-24 года',
    9: '25-29 лет',
    10: '30-34 года',
    11: '35-39 лет',
    12: '40-44 года',
    13: '45-49 лет',
    14: '50-54 года',
    15: '55-59 лет',
    16: '60-64 года',
    17: '65-69 лет',
    18: '70+ лет',
  };
  return ranges[stage] ?? '';
}

export function formatFullName(p: Pick<Participant, 'lastName' | 'firstName' | 'middleName'>): string {
  const parts = [p.lastName, p.firstName, p.middleName ?? ''].filter((s) => s.trim());
  return parts.join(' ').trim() || '—';
}

export function shortFullName(p: Pick<Participant, 'lastName' | 'firstName' | 'middleName'>): string {
  let name = p.lastName;
  if (p.firstName) {
    name += ` ${p.firstName[0]}.`;
  }
  if (p.middleName) {
    name += ` ${p.middleName[0]}.`;
  }
  return name.trim() || '—';
}

function decimal(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

/** Отображение физического результата по единице измерения. */
export function formatResultValue(value: number | null | undefined, unit: MetricUnit): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }
  switch (unit) {
    case 'seconds':
      return `${decimal(value)} сек`;
    case 'minutes_seconds': {
      const total = Math.round(value);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    case 'count':
      return `${Math.round(value)} раз`;
    case 'meters':
      return `${decimal(value)} м`;
    case 'centimeters':
      return `${Math.round(value)} см`;
  }
}

export function formatCompactResult(value: number | null | undefined, unit: MetricUnit): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }
  switch (unit) {
    case 'seconds':
      return decimal(value);
    case 'minutes_seconds': {
      const total = Math.round(value);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    case 'count':
      return `${Math.round(value)}`;
    case 'meters':
      return decimal(value);
    case 'centimeters':
      return `${Math.round(value)}`;
  }
}

/** Парсинг результата из строки. Запятая трактуется как десятичный разделитель. */
export function parseResultText(text: string, unit: MetricUnit): number | null {
  const raw = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!raw) {
    return null;
  }
  if (unit === 'minutes_seconds' && /^\d{1,3}:\d{1,2}$/.test(raw)) {
    const [m, s] = raw.split(':').map((x) => Number.parseInt(x, 10));
    const total = m * 60 + s;
    return Number.isFinite(total) ? total : null;
  }
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) {
    return null;
  }
  if (unit === 'count' || unit === 'centimeters') {
    return Math.round(value);
  }
  return value;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Форматирует период соревнований: один день или диапазон дат. */
export function formatDateRange(iso: string | undefined, endIso?: string): string {
  const start = formatDate(iso);
  if (start === '—') {
    return '—';
  }
  if (!endIso || endIso === iso) {
    return start;
  }
  const end = formatDate(endIso);
  return `${start} – ${end}`;
}

export function todayISO(): string {
  const now = new Date();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'gto'
  );
}
