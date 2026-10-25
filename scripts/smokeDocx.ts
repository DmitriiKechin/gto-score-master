import { generateProtocolDocxBlob } from '../src/utils/docxGenerator';
import { DEFAULT_DISCIPLINES } from '../src/data/defaultDisciplines';
import type { CompetitionEvent } from '../src/types/competition';
import { writeFileSync } from 'node:fs';

const event: CompetitionEvent = {
  id: 'e1',
  title: 'Фестиваль ГТО среди школьников',
  date: '2026-10-24',
  location: 'Москва',
  selectedDisciplines: ['run_30', 'shuttle_3x10', 'pullups', 'forward_bend'],
  participants: [
    {
      id: 'p1',
      lastName: 'Иванов', firstName: 'Иван', middleName: 'Иванович', gender: 'male', stage: 5,
      results: { run_30: 4.9, pullups: 10, forward_bend: 3 },
      scores: { run_30: 80, pullups: 90, forward_bend: 55 }, totalScore: 225, rank: 1, awardedBadge: 'silver',
    },
  ],
};
const disciplines = event.selectedDisciplines
  .map((id) => DEFAULT_DISCIPLINES.find((d) => d.id === id))
  .filter((d): d is NonNullable<typeof d> => Boolean(d));
const blob = await generateProtocolDocxBlob(event, disciplines, 'group');
writeFileSync('/tmp/smoke.docx', Buffer.from(await blob.arrayBuffer()));
console.log('wrote /tmp/smoke.docx', blob.size);
