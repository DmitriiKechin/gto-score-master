import { DEFAULT_NORMS } from '../src/data/defaultNorms';
import { DISCIPLINE_BY_ID } from '../src/data/defaultDisciplines';
import { scoreForThresholds, recomputeParticipant, rankParticipants, badgeFromTotalScore } from '../src/utils/scoreCalculator';
import type { Gender, Participant } from '../src/types/competition';

let failures = 0;
function check(name: string, condition: boolean, extra?: unknown) {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}`, extra ?? '');
  }
}

console.log(`Норм генерируется: ${DEFAULT_NORMS.length}`);
check('официальный объём таблиц (410)', DEFAULT_NORMS.length === 410, DEFAULT_NORMS.length);

const goldExtremes = DEFAULT_NORMS.filter((n) => {
  const p = n.thresholds.map((t) => t.points);
  return Math.min(...p) !== 1 || Math.max(...p) !== 100;
});
check('каждая шкала содержит 1 и 100 баллов', goldExtremes.length === 0, goldExtremes.length);

const has = (disciplineId: string, stage: number, gender: Gender) =>
  DEFAULT_NORMS.some((n) => n.disciplineId === disciplineId && n.stage === stage && n.gender === gender);

check('бег 30 м: I ступень мужчины есть', has('run_30', 1, 'male'));
check('бег 30 м: I ступень женщины есть', has('run_30', 1, 'female'));
check('бег 30 м: VII ступень не предусмотрен', !has('run_30', 7, 'male'));
check('бег 100 м: отсутствует на I ступени', !has('run_100', 1, 'male'));
check('бег 3000 м: только мужчины', has('run_3000', 8, 'male') && !has('run_3000', 8, 'female'));
check('плавание 50 м: отсутствует на I ступени', !has('swim_50', 1, 'male'));
check('силовые испытания: есть на XVIII ступени', has('pullups', 18, 'male') && has('pushups', 18, 'female'));

const monotonic = DEFAULT_NORMS.filter((n) => {
  const disc = DISCIPLINE_BY_ID.get(n.disciplineId);
  if (!disc) {
    return true;
  }
  const sorted = [...n.thresholds].sort((a, b) => a.value - b.value);
  for (let i = 1; i < sorted.length; i++) {
    if (disc.direction === 'higher_is_better' && sorted[i].points < sorted[i - 1].points) {
      return true;
    }
    if (disc.direction === 'lower_is_better' && sorted[i].points > sorted[i - 1].points) {
      return true;
    }
  }
  return false;
});
check('шкалы монотонны по направлению', monotonic.length === 0, monotonic.length);

const pullups = DEFAULT_NORMS.find((n) => n.disciplineId === 'pullups' && n.stage === 5 && n.gender === 'male');
if (pullups) {
  check('подтягивания 13 раз -> 100', scoreForThresholds(pullups.thresholds, 'higher_is_better', 13) === 100);
  check('подтягивания 0 раз -> 0', scoreForThresholds(pullups.thresholds, 'higher_is_better', 0) === 0);
  check('подтягивания 6 раз -> 51', scoreForThresholds(pullups.thresholds, 'higher_is_better', 6) === 51);
}

const run30 = DEFAULT_NORMS.find((n) => n.disciplineId === 'run_30' && n.stage === 5 && n.gender === 'male');
if (run30) {
  check('бег 30 м 4.4 с -> 100', scoreForThresholds(run30.thresholds, 'lower_is_better', 4.4) === 100);
  check('бег 30 м очень медленно -> 0', scoreForThresholds(run30.thresholds, 'lower_is_better', 99) === 0);
  check('бег 30 м 5.4 с в середине >0 <100', (() => {
    const s = scoreForThresholds(run30.thresholds, 'lower_is_better', 5.4);
    return s > 0 && s < 100;
  })());
}

const bend = DEFAULT_NORMS.find((n) => n.disciplineId === 'forward_bend' && n.stage === 8 && n.gender === 'female');
if (bend) {
  check('женщины наклон +16 см -> 100', scoreForThresholds(bend.thresholds, 'higher_is_better', 16) === 100);
  check('женщины наклон 0 см -> 0', scoreForThresholds(bend.thresholds, 'higher_is_better', 0) === 0);
}

const base: Pick<Participant, 'id' | 'lastName' | 'firstName' | 'gender' | 'stage' | 'results' | 'scores' | 'totalScore'> = {
  id: 'p1',
  lastName: 'Тестов',
  firstName: 'Тест',
  gender: 'male',
  stage: 5,
  results: { run_30: 4.9, pullups: 10, forward_bend: 5, long_jump: 200 },
  scores: {},
  totalScore: 0,
};
const selected = ['run_30', 'pullups', 'forward_bend', 'long_jump'];
const recomputed: Participant & { missingNorms: string[] } = recomputeParticipant(
  { ...base, results: { ...base.results }, scores: {}, totalScore: 0, awardedBadge: 'none', rank: undefined },
  selected,
  DEFAULT_NORMS,
  DISCIPLINE_BY_ID,
) as Participant & { missingNorms: string[] };
console.log('  Пример расчёта:', { scoreRun30: recomputed.scores.run_30, scorePullups: recomputed.scores.pullups, total: recomputed.totalScore, badge: recomputed.awardedBadge });
check('сумма = сумме баллов', recomputed.totalScore === Object.values(recomputed.scores).reduce((a, b) => a + b, 0));
check('нет отсутствующих нормативов', recomputed.missingNorms.length === 0);

const strippedNorms = DEFAULT_NORMS.filter(
  (n) => !(n.disciplineId === 'long_jump' && n.stage === 1 && n.gender === 'male'),
);
const absent = recomputeParticipant(
  { ...base, id: 'p2', stage: 1, results: { long_jump: 120 }, scores: {}, totalScore: 0, awardedBadge: 'none', rank: undefined },
  ['long_jump', 'run_30'],
  strippedNorms,
  DISCIPLINE_BY_ID,
) as Participant & { missingNorms: string[] };
check('отсутствующий норматив помечается значком', absent.missingNorms.includes('long_jump'));

const ranked = rankParticipants([
  { ...recomputed, id: 'a', totalScore: 700, rank: undefined },
  { ...recomputed, id: 'b', totalScore: 500, rank: undefined },
  { ...recomputed, id: 'c', totalScore: 500, rank: undefined },
  { ...recomputed, id: 'd', totalScore: 500, rank: undefined },
  { ...recomputed, id: 'e', totalScore: 250, rank: undefined },
]);
check('ранжирование 1224', JSON.stringify(ranked.map((r) => r.rank)) === JSON.stringify([1, 2, 2, 2, 5]), ranked.map((r) => [r.id, r.rank]));
check('знак: 700 за 4 дисциплины по 100/разные', badgeFromTotalScore(700, { bronze: 50, silver: 75, gold: 90 }) === 'gold');

process.exit(failures === 0 ? 0 : 1);
