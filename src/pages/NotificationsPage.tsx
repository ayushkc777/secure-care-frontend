import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre } from "../features/childcare/childcare.types";

export function NotificationsPage() {
  const access = useAccess();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (access.status !== "ready") return;
    let current = true;
    void apiClient
      .get<{ centres: Centre[] }>("/centres")
      .then(({ data }) => {
        if (current) {
          setCentres(
            data.centres.filter(({ id }) => hasPermission(access.access, "notification.read", id)),
          );
        }
      })
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [access]);

  return (
    <section className="content-card" aria-labelledby="notifications-title">
      <p className="eyebrow">Operational updates</p>
      <h1 id="notifications-title">Notification centre</h1>
      <p>Choose an authorised centre to view recipient-scoped delivery history.</p>
      <ErrorSummary message={error} />
      <ul className="record-grid">
        {centres.map((centre) => (
          <li key={centre.id}>
            <h2>{centre.name}</h2>
            <Link to={`/notifications/centres/${centre.id}`}>View notifications</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
