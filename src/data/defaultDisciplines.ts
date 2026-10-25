import type { Discipline } from '../types/competition';

/**
 * Справочник испытаний ВФСК ГТО, по которым ведётся подсчёт 100-балльной оценки.
 * Каждое испытание имеет направление оценки: для бега/плавания лучше меньшее
 * время (lower_is_better), для прыжков/подтягиваний — большее значение.
 */
export const DEFAULT_DISCIPLINES: Discipline[] = [
  {
    id: 'run_30',
    name: 'Бег на 30 метров',
    shortName: 'Бег 30 м',
    category: 'speed',
    unit: 'seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'run_60',
    name: 'Бег на 60 метров',
    shortName: 'Бег 60 м',
    category: 'speed',
    unit: 'seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'run_100',
    name: 'Бег на 100 метров',
    shortName: 'Бег 100 м',
    category: 'speed',
    unit: 'seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'shuttle_3x10',
    name: 'Челночный бег 3×10 метров',
    shortName: 'Челночный бег 3×10 м',
    category: 'speed',
    unit: 'seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'run_1000',
    name: 'Бег на 1000 метров',
    shortName: 'Бег 1000 м',
    category: 'endurance',
    unit: 'minutes_seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'run_1500',
    name: 'Бег на 1500 метров',
    shortName: 'Бег 1500 м',
    category: 'endurance',
    unit: 'minutes_seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'run_2000',
    name: 'Бег на 2000 метров',
    shortName: 'Бег 2000 м',
    category: 'endurance',
    unit: 'minutes_seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'run_3000',
    name: 'Бег на 3000 метров',
    shortName: 'Бег 3000 м',
    category: 'endurance',
    unit: 'minutes_seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'pullups',
    name: 'Подтягивание из виса на высокой перекладине',
    shortName: 'Подтягивание',
    category: 'strength',
    unit: 'count',
    direction: 'higher_is_better',
  },
  {
    id: 'pushups',
    name: 'Сгибание и разгибание рук в упоре лёжа',
    shortName: 'Отжимания',
    category: 'strength',
    unit: 'count',
    direction: 'higher_is_better',
  },
  {
    id: 'trunk_raises',
    name: 'Поднимание туловища из положения лёжа на спине за 1 минуту',
    shortName: 'Пресс за 1 мин',
    category: 'strength',
    unit: 'count',
    direction: 'higher_is_better',
  },
  {
    id: 'forward_bend',
    name: 'Наклон вперёд из положения стоя на гимнастической скамье',
    shortName: 'Наклон вперёд',
    category: 'flexibility',
    unit: 'centimeters',
    direction: 'higher_is_better',
  },
  {
    id: 'long_jump',
    name: 'Прыжок в длину с места толчком двумя ногами',
    shortName: 'Прыжок в длину',
    category: 'agility',
    unit: 'centimeters',
    direction: 'higher_is_better',
  },
  {
    id: 'swim_50',
    name: 'Плавание на 50 метров',
    shortName: 'Плавание 50 м',
    category: 'endurance',
    unit: 'seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'ski_1km',
    name: 'Бег на лыжах 1 километр',
    shortName: 'Лыжи 1 км',
    category: 'endurance',
    unit: 'minutes_seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'ski_2km',
    name: 'Бег на лыжах 2 километра',
    shortName: 'Лыжи 2 км',
    category: 'endurance',
    unit: 'minutes_seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'ski_3km',
    name: 'Бег на лыжах 3 километра',
    shortName: 'Лыжи 3 км',
    category: 'endurance',
    unit: 'minutes_seconds',
    direction: 'lower_is_better',
  },
  {
    id: 'shooting',
    name: 'Стрельба из пневматической винтовки или электронного оружия',
    shortName: 'Стрельба',
    category: 'agility',
    unit: 'count',
    direction: 'higher_is_better',
  },
  {
    id: 'throwing_ball',
    name: 'Метание мяча весом 150 г',
    shortName: 'Метание мяча',
    category: 'strength',
    unit: 'meters',
    direction: 'higher_is_better',
  },
  {
    id: 'throwing_shell',
    name: 'Метание спортивного снаряда (500 г / 700 г)',
    shortName: 'Метание снаряда',
    category: 'strength',
    unit: 'meters',
    direction: 'higher_is_better',
  },
];

export const DISCIPLINE_BY_ID = new Map(DEFAULT_DISCIPLINES.map((d) => [d.id, d]));

export function getDiscipline(id: string): Discipline | undefined {
  return DISCIPLINE_BY_ID.get(id);
}

export const CATEGORY_LABELS: Record<Discipline['category'], string> = {
  speed: 'Скорость',
  strength: 'Сила',
  endurance: 'Выносливость',
  flexibility: 'Гибкость',
  agility: 'Ловкость',
};
