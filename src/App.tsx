import { useState } from 'react';
import styles from './App.module.css';
import { ToastHost } from './components/common/Toast';
import { CompetitionTab } from './components/competition/CompetitionTab';
import { Container } from './components/layout/Container';
import { Footer } from './components/layout/Footer';
import { type AppTab, Header } from './components/layout/Header';
import { ParticipantsTab } from './components/participants/ParticipantsTab';
import { ProtocolScreen } from './components/pdf/ProtocolScreen';
import { NormsEditor } from './components/settings/NormsEditor';
import { useCompetitionStore } from './store/useCompetitionStore';

export default function App() {
  const [tab, setTab] = useState<AppTab>('competition');
  const event = useCompetitionStore((s) => s.event);

  return (
    <div className={styles.shell}>
      <Header activeTab={tab} onTabChange={setTab} eventTitle={event?.title} />
      <main className={styles.main}>
        <Container wide>
          {tab === 'competition' ? (
            <CompetitionTab onGoToParticipants={() => setTab('participants')} />
          ) : null}
          {tab === 'participants' ? <ParticipantsTab /> : null}
          {tab === 'protocol' ? <ProtocolScreen /> : null}
          {tab === 'norms' ? <NormsEditor /> : null}
        </Container>
      </main>
      <Footer />
      <ToastHost />
    </div>
  );
}
