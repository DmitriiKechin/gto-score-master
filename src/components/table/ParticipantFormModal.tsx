import { useEffect, useState } from 'react';
import {
  baseParticipant,
  type NewParticipantInput,
  useCompetitionStore,
} from '../../store/useCompetitionStore';
import type { Participant } from '../../types/competition';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { notifySuccess } from '../common/Toast';
import { type ParticipantDraft, ParticipantMetaFields } from './ParticipantMetaFields';

interface ParticipantFormModalProps {
  open: boolean;
  onClose: () => void;
  participant?: Participant;
  title?: string;
}

export function ParticipantFormModal({ open, onClose, participant, title }: ParticipantFormModalProps) {
  const addParticipant = useCompetitionStore((s) => s.addParticipant);
  const updateParticipant = useCompetitionStore((s) => s.updateParticipant);
  const [draft, setDraft] = useState<ParticipantDraft>(() => toDraft(participant));

  useEffect(() => {
    if (open) {
      setDraft(toDraft(participant));
    }
  }, [open, participant]);

  const applyPatch = (patch: Partial<ParticipantDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = () => {
    if (!draft.lastName.trim() || !draft.firstName.trim()) {
      return;
    }
    const input: NewParticipantInput = {
      lastName: draft.lastName,
      firstName: draft.firstName,
      middleName: draft.middleName,
      gender: draft.gender,
      stage: draft.stage,
      age: draft.age,
      team: draft.team,
      bibNumber: draft.bibNumber,
    };
    if (participant) {
      updateParticipant(participant.id, { ...input });
      notifySuccess('Данные участника обновлены');
    } else {
      addParticipant(baseParticipant(input));
      notifySuccess('Участник добавлен');
    }
    onClose();
  };

  const valid = draft.lastName.trim().length > 0 && draft.firstName.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? (participant ? 'Редактирование участника' : 'Новый участник')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={!valid}>
            Сохранить
          </Button>
        </>
      }
    >
      <ParticipantMetaFields value={draft} onChange={applyPatch} />
    </Modal>
  );
}

function toDraft(participant?: Participant): ParticipantDraft {
  return {
    lastName: participant?.lastName ?? '',
    firstName: participant?.firstName ?? '',
    middleName: participant?.middleName ?? '',
    gender: participant?.gender ?? 'male',
    stage: participant?.stage ?? 1,
    age: participant?.age,
    team: participant?.team,
    bibNumber: participant?.bibNumber,
  };
}
