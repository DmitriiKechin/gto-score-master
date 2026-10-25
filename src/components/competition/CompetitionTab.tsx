import { AlertTriangle, Download, FileDown, FileUp, FolderPlus, Trash2, Trophy } from 'lucide-react';
import { useRef } from 'react';
import { DEFAULT_DISCIPLINES } from '../../data/defaultDisciplines';
import { useCompetitionStore, useComputedEventData } from '../../store/useCompetitionStore';
import { exportCompetitionJson, exportParticipantsCsv, importCompetitionFile } from '../../utils/fileIo';
import { formatDateRange, todayISO } from '../../utils/formatters';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { Input } from '../common/Input';
import { notifyError, notifyInfo, notifySuccess } from '../common/Toast';
import styles from './CompetitionTab.module.css';

interface CompetitionTabProps {
  onGoToParticipants: () => void;
}

export function CompetitionTab({ onGoToParticipants }: CompetitionTabProps) {
  const event = useCompetitionStore((s) => s.event);
  const updateEvent = useCompetitionStore((s) => s.updateEvent);
  const setSelectedDisciplines = useCompetitionStore((s) => s.setSelectedDisciplines);
  const createNewEvent = useCompetitionStore((s) => s.createNewEvent);
  const clearEvent = useCompetitionStore((s) => s.clearEvent);
  const loadEvent = useCompetitionStore((s) => s.loadEvent);
  const computed = useComputedEventData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDiscipline = (id: string) => {
    if (!event) {
      return;
    }
    const next = event.selectedDisciplines.includes(id)
      ? event.selectedDisciplines.filter((d) => d !== id)
      : [...event.selectedDisciplines, id];
    setSelectedDisciplines(next);
  };

  const toggleAll = (checked: boolean) => {
    setSelectedDisciplines(checked ? DEFAULT_DISCIPLINES.map((d) => d.id) : []);
  };

  const handleExport = () => {
    if (!computed) {
      return;
    }
    exportCompetitionJson(computed);
    notifySuccess('Проект сохранён на устройство');
  };

  const handleCsv = () => {
    if (!computed) {
      return;
    }
    exportParticipantsCsv(computed, DEFAULT_DISCIPLINES);
    notifySuccess('CSV-файл выгружен');
  };

  const handleImportFile = async (file: File) => {
    if (!file) {
      return;
    }
    const participantCount = event?.participants.length ?? 0;
    const dirty = participantCount > 0;
    if (dirty && !window.confirm('Загружаемый проект заменит текущие данные соревнования. Продолжить?')) {
      return;
    }
    try {
      const imported = await importCompetitionFile(file);
      loadEvent(imported);
      notifySuccess(`Проект «${imported.title}» загружен`);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Ошибка импорта');
    }
  };

  const handleNewEvent = () => {
    const participantCount = event?.participants.length ?? 0;
    if (
      participantCount > 0 &&
      !window.confirm('Создать новое соревнование? Текущий протокол будет очищен.')
    ) {
      return;
    }
    createNewEvent();
    notifyInfo('Новое соревнование создано');
  };

  if (!event) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={Trophy}
          title="У вас пока нет ни одного соревнования"
          description="Создайте новое мероприятие и начните заполнять протокол: планируйте дисциплины, добавляйте участников и считайте баллы по нормативам ВФСК ГТО."
          action={
            <div className={styles.emptyActions}>
              <Button onClick={handleNewEvent} icon={<FolderPlus size={18} />}>
                Создать соревнование
              </Button>
              <Button
                variant="secondary"
                icon={<FileUp size={18} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Загрузить проект
              </Button>
            </div>
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImportFile(file);
            }
            e.target.value = '';
          }}
        />
      </div>
    );
  }

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
            handleImportFile(file);
          }
          e.target.value = '';
        }}
      />

      <section className={`${styles.section} ${styles.metaSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Параметры соревнования</h2>
          <span className={styles.autoSave}>Автосохранение включено</span>
        </div>
        <div className={styles.metaGrid}>
          <Input
            label="Название мероприятия"
            value={event.title}
            onChange={(e) => updateEvent({ title: e.target.value })}
            placeholder="Например, Фестиваль ГТО среди школьников"
          />
          <Input
            label="Дата начала"
            type="date"
            value={event.date}
            max={undefined}
            onChange={(e) => updateEvent({ date: e.target.value || todayISO() })}
          />
          <Input
            label="Дата окончания (если несколько дней)"
            type="date"
            value={event.endDate ?? ''}
            min={event.date}
            max={undefined}
            onChange={(e) => updateEvent({ endDate: e.target.value || undefined })}
          />
          <Input
            label="Место проведения"
            value={event.location ?? ''}
            onChange={(e) => updateEvent({ location: e.target.value })}
            placeholder="Населённый пункт, спорткомплекс"
          />
          <Input
            label="Главный судья"
            value={event.chiefJudge ?? ''}
            onChange={(e) => updateEvent({ chiefJudge: e.target.value })}
            placeholder="Фамилия И.О."
          />
          <Input
            label="Главный секретарь"
            value={event.chiefSecretary ?? ''}
            onChange={(e) => updateEvent({ chiefSecretary: e.target.value })}
            placeholder="Фамилия И.О."
          />
        </div>
        <p className={styles.eventMeta}>
          Участников: <strong>{event.participants.length}</strong> · Дата:{' '}
          <strong>{formatDateRange(event.date, event.endDate)}</strong> · Дисциплин в многоборье:{' '}
          <strong>{event.selectedDisciplines.length}</strong>
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Дисциплины многоборья</h2>
          <div className={styles.disciplineHeaderActions}>
            <Button size="sm" variant="ghost" onClick={() => toggleAll(true)}>
              Выбрать все
            </Button>
            <Button size="sm" variant="ghost" onClick={() => toggleAll(false)}>
              Очистить
            </Button>
          </div>
        </div>
        <div className={styles.disciplineGrid}>
          {DEFAULT_DISCIPLINES.map((discipline) => {
            const checked = event.selectedDisciplines.includes(discipline.id);
            return (
              <label
                key={discipline.id}
                className={`${styles.disciplineItem} ${checked ? styles.disciplineChecked : ''}`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleDiscipline(discipline.id)} />
                <span className={styles.disciplineName}>{discipline.shortName}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Файлы проекта</h2>
        </div>
        <div className={styles.toolbar}>
          <Button icon={<Download size={18} />} onClick={handleExport}>
            Сохранить проект на устройство
          </Button>
          <Button
            variant="secondary"
            icon={<FileUp size={18} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Загрузить проект с устройства
          </Button>
          <Button variant="secondary" icon={<FileDown size={18} />} onClick={handleCsv}>
            Экспорт в CSV
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={18} />}
            onClick={() => {
              if (window.confirm('Удалить текущий протокол соревнования? Это действие нельзя отменить.')) {
                clearEvent();
                notifyInfo('Протокол очищен');
              }
            }}
          >
            Очистить
          </Button>
        </div>
        <p className={styles.hint}>
          Состояние приложения хранится в браузере и автоматически восстанавливается после перезагрузки
          страницы. Файлы <code>.gto.json</code> можно переносить между устройствами.
        </p>
        {event.participants.length === 0 ? (
          <div className={styles.notice}>
            <AlertTriangle size={18} />
            <span>
              У вас пока нет участников. Перейдите на вкладку «Участники» и нажмите «Добавить участника».
            </span>
          </div>
        ) : (
          <Button variant="ghost" onClick={onGoToParticipants}>
            Перейти к заполнению результатов →
          </Button>
        )}
      </section>
    </div>
  );
}
