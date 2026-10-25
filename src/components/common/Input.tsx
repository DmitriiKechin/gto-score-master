import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, unit, error, hint, className, id, ...rest }: InputProps) {
  const inputId = id ?? (label ? `input-${label}` : undefined);
  return (
    <label className={styles.field} htmlFor={inputId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <span className={`${styles.wrapper} ${error ? styles.hasError : ''}`}>
        <input id={inputId} className={`${styles.input} ${className ?? ''}`} {...rest} />
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </span>
      {hint && !error ? <span className={styles.hint}>{hint}</span> : null}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}
