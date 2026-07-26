import type { ReactNode } from "react";

export function EmptyState({
  action,
  description,
  icon = "○",
  title,
}: {
  action?: ReactNode;
  description: string;
  icon?: string;
  title: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
