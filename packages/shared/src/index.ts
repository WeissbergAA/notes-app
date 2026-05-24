export const KAFKA_TOPICS = {
  NOTES_CREATED: 'notes.created',
  NOTES_UPDATED: 'notes.updated',
  NOTES_DELETED: 'notes.deleted',
  FORMS_SUBMITTED: 'forms.submitted',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

export type FormFieldType = 'text' | 'email' | 'textarea';

export interface FormFieldSchema {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
