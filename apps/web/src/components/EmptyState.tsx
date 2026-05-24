import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  text?: string;
}

export function EmptyState({ icon, title, text }: EmptyStateProps) {
  return (
    <div className="empty-state card card--flat">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <p className="empty-state__title">{title}</p>
      {text && <p className="empty-state__text">{text}</p>}
    </div>
  );
}
