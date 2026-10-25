import type { BadgeType } from '../../types/competition';
import styles from './Badge.module.css';

const BADGE_LABELS: Record<BadgeType, string> = {
  none: '—',
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
};

const BADGE_SHORT: Record<BadgeType, string> = {
  none: '—',
  bronze: 'БЗ',
  silver: 'СЗ',
  gold: 'ЗЗ',
};

interface BadgeProps {
  badge: BadgeType;
  short?: boolean;
  title?: string;
}

export function AwardBadge({ badge, short = false, title }: BadgeProps) {
  if (badge === 'none') {
    return <span className={styles.none}>—</span>;
  }
  const label = short ? BADGE_SHORT[badge] : BADGE_LABELS[badge];
  return (
    <span
      className={`${styles.badge} ${styles[badge]}`}
      title={title ?? (short ? BADGE_LABELS[badge] : undefined)}
    >
      {label}
    </span>
  );
}
