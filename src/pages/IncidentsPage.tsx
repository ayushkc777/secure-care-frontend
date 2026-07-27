import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre } from "../features/childcare/childcare.types";

export function IncidentsPage() {
  const access = useAccess();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (access.status !== "ready") return;
    let current = true;
    void apiClient
      .get<{ centres: Centre[] }>("/centres")
      .then(({ data }) => {
        if (current) {
          setCentres(
            data.centres.filter(
              (centre) =>
                hasPermission(access.access, "incident.read", centre.id) ||
                hasPermission(access.access, "incident.history.read", centre.id),
            ),
          );
        }
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, [access]);

  return (
    <section className="content-card" aria-labelledby="incidents-title">
      <p className="eyebrow">Sensitive care records</p>
      <h1 id="incidents-title">Incident records</h1>
      <p>
        Select a centre available through your current server-issued permissions. Safeguarding
        records have separate access controls.
      </p>
      <ErrorSummary message={requestError} />
      {centres.length === 0 && requestError === null ? (
        <p>No incident records are available.</p>
      ) : (
        <ul className="record-grid">
          {centres.map((centre) => (
            <li key={centre.id}>
              <h2>{centre.name}</h2>
              <Link to={`/incidents/centres/${centre.id}`}>Open incident records</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
