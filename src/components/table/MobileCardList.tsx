import { Copy, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { useCompetitionStore } from '../../store/useCompetitionStore';
import { findNorm } from '../../store/useNormsStore';
import type { Discipline, DisciplineNorm, Participant } from '../../types/competition';
import { formatFullName, formatStage, GENDER_LABELS, stageAgeRange } from '../../utils/formatters';
import { AwardBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import styles from './MobileCardList.module.css';
import { type ParticipantDraft, ParticipantMetaFields } from './ParticipantMetaFields';
import { ResultInput } from './ResultInput';

interface MobileCardListProps {
  participants: Participant[];
  disciplines: Discipline[];
  norms: readonly DisciplineNorm[];
  onAddClick: () => void;
}

export function MobileCardList({ participants, disciplines, norms, onAddClick }: MobileCardListProps) {
  const setResult = useCompetitionStore((s) => s.setResult);
  const updateParticipant = useCompetitionStore((s) => s.updateParticipant);
  const duplicateParticipant = useCompetitionStore((s) => s.duplicateParticipant);
  const removeParticipant = useCompetitionStore((s) => s.removeParticipant);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = participants.find((p) => p.id === editingId) ?? null;

  const handleMetaPatch = (patch: Partial<ParticipantDraft>) => {
    if (editing) {
      updateParticipant(editing.id, patch);
    }
  };

  if (participants.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="У вас пока нет участников"
        description="Нажмите «Добавить участника», чтобы внести участника и его результаты."
        action={<Button onClick={onAddClick}>Добавить участника</Button>}
      />
    );
  }

  return (
    <div className={styles.list}>
      {participants.map((participant, index) => (
        <article key={participant.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.place}>
              <strong>{participant.rank ?? index + 1}</strong>
              <small>место</small>
            </span>
            <div className={styles.cardTitle}>
              <h3 className={styles.name}>{formatFullName(participant)}</h3>
              <p className={styles.meta}>
                {participant.bibNumber ? <span>№ {participant.bibNumber}</span> : null}
                <span>{GENDER_LABELS[participant.gender]}</span>
                <span>Ступень {formatStage(participant.stage)}</span>
                {participant.age != null ? <span>{participant.age} лет</span> : null}
                {participant.team ? <span>{participant.team}</span> : null}
              </p>
            </div>
            <div className={styles.cardScore}>
              <strong>{participant.totalScore}</strong>
              <small>баллов</small>
            </div>
          </div>
          <div className={styles.cardFooter}>
            <AwardBadge badge={participant.awardedBadge ?? 'none'} />
            <div className={styles.cardActions}>
              <Button size="sm" onClick={() => setEditingId(participant.id)}>
                Результаты
              </Button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => duplicateParticipant(participant.id)}
                title="Дублировать"
                aria-label="Дублировать"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.danger}`}
                onClick={() => removeParticipant(participant.id)}
                title="Удалить"
                aria-label="Удалить"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </article>
      ))}

      {editing ? (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <h3>{formatFullName(editing)}</h3>
            <span className={styles.drawerHint}>{stageAgeRange(editing.stage)}</span>
            <button type="button" className={styles.closeBtn} onClick={() => setEditingId(null)}>
              ✕
            </button>
          </div>
          <div className={styles.drawerBody}>
            <ParticipantMetaFields value={editing} onChange={handleMetaPatch} genderDisabled />
            <div className={styles.results}>
              <h4 className={styles.resultsTitle}>Результаты испытаний</h4>
              {disciplines.map((discipline) => {
                const norm = findNorm(norms, discipline.id, editing.stage, editing.gender);
                return (
                  <div key={discipline.id} className={styles.resultRow}>
                    <span className={styles.resultName}>{discipline.shortName}</span>
                    <ResultInput
                      participantId={editing.id}
                      disciplineId={discipline.id}
                      discipline={discipline}
                      value={editing.results[discipline.id]}
                      points={editing.scores[discipline.id] ?? 0}
                      normPoints={
                        norm
                          ? {
                              bronze: norm.bronzeMinPoints ?? 0,
                              silver: norm.silverMinPoints ?? 0,
                              gold: norm.goldMinPoints ?? 0,
                            }
                          : undefined
                      }
                      registerInput={() => {}}
                      onNavigate={() => {}}
                      onChange={(participantId, disciplineId, value) =>
                        setResult(participantId, disciplineId, value)
                      }
                    />
                  </div>
                );
              })}
              {disciplines.length === 0 ? (
                <p className={styles.noDisciplines}>
                  В соревновании не выбрано ни одной дисциплины. Добавьте их на вкладке «Соревнование».
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
