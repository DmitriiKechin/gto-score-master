import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { create } from 'zustand';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (type: ToastType, message: string) => void;
  dismiss: (id: number) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = ++toastCounter;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function notifySuccess(message: string): void {
  useToastStore.getState().push('success', message);
}

export function notifyError(message: string): void {
  useToastStore.getState().push('error', message);
}

export function notifyInfo(message: string): void {
  useToastStore.getState().push('info', message);
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const state = useToastStore.getState();
        for (const toast of state.toasts) {
          state.dismiss(toast.id);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={styles.host} aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <button
            key={toast.id}
            type="button"
            className={`${styles.toast} ${styles[toast.type]}`}
            onClick={() => dismiss(toast.id)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{toast.message}</span>
          </button>
        );
      })}
    </div>
  );
}
