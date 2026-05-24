import { useQuery } from '@tanstack/react-query';
import { getAuditEvents } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { IconEvents } from '../components/icons';

function topicBadgeClass(topic: string) {
  const map: Record<string, string> = {
    'notes.created': 'badge--topic-notes-created',
    'notes.updated': 'badge--topic-notes-updated',
    'notes.deleted': 'badge--topic-notes-deleted',
    'forms.submitted': 'badge--topic-forms-submitted',
  };
  return map[topic] ?? '';
}

export function EventsPage() {
  const eventsQuery = useQuery({
    queryKey: ['audit-events'],
    queryFn: () => getAuditEvents(50),
    refetchInterval: 5000,
  });

  const eventCount = eventsQuery.data?.length ?? 0;

  const topicCounts = eventsQuery.data?.reduce<Record<string, number>>((acc, e) => {
    acc[e.topic] = (acc[e.topic] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div className="main__inner">
      <PageHeader
        title="Events"
        subtitle="Kafka events processed by the consumer. Refreshes every 5 seconds."
      />

      {eventCount > 0 && (
        <div className="stats-strip">
          <span className="stat-chip">
            Total <strong>{eventCount}</strong>
          </span>
          {Object.entries(topicCounts).map(([topic, count]) => (
            <span key={topic} className="stat-chip">
              <span className={`badge ${topicBadgeClass(topic)}`}>{topic}</span>
              <strong>{count}</strong>
            </span>
          ))}
        </div>
      )}

      {eventsQuery.isLoading && <p className="loading">Loading events…</p>}

      {eventsQuery.isError && (
        <div className="alert alert--error">
          Failed to load events. Make sure the consumer is running:{' '}
          <code>npm run dev:consumer</code>
        </div>
      )}

      {!eventsQuery.isLoading && !eventsQuery.isError && eventCount === 0 && (
        <EmptyState
          icon={<IconEvents size={40} />}
          title="No events yet"
          text="Create a note or submit a form — events will appear here and in Kafka UI."
        />
      )}

      <ul className="events-timeline">
        {eventsQuery.data?.map((event) => (
          <li key={event.id} className="card event-card">
            <div className="event-card__header">
              <span className={`badge ${topicBadgeClass(event.topic)}`}>
                {event.topic}
              </span>
              <time className="event-card__time" dateTime={event.processedAt}>
                {new Date(event.processedAt).toLocaleString()}
              </time>
            </div>
            {event.correlationId && (
              <p className="event-card__correlation">
                correlationId: {event.correlationId}
              </p>
            )}
            <pre className="event-card__payload">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
