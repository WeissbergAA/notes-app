import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea';
  required?: boolean;
}

export interface FormItem {
  id: string;
  title: string;
  schema: FormField[];
  createdAt: string;
}

export async function register(email: string, password: string) {
  const { data } = await api.post<{ accessToken: string }>('/auth/register', {
    email,
    password,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ accessToken: string }>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function getMe() {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function getNotes() {
  const { data } = await api.get<Note[]>('/notes');
  return data;
}

export async function createNote(payload: {
  title: string;
  body?: string;
  tags?: string[];
}) {
  const { data } = await api.post<Note>('/notes', payload);
  return data;
}

export async function updateNote(
  id: string,
  payload: { title?: string; body?: string; tags?: string[] },
) {
  const { data } = await api.patch<Note>(`/notes/${id}`, payload);
  return data;
}

export async function deleteNote(id: string) {
  await api.delete(`/notes/${id}`);
}

export interface AuditEvent {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  correlationId: string | null;
  processedAt: string;
}

export async function getAuditEvents(limit = 50) {
  const { data } = await api.get<AuditEvent[]>('/events/audit', {
    params: { limit },
  });
  return data;
}

export async function getForms() {
  const { data } = await api.get<FormItem[]>('/forms');
  return data;
}

export async function createForm(payload: {
  title: string;
  schema: FormField[];
}) {
  const { data } = await api.post<FormItem>('/forms', payload);
  return data;
}

export async function submitForm(id: string, data: Record<string, string>) {
  await api.post(`/forms/${id}/submit`, { data });
}
