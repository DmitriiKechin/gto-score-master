import type { jsPDF } from 'jspdf';
import { FileDown, FileText, Loader2, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_DISCIPLINES } from '../../data/defaultDisciplines';
import { useCompetitionStore, useComputedEventData } from '../../store/useCompetitionStore';
import { docxFilename, downloadDocxBlob, generateProtocolDocxBlob } from '../../utils/docxGenerator';
import { exportParticipantsCsv } from '../../utils/fileIo';
import {
  downloadProtocol,
  generateProtocol,
  type ProtocolMode,
  protocolFilename,
  protocolPreviewUrl,
} from '../../utils/pdfGenerator';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { notifyError, notifySuccess } from '../common/Toast';
import styles from './ProtocolScreen.module.css';

export function ProtocolScreen() {
  const event = useCompetitionStore((s) => s.event);
  const computed = useComputedEventData();
  const [mode, setMode] = useState<ProtocolMode>('group');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfDocRef = useRef<jsPDF | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const generate = useCallback(async () => {
    if (!computed) {
      return;
    }
    if (computed.participants.length === 0) {
      setPdfUrl(null);
      pdfDocRef.current = null;
      return;
    }
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setGenerating(true);
    setError(null);
    try {
      const disciplines = computed.selectedDisciplines
        .map((id) => DEFAULT_DISCIPLINES.find((d) => d.id === id))
        .filter((d): d is NonNullable<typeof d> => Boolean(d));
      const doc = await generateProtocol(computed, disciplines, mode);
      pdfDocRef.current = doc;
      const url = protocolPreviewUrl(doc);
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
      }
      lastUrlRef.current = url;
      setPdfUrl(url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Не удалось сформировать протокол');
    } finally {
      busyRef.current = false;
      setGenerating(false);
    }
  }, [computed, mode]);

  useEffect(() => {
    void generate();
    return () => {
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
      }
    };
  }, [generate]);

  const handleDownload = () => {
    if (!pdfDocRef.current || !computed) {
      return;
    }
    downloadProtocol(pdfDocRef.current, protocolFilename(computed.title, computed.date));
    notifySuccess('PDF-протокол загружен');
  };

  const handleDocx = async () => {
    if (!computed) {
      return;
    }
    setDocxLoading(true);
    try {
      const disciplines = computed.selectedDisciplines
        .map((id) => DEFAULT_DISCIPLINES.find((d) => d.id === id))
        .filter((d): d is NonNullable<typeof d> => Boolean(d));
      const blob = await generateProtocolDocxBlob(computed, disciplines, mode);
      downloadDocxBlob(blob, docxFilename(computed.title, computed.date));
      notifySuccess('DOCX-протокол загружен');
    } catch (err) {
      console.error(err);
      notifyError(err instanceof Error ? err.message : 'Не удалось сформировать DOCX-протокол');
    } finally {
      setDocxLoading(false);
    }
  };

  const handleCsv = () => {
    if (!computed) {
      return;
    }
    exportParticipantsCsv(computed, DEFAULT_DISCIPLINES);
    notifySuccess('CSV-файл выгружен');
  };

  if (!event || !computed) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={FileText}
          title="Нет активного соревнования"
          description="Создайте соревнование и добавьте участников, чтобы сформировать итоговый протокол."
        />
      </div>
    );
  }

  if (computed.participants.length === 0 && !generating) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={FileText}
          title="В протоколе нет участников"
          description="Добавьте участников и заполните результаты на вкладке «Участники», после чего протокол будет доступен для печати."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Экспорт официального протокола</h2>
            <p className={styles.sectionHint}>
              Формирование протокола в форматах PDF и DOCX (A4, альбомная ориентация, кириллица, поля для
              подписей судейской коллегии).
            </p>
          </div>
          <div className={styles.controls}>
            <Select
              value={mode}
              options={[
                { value: 'group' as const, label: 'По группам (ступень + пол)' },
                { value: 'summary' as const, label: 'Сводный протокол' },
              ]}
              onChangeValue={setMode}
            />
            <Button variant="secondary" icon={<FileDown size={18} />} onClick={handleCsv}>
              Экспорт в CSV
            </Button>
            <Button
              variant="secondary"
              icon={<FileDown size={18} />}
              loading={docxLoading}
              onClick={() => void handleDocx()}
            >
              Скачать DOCX
            </Button>
            <Button icon={<FileDown size={18} />} onClick={handleDownload} disabled={!pdfUrl || generating}>
              Скачать PDF
            </Button>
          </div>
        </div>
        <p className={styles.summary}>
          Дисциплин: <strong>{computed.selectedDisciplines.length}</strong> · Участников:{' '}
          <strong>{computed.participants.length}</strong> · Способ формирования:{' '}
          <strong>{mode === 'group' ? 'по группам' : 'сводный'}</strong>
        </p>
      </section>

      {error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Button size="sm" variant="secondary" onClick={() => void generate()}>
            Повторить
          </Button>
        </div>
      ) : null}

      <section className={styles.previewWrap}>
        {generating ? (
          <div className={styles.loading}>
            <Loader2 size={32} className={styles.spin} />
            <p>Формирование протокола…</p>
          </div>
        ) : pdfUrl ? (
          <iframe title="Предпросмотр PDF-протокола" src={pdfUrl} className={styles.preview} />
        ) : (
          <EmptyState
            icon={Settings2}
            title="Протокол ещё не готов"
            description="Добавьте результаты хотя бы одного участника."
          />
        )}
      </section>
    </div>
  );
}
