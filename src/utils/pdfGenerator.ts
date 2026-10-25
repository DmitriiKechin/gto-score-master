import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import RobotoBoldUrl from '../assets/fonts/Roboto-Bold.ttf?url';
import RobotoRegularUrl from '../assets/fonts/Roboto-Regular.ttf?url';
import type { Discipline, Participant } from '../types/competition';
import { badgeLabel } from './fileIo';
import { formatCompactResult, formatDateRange } from './formatters';

export type ProtocolMode = 'summary' | 'group';

interface FontPair {
  regular: string;
  bold: string;
}

let fontCache: FontPair | null = null;

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadFontData(): Promise<FontPair> {
  if (fontCache) {
    return fontCache;
  }
  const [regularResponse, boldResponse] = await Promise.all([fetch(RobotoRegularUrl), fetch(RobotoBoldUrl)]);
  const [regularBuffer, boldBuffer] = await Promise.all([
    regularResponse.arrayBuffer(),
    boldResponse.arrayBuffer(),
  ]);
  fontCache = { regular: toBase64(regularBuffer), bold: toBase64(boldBuffer) };
  return fontCache;
}

async function setupDocument() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const fonts = await loadFontData();
  doc.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
  return doc;
}

function groupKey(stage: number, gender: 'male' | 'female'): string {
  return `${stage}:${gender}`;
}

function getFinalY(doc: jsPDF): number {
  const last = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
  return last?.finalY ?? 10;
}

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

const STAGE_ROMAN = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
];

function stageLabel(stage: number): string {
  return STAGE_ROMAN[stage - 1] ?? String(stage);
}

const GENDER_NAMES = { male: 'Мужчины', female: 'Женщины' } as const;

