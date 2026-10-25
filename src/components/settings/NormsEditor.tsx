import { Download, Info, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_DISCIPLINES, getDiscipline } from '../../data/defaultDisciplines';
import { useCustomizedNorms, useNormsStore } from '../../store/useNormsStore';
import type { DisciplineNorm, Gender, GtoStage, ScoreThreshold } from '../../types/competition';
import { exportNormsJson, importNormsFile } from '../../utils/fileIo';
import {
  ALL_STAGES,
  formatCompactResult,
  formatStage,
  GENDER_LABELS,
  parseResultText,
  stageAgeRange,
} from '../../utils/formatters';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { useToastStore } from '../common/Toast';
import styles from './NormsEditor.module.css';

type StageFilter = GtoStage | 0;

export function NormsEditor() {
  const { norms, customized } = useCustomizedNorms();
  const overrides = useNormsStore((s) => s.overrides);
  const setNorm = useNormsStore((s) => s.setNorm);
  const resetToDefault = useNormsStore((s) => s.resetToDefault);
  const resetOne = useNormsStore((s) => s.resetOne);
  const importNorms = useNormsStore((s) => s.importNorms);
  const pushToast = useToastStore((s) => s.push);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stageFilter, setStageFilter] = useState<StageFilter>(1);
  const [genderFilter, setGenderFilter] = useState<Gender>('male');
  const [disciplineId, setDisciplineId] = useState(DEFAULT_DISCIPLINES[0]?.id ?? '');

  const discipline = getDiscipline(disciplineId);
  const norm = useMemo(
    () =>
      norms.find(
        (n) =>
          n.disciplineId === disciplineId &&
          n.stage === (stageFilter as GtoStage) &&
          n.gender === genderFilter,
      ),
    [norms, disciplineId, stageFilter, genderFilter],
  );

  const [draft, setDraft] = useState<DisciplineNorm | null>(null);
  useEffect(() => {
    setDraft(norm ? { ...norm, thresholds: norm.thresholds.map((t) => ({ ...t })) } : null);
  }, [norm]);

  if (!discipline) {
    return null;
  }

  const applied = Boolean(overrides[normKeyOf(disciplineId, stageFilter as GtoStage, genderFilter)]);
  const dirty =
    draft && (!areThresholdsEqual(draft.thresholds, norm?.thresholds ?? []) || badgeChanged(draft, norm));

  const updateThreshold = (index: number, field: 'value' | 'points', text: string) => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const next = [...prev.thresholds];
      if (field === 'value') {
        const parsed = parseResultText(text, discipline.unit);
        if (parsed != null) {
          next[index] = { ...next[index], value: parsed };
        }
      } else {
        const parsed = Number(text.replace(',', '.'));
        if (Number.isFinite(parsed)) {
          next[index] = { ...next[index], points: parsed };
        }
      }
      return { ...prev, thresholds: next };
    });
  };

  const handleSave = () => {
    if (!draft) {
      return;
    }
    const cleaned: DisciplineNorm = {
      ...draft,
      thresholds: draft.thresholds
        .filter((t) => Number.isFinite(t.value) && Number.isFinite(t.points))
        .sort((a, b) => a.value - b.value),
    };
    setNorm(cleaned);
    pushToast('success', 'Норматив сохранён');
  };

  const handleAddThreshold = () => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const maxValue = prev.thresholds.reduce((m, t) => Math.max(m, t.value), 0);
      const avg = prev.thresholds.length > 1 ? prev.thresholds[1].value - prev.thresholds[0].value : 0;
      const step = avg > 0 ? Math.abs(avg) : 1;
      const value = maxValue + step;
      return {
        ...prev,
        thresholds: [...prev.thresholds, { value: Math.round(value * 100) / 100, points: 50 }],
      };
    });
  };

  const handleDeleteThreshold = (index: number) => {
    setDraft((prev) =>
      prev ? { ...prev, thresholds: prev.thresholds.filter((_, i) => i !== index) } : prev,
    );
  };

  const handleBadgeChange = (
    field: 'bronzeMinPoints' | 'silverMinPoints' | 'goldMinPoints',
    text: string,
  ) => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const num = text.trim() === '' ? undefined : Number(text.replace(',', '.'));
      return { ...prev, [field]: Number.isFinite(num ?? NaN) && num != null ? num : undefined };
    });
  };

  const handleImportFile = async (file: File) => {
    if (!file) {
      return;
    }
    try {
      const imported = await importNormsFile(file);
      importNorms(imported);
      pushToast('success', `Загружено нормативов: ${imported.length}`);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Ошибка импорта нормативов');
    }
  };

  return (
    <div className={styles.page}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleImportFile(file);
          }
          e.target.value = '';
        }}
      />

      <section className={styles.section}>
        <div className={styles.filtersWrap}>
          <Select
            label="Ступень"
            value={stageFilter}
            options={[
              ...ALL_STAGES.map((stage: GtoStage) => ({
                value: stage as number,
                label: `${formatStage(stage)} · ${stageAgeRange(stage)}`,
              })),
            ]}
            onChangeValue={(value) => setStageFilter(value as StageFilter)}
          />
          <Select
            label="Пол"
            value={genderFilter}
            options={[
              { value: 'male' as const, label: GENDER_LABELS.male },
              { value: 'female' as const, label: GENDER_LABELS.female },
            ]}
            onChangeValue={setGenderFilter}
          />
          <Select
            label="Испытание"
            value={disciplineId}
            options={DEFAULT_DISCIPLINES.map((d) => ({ value: d.id, label: d.shortName }))}
            onChangeValue={setDisciplineId}
          />
        </div>
        <p className={styles.infoLine}>
          <Info size={14} />
          <span>
            Направление оценки:{' '}
            <strong>
              {discipline.direction === 'higher_is_better' ? 'больше — лучше' : 'меньше — лучше'}
            </strong>
            . Единица измерения:{' '}
            <strong>{discipline.unit === 'minutes_seconds' ? 'мин:сек' : discipline.unit}</strong>.
          </span>
        </p>
      </section>

      {!norm || !draft ? (
        <section className={styles.section}>
          <div className={styles.missingBox}>
            <Info size={20} className={styles.missingIcon} />
            <div>
              <p className={styles.missingTitle}>
                По испытанию «{discipline.shortName}» для ступени {formatStage(stageFilter as GtoStage)} (
                {stageAgeRange(stageFilter as GtoStage)}), {GENDER_LABELS[genderFilter].toLowerCase()},
                официальные нормативы ВФСК ГТО не предусмотрены
              </p>
              <p className={styles.missingText}>
                Испытание не входит в официальный перечень комплекса ГТО для данной возрастной группы, поэтому
                шкала пересчёта баллов для него не задана. Выберите ступень, пол или испытание из официального
                перечня, либо уберите его из дисциплин многоборья на вкладке «Соревнование».
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Таблица пересчёта: «{discipline.shortName}», ступень {formatStage(draft.stage)} ·{' '}
                {GENDER_LABELS[draft.gender].toLowerCase()}
              </h2>
              <span className={`${styles.badgeStatus} ${applied ? styles.badgeModified : ''}`}>
                {applied ? 'Изменён' : 'Официальный'}
              </span>
            </div>
            <div className={styles.badgePointsRow}>
              <label className={styles.badgePoint}>
                <span>Мин. баллов для «Золото»</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.goldMinPoints ?? ''}
                  onChange={(e) => handleBadgeChange('goldMinPoints', e.target.value)}
                />
              </label>
              <label className={styles.badgePoint}>
                <span>Мин. баллов для «Серебро»</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.silverMinPoints ?? ''}
                  onChange={(e) => handleBadgeChange('silverMinPoints', e.target.value)}
                />
              </label>
              <label className={styles.badgePoint}>
                <span>Мин. баллов для «Бронза»</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.bronzeMinPoints ?? ''}
                  onChange={(e) => handleBadgeChange('bronzeMinPoints', e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Шкала «Результат → Баллы»</h2>
              <div className={styles.tableActions}>
                <Button size="sm" variant="secondary" icon={<Plus size={16} />} onClick={handleAddThreshold}>
                  Добавить порог
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RotateCcw size={16} />}
                  onClick={() => {
                    resetOne(disciplineId, draft.stage, draft.gender);
                    setDraft(null);
                    pushToast('info', 'Норматив сброшен к официальному');
                  }}
                >
                  Сбросить к официальному
                </Button>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Результат</th>
                    <th>Баллы</th>
                    <th className={styles.thAction} />
                  </tr>
                </thead>
                <tbody>
                  {draft.thresholds.map((threshold, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: пороги не имеют стабильного id
                    <tr key={`${threshold.value}-${index}`}>
                      <td>
                        <input
                          className={styles.cellInput}
                          value={formatCompactResult(threshold.value, discipline.unit)}
                          onChange={(e) => updateThreshold(index, 'value', e.target.value)}
                          placeholder={discipline.unit}
                          inputMode="decimal"
                        />
                      </td>
                      <td>
                        <input
                          className={styles.cellInput}
                          value={threshold.points}
                          onChange={(e) => updateThreshold(index, 'points', e.target.value)}
                          inputMode="numeric"
                        />
                      </td>
                      <td className={styles.thAction}>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteThreshold(index)}
                          title="Удалить порог"
                          aria-label="Удалить"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dirty ? (
              <div className={styles.saveBar}>
                <span>Есть несохранённые изменения</span>
                <Button size="sm" onClick={handleSave}>
                  Сохранить изменения
                </Button>
              </div>
            ) : null}
          </section>
        </>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Нормативная база проекта</h2>
        </div>
        <div className={styles.toolbar}>
          <Button
            variant="secondary"
            icon={<Download size={18} />}
            onClick={() => {
              exportNormsJson(norms);
              pushToast('success', 'Нормативы экспортированы');
            }}
          >
            Экспорт нормативов
          </Button>
          <Button
            variant="secondary"
            icon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Импорт нормативов
          </Button>
          <Button
            variant="danger"
            icon={<RotateCcw size={18} />}
            onClick={() => {
              if (window.confirm('Сбросить все нормативы к официальным значениям по умолчанию?')) {
                resetToDefault();
                pushToast('info', 'Нормативы сброшены к официальным');
              }
            }}
          >
            Сбросить к официальным
          </Button>
          <span className={styles.customizedInfo}>
            {customized ? 'Есть пользовательские изменения' : 'Используются официальные таблицы'}
          </span>
        </div>
      </section>
    </div>
  );
}

function normKeyOf(disciplineId: string, stage: GtoStage, gender: Gender): string {
  return `${disciplineId}::${stage}::${gender}`;
}

function areThresholdsEqual(a: readonly ScoreThreshold[], b: readonly ScoreThreshold[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((t, i) => Math.abs(t.value - b[i].value) < 1e-9 && Math.abs(t.points - b[i].points) < 1e-9);
}

function badgeChanged(a: DisciplineNorm, b?: DisciplineNorm): boolean {
  if (!b) {
    return false;
  }
  return (
    a.bronzeMinPoints !== b.bronzeMinPoints ||
    a.silverMinPoints !== b.silverMinPoints ||
    a.goldMinPoints !== b.goldMinPoints
  );
}
