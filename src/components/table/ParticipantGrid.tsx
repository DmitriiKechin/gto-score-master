import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useRef } from 'react';
import { findNorm } from '../../store/useNormsStore';
import type { Discipline, DisciplineNorm, Participant } from '../../types/competition';
import { formatStage, GENDER_SHORT_LABELS, shortFullName, UNIT_LABELS } from '../../utils/formatters';
import { AwardBadge } from '../common/Badge';
import styles from './ParticipantGrid.module.css';
import { ResultInput } from './ResultInput';

interface ParticipantGridProps {
  participants: Participant[];
  disciplines: Discipline[];
  norms: readonly DisciplineNorm[];
  onSetResult: (participantId: string, disciplineId: string, value: number | null) => void;
  onDuplicate: (participantId: string) => void;
  onRemove: (participantId: string) => void;
  onEdit: (participantId: string) => void;
}

type NormPointsMap = Record<string, { bronze: number; silver: number; gold: number } | null>;

export function ParticipantGrid({
  participants,
  disciplines,
  norms,
  onSetResult,
  onDuplicate,
  onRemove,
  onEdit,
}: ParticipantGridProps) {
  const cellRefs = useRef(new Map<string, HTMLInputElement | null>());

  const participantNormPoints = useMemo(() => {
    const map = new Map<string, NormPointsMap>();
    for (const participant of participants) {
      const perDisc: NormPointsMap = {};
      for (const discipline of disciplines) {
        const norm = findNorm(norms, discipline.id, participant.stage, participant.gender);
        perDisc[discipline.id] = norm
          ? {
              bronze: norm.bronzeMinPoints ?? 0,
              silver: norm.silverMinPoints ?? 0,
              gold: norm.goldMinPoints ?? 0,
            }
          : null;
      }
      map.set(participant.id, perDisc);
    }
    return map;
  }, [participants, disciplines, norms]);

  const registerInput = useCallback(
    (participantId: string, disciplineId: string, el: HTMLInputElement | null) => {
      if (el) {
        cellRefs.current.set(`${participantId}|${disciplineId}`, el);
      } else {
        cellRefs.current.delete(`${participantId}|${disciplineId}`);
      }
    },
    [],
  );

  const handleNavigate = useCallback(
    (direction: number, participantId: string, disciplineId: string) => {
      const ids = participants.map((p) => p.id);
      const index = ids.indexOf(participantId);
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= ids.length) {
        return;
      }
      const target = cellRefs.current.get(`${ids[nextIndex]}|${disciplineId}`);
      if (target) {
        target.focus();
        target.select();
      }
    },
    [participants],
  );

  return (
    <div className={`${styles.gridWrap} grid-scroll`}>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th className={`${styles.headCell} ${styles.corner}`}>№</th>
            <th className={`${styles.headCell} ${styles.stickyLeft2}`}>Участник</th>
            {disciplines.map((discipline) => (
              <th key={discipline.id} className={styles.headCell}>
                <span className={styles.headName}>{discipline.shortName}</span>
                <span className={styles.headUnit}>{UNIT_LABELS[discipline.unit]}</span>
              </th>
            ))}
            <th className={`${styles.headCell} ${styles.stickyRight}`}>Сумма</th>
            <th className={`${styles.headCell} ${styles.stickyRight2}`}>Место</th>
            <th className={`${styles.headCell} ${styles.stickyRight3}`}>Знак</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, index) => {
            const normPoints = participantNormPoints.get(participant.id) ?? {};
            return (
              <tr key={participant.id} className={index % 2 === 1 ? styles.alt : ''}>
                <td className={`${styles.cell} ${styles.corner}`}>
                  <div className={styles.rowActions}>
                    <span className={styles.bib}>{participant.bibNumber || index + 1}</span>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onDuplicate(participant.id)}
                      title="Дублировать участника"
                      aria-label="Дублировать"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onRemove(participant.id)}
                      title="Удалить участника"
                      aria-label="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
                <td className={`${styles.cell} ${styles.stickyLeft2}`}>
                  <button type="button" className={styles.person} onClick={() => onEdit(participant.id)}>
                    <span className={styles.personName}>{shortFullName(participant)}</span>
                    <span className={styles.personMeta}>
                      <span className={styles.genderTag}>{GENDER_SHORT_LABELS[participant.gender]}</span>
                      <span>Ступень {formatStage(participant.stage)}</span>
                      {participant.age != null ? <span>· {participant.age} лет</span> : null}
                      {participant.team ? <span>· {participant.team}</span> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => onEdit(participant.id)}
                    title="Редактировать данные участника"
                    aria-label="Редактировать"
                  >
                    <Pencil size={13} />
                  </button>
                </td>
                {disciplines.map((discipline) => (
                  <td key={discipline.id} className={styles.cell}>
                    <ResultInput
                      participantId={participant.id}
                      disciplineId={discipline.id}
                      discipline={discipline}
                      value={participant.results[discipline.id]}
                      points={participant.scores[discipline.id] ?? 0}
                      normPoints={normPoints[discipline.id] ?? undefined}
                      registerInput={registerInput}
                      onNavigate={handleNavigate}
                      onChange={onSetResult}
                    />
                  </td>
                ))}
                <td className={`${styles.cell} ${styles.total} ${styles.stickyRight}`}>
                  {participant.totalScore}
                </td>
                <td className={`${styles.cell} ${styles.stickyRight2} ${styles.place}`}>
                  {participant.rank ?? '—'}
                </td>
                <td className={`${styles.cell} ${styles.stickyRight3}`}>
                  <AwardBadge badge={participant.awardedBadge ?? 'none'} short />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
