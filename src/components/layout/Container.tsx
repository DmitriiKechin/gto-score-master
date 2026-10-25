import type { ReactNode } from 'react';
import styles from './Container.module.css';

interface ContainerProps {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}

export function Container({ children, wide = false, className }: ContainerProps) {
  return (
    <div className={`${styles.container} ${wide ? styles.wide : ''} ${className ?? ''}`}>{children}</div>
  );
}
