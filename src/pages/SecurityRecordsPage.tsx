import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { Permission } from "../features/access/access.types";
import { useAccess } from "../features/access/useAccess";

type AuditMetadata = {
  id: string;
  eventType: string;
  outcome: string;
  targetType: string | null;
  occurredAt: string;
  requestId: string | null;
};

type AlertMetadata = {
  id: string;
  type: string;
  severity: string;
  status: string;
  safeSummary: string;
  detectedAt: string;
};

export function SecurityRecordsPage() {
  const { centreId } = useParams();
  const state = useAccess();
  const [events, setEvents] = useState<AuditMetadata[]>([]);
  const [alerts, setAlerts] = useState<AlertMetadata[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "ready" || centreId === undefined) return;
    const permissions =
      state.access.centres.find((centre) => centre.centreId === centreId)?.permissions ?? [];
    const requests: Promise<void>[] = [];
    if (permissions.includes(Permission.AuditRead)) {
      requests.push(
        apiClient
          .get<{ events: AuditMetadata[] }>(`/api/v1/centres/${centreId}/security/audit-events`)
          .then(({ data }) => setEvents(data.events)),
      );
    }
    if (permissions.includes(Permission.SecurityAlertRead)) {
      requests.push(
        apiClient
          .get<{ alerts: AlertMetadata[] }>(`/api/v1/centres/${centreId}/security/alerts`)
          .then(({ data }) => setAlerts(data.alerts)),
      );
    }
    void Promise.all(requests).catch((error: unknown) => {
      setRequestError(safeApiMessage(error));
    });
  }, [centreId, state]);

  return (
    <section className="content-card" aria-labelledby="security-record-title">
      <p className="eyebrow">Centre {centreId}</p>
      <h1 id="security-record-title">Read-only security metadata</h1>
      <ErrorSummary message={requestError} />
      <h2 className="section-heading">Audit events</h2>
      <ul className="metadata-list">
        {events.map((event) => (
          <li key={event.id}>
            <strong>{event.eventType}</strong>
            <span>
              {event.outcome} · {new Date(event.occurredAt).toLocaleString("en-GB")}
            </span>
          </li>
        ))}
      </ul>
      <h2 className="section-heading">Security alerts</h2>
      <ul className="metadata-list">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <strong>
              {alert.severity} · {alert.type}
            </strong>
            <span>{alert.safeSummary}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
