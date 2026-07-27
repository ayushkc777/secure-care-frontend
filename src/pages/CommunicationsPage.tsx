import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre } from "../features/childcare/childcare.types";

export function CommunicationsPage() {
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
            data.centres.filter(({ id }) => hasPermission(access.access, "communication.read", id)),
          );
        }
      })
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [access]);

  return (
    <section className="content-card" aria-labelledby="communications-title">
      <p className="eyebrow">Private centre communication</p>
      <h1 id="communications-title">Messages and announcements</h1>
      <p>
        Choose an authorised centre. Message content stays in memory and is never stored in browser
        storage.
      </p>
      <ErrorSummary message={error} />
      {centres.length === 0 && error === null ? (
        <p>No communication workspace is available through your current permissions.</p>
      ) : (
        <ul className="record-grid">
          {centres.map((centre) => (
            <li key={centre.id}>
              <h2>{centre.name}</h2>
              <Link to={`/communications/centres/${centre.id}`}>Open secure inbox</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
