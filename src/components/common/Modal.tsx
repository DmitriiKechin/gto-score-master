import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, title, onClose, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: клик по фону закрывает окно
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`${styles.modal} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Диалоговое окно'}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
