import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChangeValue: (value: T) => void;
}

export function Select<T extends string | number>({
  label,
  value,
  options,
  onChangeValue,
  className,
  id,
  ...rest
}: SelectProps<T>) {
  const selectId = id ?? (label ? `select-${label}` : undefined);
  return (
    <label className={styles.field} htmlFor={selectId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <span className={styles.wrapper}>
        <select
          id={selectId}
          className={`${styles.select} ${className ?? ''}`}
          value={String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            const option = options.find((o) => String(o.value) === raw);
            if (option) {
              onChangeValue(option.value);
            }
          }}
          {...rest}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
      </span>
    </label>
  );
}
