export type MetricUnit = 'seconds' | 'minutes_seconds' | 'count' | 'meters' | 'centimeters';

export type EvaluationDirection = 'lower_is_better' | 'higher_is_better';

export type DisciplineCategory = 'speed' | 'strength' | 'endurance' | 'flexibility' | 'agility';

export interface Discipline {
  id: string;
  name: string;
  shortName: string;
  category: DisciplineCategory;
  unit: MetricUnit;
  direction: EvaluationDirection;
}

export interface ScoreThreshold {
  value: number;
  points: number;
}

export type Gender = 'male' | 'female';

export type GtoStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;

export type BadgeType = 'none' | 'bronze' | 'silver' | 'gold';

export interface DisciplineNorm {
  disciplineId: string;
  stage: GtoStage;
  gender: Gender;
  thresholds: ScoreThreshold[];
  bronzeMinPoints?: number;
  silverMinPoints?: number;
  goldMinPoints?: number;
}

export interface Participant {
  id: string;
  bibNumber?: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  gender: Gender;
  stage: GtoStage;
  age?: number;
  team?: string;
  results: Record<string, number | null>;
  scores: Record<string, number>;
  totalScore: number;
  rank?: number;
  awardedBadge?: BadgeType;
}

export interface CompetitionEvent {
  id: string;
  title: string;
  date: string;
  /** Дата окончания для многодневных мероприятий (необязательно) */
  endDate?: string;
  location?: string;
  chiefJudge?: string;
  chiefSecretary?: string;
  selectedDisciplines: string[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
