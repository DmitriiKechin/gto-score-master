import { readFileSync } from 'node:fs';
import { DEFAULT_DISCIPLINES } from '../src/data/defaultDisciplines';
import { DEFAULT_NORMS } from '../src/data/defaultNorms';
import { generateProtocol, protocolFilename } from '../src/utils/pdfGenerator';
import { computeEvent } from '../src/utils/scoreCalculator';
import { DISCIPLINE_BY_ID } from '../src/data/defaultDisciplines';
import type { CompetitionEvent, Participant, Gender, GtoStage } from '../src/types/competition';
import { downloadProtocol } from '../src/utils/pdfGenerator';

const fontBase = (name: string) => {
  const buf = readFileSync(`./src/assets/fonts/${name}.ttf`);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < buf.length; i += chunkSize) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};
const vfs: Record<string, string> = {
  'Roboto-Regular.ttf': fontBase('Roboto-Regular'),
  'Roboto-Bold.ttf': fontBase('Roboto-Bold'),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = async (input: string | URL) => {
  const url = String(input);
  const name = url.split('/').pop() ?? '';
  if (!(name in vfs)) {
    throw new Error(`no asset ${url}`);
  }
  return {
    async arrayBuffer() {
      const text = vfs[name];
      const bin = atob(text);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return bytes.buffer;
    },
  } as Response;
};

const surnames = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Смирнов', 'Волков', 'Соколов', 'Лебедев'];
const names = ['Иван', 'Пётр', 'Сергей', 'Алексей', 'Дмитрий', 'Николай', 'Андрей'];
function participants(count: number): Participant[] {
  const out: Participant[] = [];
  for (let i = 0; i < count; i++) {
    const gender: Gender = i % 2 === 0 ? 'male' : 'female';
    const stage = (i % 18) + 1 as GtoStage;
    out.push({
      id: `p${i}`,
      bibNumber: String(i + 1),
      lastName: surnameS(i % surnames.length),
      firstName: names[i % names.length],
      gender,
      stage,
      results: { run_30: 5.5, pullups: 7, forward_bend: 5, long_jump: 180 },
      scores: {},
      totalScore: 0,
    });
  }
  return out;
}
function surnameS(i: number): string {
  return surnames[i % surnames.length] + ((i % 2 === 0) ? 'ов' : 'а');
}

async function measure(count: number, discs: number) {
  const selected = DEFAULT_DISCIPLINES.slice(0, discs).map((d) => d.id);
  const event: CompetitionEvent = {
    id: 'e1',
    title: 'Тестовый протокол нагруженности',
    date: '2026-10-24',
    location: 'Москва',
    selectedDisciplines: selected,
    participants: participants(count),
    createdAt: '',
    updatedAt: '',
  };
  const computed = { ...event, participants: computeEvent(event, DEFAULT_NORMS, DISCIPLINE_BY_ID).participants };
  const disciplines = selected.map((id) => DEFAULT_DISCIPLINES.find((d) => d.id === id)!).filter(Boolean);

  const t0 = performance.now();
  const doc = await generateProtocol(computed, disciplines, 'group');
  const t1 = performance.now();
  console.log(`групп. режим: участников=${count} дисциплин=${discs} генерация=${(t1 - t0).toFixed(0)}мс страниц=${doc.getNumberOfPages()}`);

  const t2 = performance.now();
  const bytes = doc.output('arraybuffer');
  const t3 = performance.now();
  console.log(`  output(arraybuffer)=${(t3 - t2).toFixed(0)}мс размер=${(bytes.byteLength / 1024).toFixed(0)}КБ`);

  const t4 = performance.now();
  downloadProtocol(doc, protocolFilename(computed.title, computed.date));
  const t5 = performance.now();
  console.log(`  doc.save()=${(t5 - t4).toFixed(0)}мс`);
}

await measure(5, 8);
await measure(50, 8);
await measure(200, 20);
