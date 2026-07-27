import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre } from "../features/childcare/childcare.types";

export function HealthPage() {
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
            data.centres.filter(
              ({ id }) =>
                hasPermission(access.access, "health.read", id) ||
                hasPermission(access.access, "medication.read", id),
            ),
          );
        }
      })
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [access]);

  return (
    <section className="content-card" aria-labelledby="health-title">
      <p className="eyebrow">Sensitive care information</p>
      <h1 id="health-title">Health and medication</h1>
      <p>Choose a centre to access only the child health records authorised for your role.</p>
      <ErrorSummary message={error} />
      <ul className="record-grid">
        {centres.map((centre) => (
          <li key={centre.id}>
            <h2>{centre.name}</h2>
            <Link to={`/health/centres/${centre.id}`}>Choose a child record</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
