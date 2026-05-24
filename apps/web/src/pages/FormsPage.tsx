import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createForm,
  getForms,
  submitForm,
  type FormField,
} from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { IconForms } from '../components/icons';

const defaultSchema: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'message', label: 'Message', type: 'textarea' },
];

export function FormsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('Contact form');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [submitData, setSubmitData] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const formsQuery = useQuery({ queryKey: ['forms'], queryFn: getForms });

  const createMutation = useMutation({
    mutationFn: createForm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forms'] }),
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) =>
      submitForm(id, data),
    onSuccess: () => {
      setSubmitData({});
      setSubmitSuccess(true);
    },
  });

  useEffect(() => {
    if (!submitSuccess) {
      return;
    }
    const timer = window.setTimeout(() => setSubmitSuccess(false), 4000);
    return () => window.clearTimeout(timer);
  }, [submitSuccess]);

  function createDefaultForm(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({ title, schema: defaultSchema });
  }

  const selectedForm = formsQuery.data?.find((f) => f.id === selectedFormId);
  const formCount = formsQuery.data?.length ?? 0;

  return (
    <div className="main__inner">
      <PageHeader
        title="Forms"
        subtitle="Create forms, collect submissions — each submit publishes a Kafka event."
      />

      <div className="forms-layout">
        <div>
          <section className="page-section">
            <h2 className="page-section__title">Create</h2>
            <form className="card" onSubmit={createDefaultForm}>
              <div className="field">
                <label className="field__label" htmlFor="form-title">
                  Form title
                </label>
                <input
                  id="form-title"
                  className="field__input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contact form, Feedback…"
                />
              </div>
              <p className="page-header__subtitle" style={{ marginBottom: '1rem' }}>
                Default fields: Name, Email, Message
              </p>
              <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create default form'}
              </button>
            </form>
          </section>

          <section className="page-section">
            <h2 className="page-section__title">
              Your forms {formCount > 0 && `(${formCount})`}
            </h2>

            {formsQuery.isLoading && <p className="loading">Loading forms…</p>}

            {!formsQuery.isLoading && formCount === 0 && (
              <EmptyState
                icon={<IconForms size={40} />}
                title="No forms yet"
                text="Create a default form above, then select it to fill and submit."
              />
            )}

            <ul className="forms-list">
              {formsQuery.data?.map((form) => (
                <li
                  key={form.id}
                  className={`card form-item${
                    selectedFormId === form.id ? ' card--selected' : ''
                  }`}
                  onClick={() => setSelectedFormId(form.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedFormId(form.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <p className="form-item__title">{form.title}</p>
                    <p className="form-item__meta">{form.schema.length} fields</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFormId(form.id);
                    }}
                  >
                    Fill
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div>
          {selectedForm ? (
            <section className="page-section">
              <h2 className="page-section__title">{selectedForm.title}</h2>

              {submitSuccess && (
                <div className="alert alert--success">Submitted successfully!</div>
              )}

              <form
                className="card"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitMutation.mutate({ id: selectedForm.id, data: submitData });
                }}
              >
                {selectedForm.schema.map((field) => (
                  <div key={field.name} className="field">
                    <label className="field__label" htmlFor={`field-${field.name}`}>
                      {field.label}
                      {field.required && ' *'}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={`field-${field.name}`}
                        className="field__textarea"
                        value={submitData[field.name] ?? ''}
                        onChange={(e) =>
                          setSubmitData((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))
                        }
                        required={field.required}
                      />
                    ) : (
                      <input
                        id={`field-${field.name}`}
                        className="field__input"
                        type={field.type}
                        value={submitData[field.name] ?? ''}
                        onChange={(e) =>
                          setSubmitData((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))
                        }
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                <button type="submit" className="btn btn--primary" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? 'Submitting…' : 'Submit'}
                </button>
              </form>
            </section>
          ) : (
            <div className="card card--flat" style={{ marginTop: '1.75rem' }}>
              <EmptyState
                icon={<IconForms size={40} />}
                title="Select a form"
                text="Choose a form from the list to fill and submit it."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
