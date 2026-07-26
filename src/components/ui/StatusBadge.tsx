import type { ReactNode } from "react";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const statusTone: Record<string, BadgeTone> = {
  ACTIVE: "success",
  ADMINISTERED: "success",
  APPROVED: "success",
  CHECKED_IN: "success",
  COMPLETED: "success",
  EXPECTED: "info",
  PARENT_AUTHORISED: "info",
  MANAGER_APPROVED: "info",
  DRAFT: "neutral",
  CHECKED_OUT: "neutral",
  ARCHIVED: "neutral",
  ABSENT: "warning",
  MISSED: "warning",
  REFUSED: "warning",
  SUSPENDED: "warning",
  TEMPORARILY_OUT: "warning",
  ERROR_RECORDED: "danger",
  EXPIRED: "danger",
  DISCONTINUED: "danger",
};

export function StatusBadge({
  children,
  status,
  tone,
}: {
  children?: ReactNode;
  status?: string;
  tone?: BadgeTone;
}) {
  const label = children ?? status?.replaceAll("_", " ") ?? "Status";
  const resolvedTone =
    tone ?? (status === undefined ? "neutral" : (statusTone[status] ?? "neutral"));
  return <span className={`status-badge status-badge-${resolvedTone}`}>{label}</span>;
}
