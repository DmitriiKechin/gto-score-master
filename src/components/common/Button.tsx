import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : icon ? (
        <span className={styles.icon}>{icon}</span>
      ) : null}
      {children != null ? <span>{children}</span> : null}
    </button>
  );
}
