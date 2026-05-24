import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
  type Note,
} from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { IconEmptyNotes, IconPlus, IconSearch, IconTrash } from '../components/icons';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatListDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function NoteEditor({
  note,
  onDelete,
  isDeleting,
}: {
  note: Note;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  const updateMutation = useMutation({
    mutationFn: () => updateNote(note.id, { title, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const dirty = title !== note.title || body !== note.body;

  return (
    <>
      <div className="notes-editor__head">
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label className="field__label" htmlFor={`note-title-${note.id}`}>
            Title
          </label>
          <input
            id={`note-title-${note.id}`}
            className="field__input field__input--title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          {dirty && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          )}
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => onDelete(note.id)}
            disabled={isDeleting}
            aria-label="Delete note"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="notes-editor__body">
        <div className="field">
          <label className="field__label" htmlFor={`note-body-${note.id}`}>
            Body
          </label>
          <textarea
            id={`note-body-${note.id}`}
            className="field__textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Start writing…"
            style={{ minHeight: '280px' }}
          />
        </div>

        {note.tags.length > 0 && (
          <div className="notes-editor__tags">
            {note.tags.map((tag) => (
              <span key={tag} className="badge badge--tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <p className="notes-editor__meta">
          Created {formatDate(note.createdAt)} · Updated {formatDate(note.updatedAt)}
        </p>
      </div>
    </>
  );
}

export function NotesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const notesQuery = useQuery({ queryKey: ['notes'], queryFn: getNotes });

  const isEmpty =
    !notesQuery.isLoading &&
    !notesQuery.isError &&
    (notesQuery.data?.length ?? 0) === 0;

  const showCreateForm = isCreating || (isEmpty && selectedId === null);

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setTitle('');
      setBody('');
      setIsCreating(false);
      setSelectedId(note.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (selectedId === deletedId) {
        setSelectedId(null);
      }
    },
  });

  const filteredNotes = useMemo(() => {
    const list = notesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q),
    );
  }, [notesQuery.data, search]);

  const selectedNote = notesQuery.data?.find((n) => n.id === selectedId);

  function onCreateSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({ title, body });
  }

  function startNewNote() {
    setIsCreating(true);
    setSelectedId(null);
    setTitle('');
    setBody('');
  }

  return (
    <div className="notes-workspace">
      <aside className="notes-panel">
        <div className="notes-panel__head">
          <div className="notes-panel__toolbar">
            <div className="search-wrap">
              <IconSearch />
              <input
                className="search-input"
                type="search"
                placeholder="Search notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search notes"
              />
            </div>
            <button
              type="button"
              className="btn btn--primary btn--icon"
              onClick={startNewNote}
              aria-label="New note"
              title="New note"
            >
              <IconPlus />
            </button>
          </div>
          <button type="button" className="btn btn--primary btn--block" onClick={startNewNote}>
            <IconPlus size={16} />
            New note
          </button>
        </div>

        <div className="notes-list">
          {notesQuery.isLoading && <p className="loading">Loading…</p>}
          {notesQuery.isError && (
            <div className="alert alert--error" style={{ margin: '0.5rem' }}>
              Failed to load notes
            </div>
          )}

          {!notesQuery.isLoading && filteredNotes.length === 0 && (
            <EmptyState
              icon={<IconEmptyNotes />}
              title={search ? 'No matches' : 'No notes yet'}
              text={search ? 'Try a different search.' : 'Create your first note.'}
            />
          )}

          {filteredNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={`note-list-item${
                selectedId === note.id && !showCreateForm ? ' note-list-item--active' : ''
              }`}
              onClick={() => {
                setSelectedId(note.id);
                setIsCreating(false);
              }}
            >
              <p className="note-list-item__title">{note.title || 'Untitled'}</p>
              {note.body && <p className="note-list-item__preview">{note.body}</p>}
              <p className="note-list-item__date">{formatListDate(note.updatedAt)}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="notes-editor">
        {showCreateForm && (
          <>
            <div className="notes-editor__head">
              <h2>New note</h2>
            </div>
            <div className="notes-editor__body">
              <form onSubmit={onCreateSubmit}>
                <div className="field">
                  <label className="field__label" htmlFor="note-title">
                    Title
                  </label>
                  <input
                    id="note-title"
                    className="field__input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Meeting notes, ideas…"
                    required
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="note-body">
                    Body
                  </label>
                  <textarea
                    id="note-body"
                    className="field__textarea"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your note here…"
                  />
                </div>
                <div className="actions">
                  <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding…' : 'Add note'}
                  </button>
                  {!isEmpty && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}

        {!showCreateForm && selectedNote && (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onDelete={(id) => deleteMutation.mutate(id)}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {!showCreateForm && !selectedNote && (
          <div className="notes-editor__welcome">
            <EmptyState
              icon={<IconEmptyNotes />}
              title="Select a note"
              text="Pick one from the list or create a new note to get started."
            />
          </div>
        )}
      </section>
    </div>
  );
}
