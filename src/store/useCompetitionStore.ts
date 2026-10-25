import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_DISCIPLINES, DISCIPLINE_BY_ID } from '../data/defaultDisciplines';
import type { CompetitionEvent, Participant } from '../types/competition';
import { todayISO } from '../utils/formatters';
import { computeEvent } from '../utils/scoreCalculator';
import { sortedNorms, useNormsStore } from './useNormsStore';

const DEFAULT_SELECTED_DISCIPLINES = [
  'run_30',
  'shuttle_3x10',
  'run_1000',
  'pullups',
  'pushups',
  'trunk_raises',
  'forward_bend',
  'long_jump',
];

let counter = 0;
function makeId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter}${rand}`;
}

const SAMPLE_PREFIX = 'sample_';

export interface NewParticipantInput {
  lastName: string;
  firstName: string;
  middleName?: string;
  gender: Participant['gender'];
  stage: Participant['stage'];
  age?: number;
  team?: string;
  bibNumber?: string;
}

export function baseParticipant(input: NewParticipantInput): Participant {
  return {
    id: makeId('p'),
    bibNumber: input.bibNumber?.trim() || '',
    lastName: input.lastName.trim(),
    firstName: input.firstName.trim(),
    middleName: input.middleName?.trim() ? input.middleName.trim() : undefined,
    gender: input.gender,
    stage: input.stage,
    age: input.age,
    team: input.team?.trim() ? input.team.trim() : undefined,
    results: {},
    scores: {},
    totalScore: 0,
    rank: undefined,
    awardedBadge: 'none',
  };
}

const SAMPLE_PARTICIPANTS: NewParticipantInput[] = [
  {
    lastName: 'Иванов',
    firstName: 'Иван',
    middleName: 'Иванович',
    gender: 'male',
    stage: 5,
    age: 14,
    team: 'СОШ №1',
    bibNumber: '1',
  },
  {
    lastName: 'Петрова',
    firstName: 'Анна',
    middleName: 'Сергеевна',
    gender: 'female',
    stage: 5,
    age: 15,
    team: 'СОШ №1',
    bibNumber: '2',
  },
  {
    lastName: 'Сидоров',
    firstName: 'Пётр',
    gender: 'male',
    stage: 4,
    age: 13,
    team: 'СОШ №2',
    bibNumber: '3',
  },
  {
    lastName: 'Кузнецова',
    firstName: 'Мария',
    gender: 'female',
    stage: 4,
    age: 12,
    team: 'СОШ №2',
    bibNumber: '4',
  },
  {
    lastName: 'Смирнов',
    firstName: 'Алексей',
    middleName: 'Дмитриевич',
    gender: 'male',
    stage: 6,
    age: 16,
    team: 'Лицей №7',
    bibNumber: '5',
  },
];

export function createEventSeed(): CompetitionEvent {
  const now = new Date().toISOString();
  return {
    id: makeId('ev'),
    title: 'Фестиваль ГТО',
    date: todayISO(),
    location: '',
    chiefJudge: '',
    chiefSecretary: '',
    selectedDisciplines: [...DEFAULT_SELECTED_DISCIPLINES],
    participants: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface CompetitionState {
  event: CompetitionEvent | null;
  createNewEvent(): void;
  updateEvent(partial: Partial<Omit<CompetitionEvent, 'participants' | 'id'>>): void;
  setSelectedDisciplines(ids: string[]): void;
  addParticipant(participant: Participant): void;
  removeParticipant(id: string): void;
  duplicateParticipant(id: string): void;
  updateParticipant(id: string, patch: Partial<Participant>): void;
  setResult(participantId: string, disciplineId: string, value: number | null): void;
  loadEvent(event: CompetitionEvent): void;
  clearEvent(): void;
  addSampleParticipants(): void;
}

function withUpdatedAt(event: CompetitionEvent): CompetitionEvent {
  return { ...event, updatedAt: new Date().toISOString() };
}

export const useCompetitionStore = create<CompetitionState>()(
  persist(
    (set) => ({
      event: null,
      createNewEvent: () => set({ event: createEventSeed() }),
      updateEvent: (partial) =>
        set((state) => (state.event ? { event: withUpdatedAt({ ...state.event, ...partial }) } : state)),
      setSelectedDisciplines: (ids) =>
        set((state) =>
          state.event ? { event: withUpdatedAt({ ...state.event, selectedDisciplines: ids }) } : state,
        ),
      addParticipant: (participant) =>
        set((state) =>
          state.event
            ? {
                event: withUpdatedAt({
                  ...state.event,
                  participants: [...state.event.participants, participant],
                }),
              }
            : state,
        ),
      removeParticipant: (id) =>
        set((state) =>
          state.event
            ? {
                event: withUpdatedAt({
                  ...state.event,
                  participants: state.event.participants.filter((p) => p.id !== id),
                }),
              }
            : state,
        ),
      duplicateParticipant: (id) =>
        set((state) => {
          if (!state.event) {
            return state;
          }
          const source = state.event.participants.find((p) => p.id === id);
          if (!source) {
            return state;
          }
          const copy: Participant = {
            ...source,
            id: makeId('p'),
            bibNumber: '',
            results: { ...source.results },
            scores: {},
            totalScore: 0,
            rank: undefined,
            awardedBadge: 'none',
          };
          return {
            event: withUpdatedAt({ ...state.event, participants: [...state.event.participants, copy] }),
          };
        }),
      updateParticipant: (id, patch) =>
        set((state) => {
          if (!state.event) {
            return state;
          }
          const participants = state.event.participants.map((p) => (p.id === id ? { ...p, ...patch } : p));
          return { event: withUpdatedAt({ ...state.event, participants }) };
        }),
      setResult: (participantId, disciplineId, value) =>
        set((state) => {
          if (!state.event) {
            return state;
          }
          const participants = state.event.participants.map((p) => {
            if (p.id !== participantId) {
              return p;
            }
            const results = { ...p.results };
            if (value == null) {
              delete results[disciplineId];
            } else {
              results[disciplineId] = value;
            }
            return { ...p, results };
          });
          return { event: withUpdatedAt({ ...state.event, participants }) };
        }),
      loadEvent: (event) =>
        set({
          event: {
            ...event,
            participants: event.participants.map((p) => ({
              ...p,
              results: p.results ?? {},
              scores: p.scores ?? {},
              totalScore: p.totalScore ?? 0,
              awardedBadge: p.awardedBadge ?? 'none',
            })),
            selectedDisciplines: event.selectedDisciplines ?? [],
          },
        }),
      clearEvent: () => set({ event: null }),
      addSampleParticipants: () =>
        set((state) => {
          if (!state.event) {
            return state;
          }
          const participants = state.event.participants.filter((p) => !p.id.startsWith(SAMPLE_PREFIX));
          const samples = SAMPLE_PARTICIPANTS.map((input) => ({
            ...baseParticipant(input),
            id: `${SAMPLE_PREFIX}${makeId('p')}`,
          }));
          return { event: withUpdatedAt({ ...state.event, participants: [...participants, ...samples] }) };
        }),
    }),
    {
      name: 'gto-competition-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ event: state.event }),
    },
  ),
);

/** Вычисленные участники: баллы, суммы, места и знаки — с учётом текущих нормативов. */
export function useComputedParticipants(): Participant[] {
  const event = useCompetitionStore((s) => s.event);
  const overrides = useNormsStore((s) => s.overrides);
  const allNorms = useMemo(() => sortedNorms(overrides), [overrides]);
  return useMemo(() => {
    if (!event) {
      return [];
    }
    const { participants } = computeEvent(event, allNorms, DISCIPLINE_BY_ID);
    return participants;
  }, [event, allNorms]);
}

/** Соревнование с посчитанными участниками (для экспорта и печати). */
export function useComputedEventData(): CompetitionEvent | null {
  const event = useCompetitionStore((s) => s.event);
  const participants = useComputedParticipants();
  return useMemo(() => (event ? { ...event, participants } : null), [event, participants]);
}

export function availableDisciplines() {
  return DEFAULT_DISCIPLINES;
}
