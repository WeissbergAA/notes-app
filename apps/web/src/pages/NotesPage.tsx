import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNote, deleteNote, getNotes } from '../api/client';

export function NotesPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const notesQuery = useQuery({ queryKey: ['notes'], queryFn: getNotes });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setTitle('');
      setBody('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({ title, body });
  }

  return (
    <div>
      <h1>Notes</h1>
      <form className="card" onSubmit={onSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Body
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <button type="submit" disabled={createMutation.isPending}>
          Add note
        </button>
      </form>

      {notesQuery.isLoading && <p>Loading...</p>}
      <ul className="list">
        {notesQuery.data?.map((note) => (
          <li key={note.id} className="card">
            <h3>{note.title}</h3>
            <p>{note.body}</p>
            <button onClick={() => deleteMutation.mutate(note.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
