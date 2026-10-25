import { useEffect, useRef, useState } from 'react';
import type { Discipline } from '../../types/competition';
import { formatCompactResult, parseResultText, UNIT_LABELS } from '../../utils/formatters';
import styles from './ResultInput.module.css';

interface ResultInputProps {
  participantId: string;
  disciplineId: string;
  discipline: Discipline;
  value: number | null | undefined;
  points: number;
  normPoints?: {
    bronze: number;
    silver: number;
    gold: number;
  };
  registerInput: (participantId: string, disciplineId: string, el: HTMLInputElement | null) => void;
  onNavigate: (direction: number, participantId: string, disciplineId: string) => void;
  onChange: (participantId: string, disciplineId: string, value: number | null) => void;
}

export function ResultInput({
  participantId,
  disciplineId,
  discipline,
  value,
  points,
  normPoints,
  registerInput,
  onNavigate,
  onChange,
}: ResultInputProps) {
  const [text, setText] = useState(() => (value != null ? formatCompactResult(value, discipline.unit) : ''));
  const focused = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focused.current) {
      setText(value != null ? formatCompactResult(value, discipline.unit) : '');
    }
  }, [value, discipline.unit]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }
    registerInput(participantId, disciplineId, inputRef.current);
    return () => registerInput(participantId, disciplineId, null);
  }, [registerInput, participantId, disciplineId]);

  const commit = () => {
    const parsed = parseResultText(text, discipline.unit);
    if (parsed == null && text.trim() !== '') {
      setText(value != null ? formatCompactResult(value, discipline.unit) : '');
      return;
    }
    onChange(participantId, disciplineId, parsed);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      onNavigate(event.shiftKey ? -1 : 1, participantId, disciplineId);
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && event.shiftKey === false) {
      const selectionStart = event.currentTarget.selectionStart ?? 0;
      const selectionEnd = event.currentTarget.selectionEnd ?? 0;
      if (selectionStart === selectionEnd) {
        event.preventDefault();
        commit();
        onNavigate(event.key === 'ArrowDown' ? 1 : -1, participantId, disciplineId);
      }
    }
  };

  const scoreClass = (() => {
    if (!normPoints || points <= 0) {
      return '';
    }
    if (points >= normPoints.gold && normPoints.gold > 0) {
      return styles.scoreGold;
    }
    if (points >= normPoints.silver && normPoints.silver > 0) {
      return styles.scoreSilver;
    }
    if (points >= normPoints.bronze && normPoints.bronze > 0) {
      return styles.scoreBronze;
    }
    return styles.scoreLow;
  })();

  const hasNorm = normPoints !== undefined;

  return (
    <div className={`${styles.cell} ${focused.current ? styles.focused : ''}`}>
      <input
        ref={inputRef}
        className={styles.input}
        value={text}
        placeholder={UNIT_LABELS[discipline.unit]}
        inputMode={discipline.unit === 'seconds' || discipline.unit === 'meters' ? 'decimal' : 'numeric'}
        onFocus={(e) => {
          focused.current = true;
          e.target.select();
          setText(e.target.value);
        }}
        onBlur={() => {
          focused.current = false;
          commit();
        }}
        onKeyDown={handleKeyDown}
        onChange={(e) => setText(e.target.value)}
      />
      <span
        className={`${styles.points} ${scoreClass}`}
        title={hasNorm ? `${points} баллов` : 'Для данной ступени и пола норматив ВФСК ГТО не предусмотрен'}
      >
        {hasNorm ? points : '—'}
      </span>
    </div>
  );
}