function chunkDisciplines(disciplines: readonly Discipline[], maxDiscs: number): Discipline[][] {
  const chunks: Discipline[][] = [];
  for (let i = 0; i < disciplines.length; i += maxDiscs) {
    chunks.push(disciplines.slice(i, i + maxDiscs));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function buildHead(disciplines: Discipline[]): string[] {
  return [
    '№ п/п',
    'ФИО участника',
    'Пол',
    'Ступень',
    ...disciplines.flatMap((d) => [`${d.shortName}\nРезультат`, `${d.shortName}\nБаллы`]),
    'Сумма\nбаллов',
    'Место',
    'Знак',
  ];
}

function buildRow(participant: Participant, disciplines: Discipline[], index: number): string[] {
  const cells: string[] = [
    String(index + 1),
    [participant.lastName, participant.firstName, participant.middleName ?? ''].filter(Boolean).join(' '),
    participant.gender === 'male' ? 'М' : 'Ж',
    stageLabel(participant.stage),
  ];
  for (const discipline of disciplines) {
    const result = participant.results[discipline.id];
    cells.push(result != null ? formatCompactResult(result, discipline.unit) : '—');
    cells.push(String(participant.scores[discipline.id] ?? 0));
  }
  cells.push(String(participant.totalScore));
  cells.push(participant.rank != null ? String(participant.rank) : '—');
  cells.push(badgeLabel(participant.awardedBadge));
  return cells;
}

function computeColumnWidths(doc: jsPDF, disciplineCount: number): number[] {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const available = pageWidth - marginX * 2;
  const baseX: number[] = [9, 36, 9, 11, 13, 8, 12];
  const baseTotal = baseX.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, available - baseTotal);
  const pairCount = disciplineCount;
  const pairWidth = pairCount > 0 ? remaining / pairCount : 0;
  const widths: number[] = [...baseX];
  for (let i = 0; i < pairCount; i++) {
    widths.push(pairWidth * 0.55, pairWidth * 0.45);
  }
  return widths;
}

async function buildProtocol(
  event: ComputedEvent,
  disciplines: Discipline[],
  mode: ProtocolMode,
): Promise<jsPDF> {
  const doc = await setupDocument();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  let cursorY = 12;
  let lastTableY = 0;

  const nextY = (spacing: number) => Math.max(cursorY, lastTableY) + spacing;

  const printHeader = () => {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(15);
    doc.text('ИТОГОВЫЙ ПРОТОКОЛ СОРЕВНОВАНИЙ ВФСК ГТО', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(11);
    doc.text(event.title, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 5.5;
    doc.setFontSize(9);
    const meta = [
      event.location ? `Место проведения: ${event.location}` : '',
      event.date ? `Дата: ${formatDateRange(event.date, event.endDate)}` : '',
    ]
      .filter(Boolean)
      .join('  ·  ');
    doc.text(meta || ' ', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 3;
  };

  const printSectionTitle = (title: string) => {
    cursorY = nextY(6);
    if (cursorY + 12 > pageHeight - 15) {
      doc.addPage();
      cursorY = 12;
    }
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(10);
    doc.text(title, marginX, cursorY);
    cursorY += 4;
  };

  printHeader();

  const groups = new Map<string, Participant[]>();
  if (mode === 'group') {
    const sorted = [...event.participants].sort(
      (a, b) => a.stage - b.stage || (a.gender === b.gender ? 0 : a.gender === 'male' ? -1 : 1),
    );
    for (const participant of sorted) {
      const key = groupKey(participant.stage, participant.gender);
      const list = groups.get(key) ?? [];
      list.push(participant);
      groups.set(key, list);
    }
  } else {
    groups.set(
      'all',
      [...event.participants].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)),
    );
  }

  const chunks = chunkDisciplines(disciplines, 7);
  const needsChunkHeader = chunks.length > 1;

  for (const [key, participants] of groups) {
    const [stage, gender] = key.split(':');
    const sectionTitle =
      mode === 'group'
        ? `Ступень ${stageLabel(Number(stage))} — ${GENDER_NAMES[gender as 'male' | 'female']} (${participants.length} участн.)`
        : `СВОДНЫЙ ПРОТОКОЛ (${participants.length} участн.)`;
    printSectionTitle(sectionTitle);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      if (needsChunkHeader && chunkIndex > 0) {
        printSectionTitle(`Продолжение: ${chunk.map((d) => d.shortName).join(', ')}`);
      }
      const head = buildHead(chunk);
      const body = participants.map((p, index) => buildRow(p, chunk, index));
      const widths = computeColumnWidths(doc, chunk.length);
      const columnStyles: Record<
        number,
        { cellWidth?: number; halign?: 'left' | 'center' | 'right' | 'justify' }
      > = {};
      widths.forEach((width, index) => {
        columnStyles[index] = { cellWidth: width };
      });
      columnStyles[1] = { ...columnStyles[1], halign: 'left' };
      autoTable(doc, {
        head: [head],
        body,
        startY: nextY(2),
        margin: { left: marginX, right: marginX },
        theme: 'grid',
        styles: {
          font: 'Roboto',
          fontStyle: 'normal',
          fontSize: 6.8,
          cellPadding: 1.2,
          textColor: [30, 41, 59],
          lineColor: [180, 190, 205],
          lineWidth: 0.15,
          valign: 'middle',
          halign: 'center',
        },
        headStyles: {
          fontStyle: 'bold',
          fillColor: [255, 255, 255],
          textColor: [30, 58, 138],
          lineColor: [30, 58, 138],
          lineWidth: 0.3,
          halign: 'center',
          valign: 'middle',
        },
        columnStyles,
        didDrawPage: () => {
          doc.setFont('Roboto', 'normal');
          doc.setFontSize(8);
          doc.text(`ВФСК ГТО · Итоговый протокол "${event.title}"`, marginX, pageHeight - 6);
          const pageNumber = doc.getNumberOfPages();
          doc.text(`Страница ${pageNumber}`, pageWidth - marginX, pageHeight - 6, { align: 'right' });
        },
      });
      lastTableY = getFinalY(doc);
    }
  }

  const finalY = Math.max(cursorY, lastTableY) + 14;
  const pageHeightForSign = doc.internal.pageSize.getHeight();
  if (finalY > pageHeightForSign - 26) {
    doc.addPage();
    cursorY = 12;
  } else {
    cursorY = finalY;
  }

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.text('Судейская коллегия:', marginX, cursorY);
  cursorY += 8;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  const judgeNames = [event.chiefJudge, event.chiefSecretary].map((name) =>
    name ? `(${name})` : '(Фамилия И.О.)',
  );
  doc.text(`Главный судья: _____________________  ${judgeNames[0]}`, marginX, cursorY);
  doc.text(`Главный секретарь: _________________  ${judgeNames[1]}`, pageWidth - 140, cursorY + 6);

  return doc;
}

export async function generateProtocol(
  event: ComputedEvent,
  disciplines: readonly Discipline[],
  mode: ProtocolMode,
): Promise<jsPDF> {
  return buildProtocol(event, [...disciplines], mode);
}

export function downloadProtocol(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function protocolPreviewUrl(doc: jsPDF): string {
  const url = doc.output('bloburl');
  return typeof url === 'string' ? url : url.href;
}

export function protocolFilename(eventTitle: string, date: string): string {
  const safe = eventTitle.replace(/[^\wа-яё]+/gi, '-').replace(/^-+|-+$/g, '') || 'protocol';
  return `${safe}_${date.replaceAll('-', '')}.pdf`;
}
