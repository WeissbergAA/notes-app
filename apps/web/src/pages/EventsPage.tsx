import { useQuery } from '@tanstack/react-query';
import { getAuditEvents } from '../api/client';

export function EventsPage() {
  const eventsQuery = useQuery({
    queryKey: ['audit-events'],
    queryFn: () => getAuditEvents(50),
    refetchInterval: 5000,
  });

  return (
    <div>
      <h1>Events audit</h1>
      <p className="hint">
        Kafka-события, обработанные consumer и сохранённые в БД. Обновляется каждые 5 сек.
      </p>

      {eventsQuery.isLoading && <p>Loading...</p>}
      {eventsQuery.isError && (
        <p className="error">
          Нет событий или consumer не запущен. Запусти <code>npm run dev:consumer</code>.
        </p>
      )}

      <ul className="list">
        {eventsQuery.data?.map((event) => (
          <li key={event.id} className="card event-card">
            <div className="event-header">
              <strong>{event.topic}</strong>
              <span>{new Date(event.processedAt).toLocaleString()}</span>
            </div>
            {event.correlationId && (
              <p className="mono">correlationId: {event.correlationId}</p>
            )}
            <pre>{JSON.stringify(event.payload, null, 2)}</pre>
          </li>
        ))}
      </ul>

      {eventsQuery.data?.length === 0 && <p>Пока нет событий — создай заметку или отправь форму.</p>}
    </div>
  );
}
