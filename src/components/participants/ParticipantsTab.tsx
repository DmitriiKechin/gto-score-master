import { Plus, Search, Sparkles, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DEFAULT_DISCIPLINES } from '../../data/defaultDisciplines';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useCompetitionStore, useComputedParticipants } from '../../store/useCompetitionStore';
import { useCustomizedNorms } from '../../store/useNormsStore';
import type { Gender, GtoStage } from '../../types/competition';
import { ALL_STAGES, formatStage } from '../../utils/formatters';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { MobileCardList } from '../table/MobileCardList';
import { ParticipantFormModal } from '../table/ParticipantFormModal';
import { ParticipantGrid } from '../table/ParticipantGrid';
import styles from './ParticipantsTab.module.css';

type SortMode = 'rank' | 'totalScore' | 'lastName' | 'bib';

export function ParticipantsTab() {
  const event = useCompetitionStore((s) => s.event);
  const participants = useComputedParticipants();
  const setResult = useCompetitionStore((s) => s.setResult);
  const duplicateParticipant = useCompetitionStore((s) => s.duplicateParticipant);
  const removeParticipant = useCompetitionStore((s) => s.removeParticipant);
  const addSampleParticipants = useCompetitionStore((s) => s.addSampleParticipants);
  const { norms } = useCustomizedNorms();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | Gender>('all');
  const [stageFilter, setStageFilter] = useState<number>(0);
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const selectedDisciplines = useMemo(
    () =>
      (event?.selectedDisciplines ?? [])
        .map((id) => DEFAULT_DISCIPLINES.find((d) => d.id === id))
        .filter((d): d is NonNullable<typeof d> => Boolean(d)),
    [event?.selectedDisciplines],
  );

  const filtered = useMemo(() => {
    let list = participants;
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((p) =>
        `${p.lastName} ${p.firstName} ${p.middleName ?? ''} ${p.team ?? ''}`.toLowerCase().includes(query),
      );
    }
    if (genderFilter !== 'all') {
      list = list.filter((p) => p.gender === genderFilter);
    }
    if (stageFilter !== 0) {
      list = list.filter((p) => p.stage === stageFilter);
    }
    if (sortMode === 'lastName') {
      list = [...list].sort(
        (a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.firstName.localeCompare(b.firstName, 'ru'),
      );
    } else if (sortMode === 'totalScore') {
      list = [...list].sort((a, b) => b.totalScore - a.totalScore);
    } else if (sortMode === 'bib') {
      list = [...list].sort((a, b) => Number(a.bibNumber || Infinity) - Number(b.bibNumber || Infinity));
    }
    return list;
  }, [participants, search, genderFilter, stageFilter, sortMode]);

  const editParticipant = participants.find((p) => p.id === editId) ?? undefined;

  if (!event) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={Users}
          title="Сначала создайте соревнование"
          description="Перейдите на вкладку «Соревнование» и создайте новое мероприятие, чтобы начать вносить участников."
        />
      </div>
    );
  }

  const handleRemove = (id: string) => {
    if (window.confirm('Удалить участника из протокола?')) {
      removeParticipant(id);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Поиск по фамилии, имени, команде…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={genderFilter}
          options={[
            { value: 'all' as const, label: 'Все полы' },
            { value: 'male' as const, label: 'Мужской' },
            { value: 'female' as const, label: 'Женский' },
          ]}
          onChangeValue={setGenderFilter}
        />
        <Select
          value={stageFilter}
          options={[
            { value: 0, label: 'Все ступени' },
            ...ALL_STAGES.map((stage: GtoStage) => ({
              value: stage as number,
              label: `Ступень ${formatStage(stage)}`,
            })),
          ]}
          onChangeValue={setStageFilter}
        />
        <Select
          value={sortMode}
          options={[
            { value: 'rank' as const, label: 'Сортировка: место (по сумме)' },
            { value: 'totalScore' as const, label: 'Сортировка: сумма баллов' },
            { value: 'lastName' as const, label: 'Сортировка: фамилия (алфавит)' },
            { value: 'bib' as const, label: 'Сортировка: нагрудный номер' },
          ]}
          onChangeValue={setSortMode}
        />
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" icon={<Sparkles size={16} />} onClick={addSampleParticipants}>
            Образцы
          </Button>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
            Добавить участника
          </Button>
        </div>
      </div>

      <p className={styles.countInfo}>
        Показано участников: <strong>{filtered.length}</strong> из {participants.length} · Баллы
        пересчитываются автоматически
      </p>

      {isMobile ? (
        <MobileCardList
          participants={filtered}
          disciplines={selectedDisciplines}
          norms={norms}
          onAddClick={() => setAddOpen(true)}
        />
      ) : (
        <ParticipantGrid
          participants={filtered}
          disciplines={selectedDisciplines}
          norms={norms}
          onSetResult={setResult}
          onDuplicate={duplicateParticipant}
          onRemove={handleRemove}
          onEdit={setEditId}
        />
      )}

      {selectedDisciplines.length === 0 && participants.length > 0 ? (
        <p className={styles.notice}>
          В соревновании не выбрано ни одной дисциплины — баллы по всем участникам равны 0. Выберите
          дисциплины на вкладке «Соревнование».
        </p>
      ) : null}

      <ParticipantFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ParticipantFormModal
        open={Boolean(editParticipant)}
        onClose={() => setEditId(null)}
        participant={editParticipant}
        title="Редактирование участника"
      />
    </div>
  );
}
