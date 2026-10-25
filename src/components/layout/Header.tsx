import { ClipboardList, FileText, Medal, Settings2, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Header.module.css';

export type AppTab = 'competition' | 'participants' | 'protocol' | 'norms';

interface TabDef {
  id: AppTab;
  label: string;
  icon: ReactNode;
}

const TABS: TabDef[] = [
  { id: 'competition', label: 'Соревнование', icon: <ClipboardList size={18} /> },
  { id: 'participants', label: 'Участники', icon: <Users size={18} /> },
  { id: 'protocol', label: 'Печать протокола', icon: <FileText size={18} /> },
  { id: 'norms', label: 'Нормативы', icon: <Settings2 size={18} /> },
];

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  eventTitle?: string;
}

export function Header({ activeTab, onTabChange, eventTitle }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand} title="GTO Score Master">
          <Medal size={26} strokeWidth={2} />
          <div className={styles.brandText}>
            <strong>GTO Score Master</strong>
            <span className={styles.brandSubtitle}>{eventTitle || 'Протоколы ВФСК ГТО'}</span>
          </div>
        </div>
        <nav className={styles.nav} aria-label="Основная навигация">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
