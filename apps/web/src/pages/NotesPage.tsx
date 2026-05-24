import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
  type Note,
} from '../api/client';

function NoteItem({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  const updateMutation = useMutation({
    mutationFn: () => updateNote(note.id, { title, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditing(false);
    },
  });

  if (editing) {
    return (
      <li className="card">
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Body
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <div className="actions">
          <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="card">
      <h3>{note.title}</h3>
      <p>{note.body}</p>
      {note.tags.length > 0 && (
        <p className="tags">{note.tags.map((tag) => `#${tag}`).join(' ')}</p>
      )}
      <div className="actions">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button onClick={() => onDelete(note.id)}>Delete</button>
      </div>
    </li>
  );
}

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
      {notesQuery.isError && <p className="error">Failed to load notes</p>}
      <ul className="list">
        {notesQuery.data?.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </ul>
    </div>
  );
}
