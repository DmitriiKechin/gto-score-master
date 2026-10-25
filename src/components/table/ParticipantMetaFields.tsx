import type { GtoStage, Participant } from '../../types/competition';
import { ALL_STAGES, formatStage, GENDER_LABELS, stageAgeRange } from '../../utils/formatters';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import styles from './ParticipantMetaFields.module.css';

export type ParticipantDraft = Pick<
  Participant,
  'lastName' | 'firstName' | 'middleName' | 'gender' | 'stage'
> &
  Partial<Pick<Participant, 'age' | 'team' | 'bibNumber'>>;

interface ParticipantMetaFieldsProps {
  value: ParticipantDraft;
  onChange: (patch: Partial<ParticipantDraft>) => void;
  genderDisabled?: boolean;
  submitOnEnter?: boolean;
}

export function ParticipantMetaFields({
  value,
  onChange,
  genderDisabled = false,
}: ParticipantMetaFieldsProps) {
  return (
    <div className={styles.grid}>
      <Input
        label="Фамилия *"
        value={value.lastName}
        placeholder="Иванов"
        onChange={(e) => onChange({ lastName: e.target.value })}
        autoFocus
      />
      <Input
        label="Имя *"
        value={value.firstName}
        placeholder="Иван"
        onChange={(e) => onChange({ firstName: e.target.value })}
      />
      <Input
        label="Отчество"
        value={value.middleName ?? ''}
        placeholder="Иванович"
        onChange={(e) => onChange({ middleName: e.target.value })}
      />
      <Input
        label="Нагрудный номер"
        value={value.bibNumber ?? ''}
        placeholder="1"
        inputMode="numeric"
        onChange={(e) => onChange({ bibNumber: e.target.value })}
      />
      <Select
        label="Пол"
        value={value.gender}
        disabled={genderDisabled}
        options={[
          { value: 'male' as const, label: GENDER_LABELS.male },
          { value: 'female' as const, label: GENDER_LABELS.female },
        ]}
        onChangeValue={(gender) => onChange({ gender })}
      />
      <Select
        label="Ступень комплекса ГТО"
        value={value.stage}
        options={ALL_STAGES.map((stage: GtoStage) => ({
          value: stage,
          label: `${formatStage(stage)} (${stageAgeRange(stage)})`,
        }))}
        onChangeValue={(stage) => onChange({ stage })}
      />
      <Input
        label="Возраст участника"
        type="number"
        min={0}
        max={100}
        value={value.age != null ? String(value.age) : ''}
        placeholder="например, 14"
        onChange={(e) => {
          const num = e.target.value === '' ? undefined : Number(e.target.value);
          onChange({ age: num });
        }}
      />
      <Input
        label="Организация / команда"
        value={value.team ?? ''}
        placeholder="СОШ №1"
        onChange={(e) => onChange({ team: e.target.value })}
      />
    </div>
  );
}
