import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Discipline, GtoStage, Participant } from '../types/competition';
import { formatCompactResult, formatDateRange, GENDER_SHORT_LABELS, formatStage, shortFullName } from './formatters';
import { badgeLabel } from './fileIo';
import type { ProtocolMode } from './pdfGenerator';

type ComputedEvent = {
  title: string;
  date: string;
  endDate?: string;
  location?: string;
  chiefJudge?: string;
  chiefSecretary?: string;
  selectedDisciplines: string[];
  participants: Participant[];
};

interface Widths {
  number: number;
  name: number;
  gender: number;
  stage: number;
  sum: number;
  place: number;
  badge: number;
  discPairs: number;
}

function computeWidths(disciplineCount: number): Widths {
  const number = 4;
  const name = 18;
  const gender = 4;
  const stage = 5;
  const sum = 6;
  const place = 4;
  const badge = 6;
  const base = number + name + gender + stage + sum + place + badge;
  const discPairs = disciplineCount > 0 ? (100 - base) / disciplineCount : 0;
  return { number, name, gender, stage, sum, place, badge, discPairs };
}

type CellAlign =
  | 'start'
  | 'center'
  | 'end'
  | 'both'
  | 'left'
  | 'right'
  | 'mediumKashida'
  | 'distribute'
  | 'numTab'
  | 'highKashida'
  | 'lowKashida'
  | 'thaiDistribute';

function cell(
  content: string,
  widthPct: number,
  opts: { bold?: boolean; align?: CellAlign; size?: number } = {},
): TableCell {
  const lines = content.split('\n');
  const children = lines.flatMap((line, index) => {
    const run = new TextRun({ text: line, bold: opts.bold ?? false, size: opts.size ?? 16 });
    return index === 0 ? [run] : [new TextRun({ break: 1 }), run];
  });
  return new TableCell({
    width: { size: Math.round(widthPct * 100) / 100, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.CENTER,
        children,
      }),
    ],
  });
}

function buildTable(disciplines: Discipline[], participants: Participant[]): Table {
  const widths = computeWidths(disciplines.length);
  const headerRow = new TableRow({
    children: [
      cell('№ п/п', widths.number, { bold: true }),
      cell('ФИО участника', widths.name, { bold: true, align: AlignmentType.LEFT }),
      cell('Пол', widths.gender, { bold: true }),
      cell('Ступень', widths.stage, { bold: true }),
      ...disciplines.flatMap(
        (d) =>
          [
            cell(`${d.shortName}\nРезультат`, widths.discPairs * 0.55, {
              bold: true,
              size: 14,
            }),
            cell(`${d.shortName}\nБаллы`, widths.discPairs * 0.45, {
              bold: true,
              size: 14,
            }),
          ] as TableCell[],
      ),
      cell('Сумма баллов', widths.sum, { bold: true }),
      cell('Место', widths.place, { bold: true }),
      cell('Знак', widths.badge, { bold: true }),
    ],
  });

  const bodyRows: TableRow[] = participants.map((participant, index) => {
    const cells: TableCell[] = [
      cell(String(index + 1), widths.number),
      cell(shortFullName(participant), widths.name, { align: AlignmentType.LEFT }),
      cell(GENDER_SHORT_LABELS[participant.gender], widths.gender),
      cell(formatStage(participant.stage), widths.stage),
    ];
    const split = widths.discPairs;
    for (const discipline of disciplines) {
      const result = participant.results[discipline.id];
      cells.push(
        cell(result != null ? formatCompactResult(result, discipline.unit) : '—', (split * 55) / 100),
        cell(String(participant.scores[discipline.id] ?? 0), (split * 45) / 100),
      );
    }
    cells.push(
      cell(String(participant.totalScore), widths.sum, { bold: true }),
      cell(participant.rank != null ? String(participant.rank) : '—', widths.place),
      cell(badgeLabel(participant.awardedBadge), widths.badge),
    );
    return new TableRow({ children: cells });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '444444' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
    },
    rows: [headerRow, ...bodyRows],
  });
}

function chunkDisciplines(disciplines: readonly Discipline[], max: number): Discipline[][] {
  const chunks: Discipline[][] = [];
  for (let i = 0; i < disciplines.length; i += max) {
    chunks.push(disciplines.slice(i, i + max));
  }
  return chunks.length > 0 ? chunks : [[]];
}

export async function generateProtocolDocxBlob(
  event: ComputedEvent,
  disciplines: readonly Discipline[],
  mode: ProtocolMode,
): Promise<Blob> {
  const marginX = 567;
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'ИТОГОВЫЙ ПРОТОКОЛ СОРЕВНОВАНИЙ ВФСК ГТО', bold: true, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: event.title, bold: true, size: 24 })],
    }),
  );
  const meta = [event.location ? `Место проведения: ${event.location}` : '', event.date ? `Дата: ${formatDateRange(event.date, event.endDate)}` : '']
    .filter(Boolean)
    .join('    ·    ');
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: meta, size: 18 })],
    }),
  );

  const groups = new Map<string, Participant[]>();
  if (mode === 'group') {
    const sorted = [...event.participants].sort(
      (a, b) => a.stage - b.stage || (a.gender === b.gender ? 0 : a.gender === 'male' ? -1 : 1),
    );
    for (const participant of sorted) {
      const key = `${participant.stage}:${participant.gender}`;
      const list = groups.get(key) ?? [];
      list.push(participant);
      groups.set(key, list);
    }
  } else {
    groups.set('all', [...event.participants].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)));
  }

  const chunks = chunkDisciplines(disciplines, 8);
  const groupKeys = [...groups.keys()];
  groupKeys.forEach((key, groupIndex) => {
    const participants = groups.get(key) ?? [];
    const [stage, gender] = key.split(':');
    const title =
      mode === 'group'
        ? `Ступень ${formatStage(Number(stage) as GtoStage)} — ${gender === 'male' ? 'Мужчины' : 'Женщины'} (${participants.length} участн.)`
        : `СВОДНЫЙ ПРОТОКОЛ (${participants.length} участн.)`;
    children.push(
      new Paragraph({
        pageBreakBefore: groupIndex > 0,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: title, bold: true, size: 22 })],
      }),
    );
    for (const chunk of chunks) {
      children.push(buildTable(chunk, participants));
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 0 },
          children: [new TextRun({ text: ' ', size: 12 })],
        }),
      );
    }
  });

  children.push(
    new Paragraph({
      spacing: { before: 320 },
      children: [new TextRun({ text: 'Судейская коллегия:', bold: true, size: 18 })],
    }),
    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: `Главный судья: _______________________ ${event.chiefJudge ? `(${event.chiefJudge})` : ''}`,
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60 },
      children: [
        new TextRun({
          text: `Главный секретарь: ___________________ ${event.chiefSecretary ? `(${event.chiefSecretary})` : ''}`,
          size: 18,
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Times New Roman', size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE },
            margin: { top: marginX, bottom: marginX, left: marginX, right: marginX },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function docxFilename(eventTitle: string, date: string): string {
  const safe = eventTitle.replace(/[^\wа-яё]+/gi, '-').replace(/^-+|-+$/g, '') || 'protocol';
  return `${safe}_${date.replaceAll('-', '')}.docx`;
}

export function downloadDocxBlob(blob: Blob, filename: string): void {
  downloadBlob(blob, filename);
}
