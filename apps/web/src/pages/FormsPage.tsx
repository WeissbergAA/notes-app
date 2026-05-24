import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createForm,
  getForms,
  submitForm,
  type FormField,
} from '../api/client';

export function FormsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('Contact form');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [submitData, setSubmitData] = useState<Record<string, string>>({});

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
      alert('Submitted!');
    },
  });

  const defaultSchema: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea' },
  ];

  function createDefaultForm(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({ title, schema: defaultSchema });
  }

  const selectedForm = formsQuery.data?.find((f) => f.id === selectedFormId);

  return (
    <div>
      <h1>Forms</h1>
      <form className="card" onSubmit={createDefaultForm}>
        <label>
          Form title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <button type="submit">Create default form</button>
      </form>

      <ul className="list">
        {formsQuery.data?.map((form) => (
          <li key={form.id} className="card">
            <h3>{form.title}</h3>
            <button onClick={() => setSelectedFormId(form.id)}>Fill form</button>
          </li>
        ))}
      </ul>

      {selectedForm && (
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            submitMutation.mutate({ id: selectedForm.id, data: submitData });
          }}
        >
          <h2>{selectedForm.title}</h2>
          {selectedForm.schema.map((field) => (
            <label key={field.name}>
              {field.label}
              {field.type === 'textarea' ? (
                <textarea
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
            </label>
          ))}
          <button type="submit">Submit</button>
        </form>
      )}
    </div>
  );
}
