import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre } from "../features/childcare/childcare.types";

export function AttendancePage() {
  const access = useAccess();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (access.status !== "ready") return;
    let current = true;
    void apiClient
      .get<{ centres: Centre[] }>("/centres")
      .then(({ data }) => {
        if (current)
          setCentres(
            data.centres.filter(
              (centre) =>
                hasPermission(access.access, "attendance.read", centre.id) ||
                hasPermission(access.access, "attendance.history.read", centre.id),
            ),
          );
      })
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [access]);
  return (
    <section className="content-card" aria-labelledby="attendance-title">
      <p className="eyebrow">Live care operations</p>
      <h1 id="attendance-title">Attendance</h1>
      <p>Choose a centre to view today’s safe attendance and room headcounts.</p>
      <ErrorSummary message={error} />
      <ul className="record-grid">
        {centres.map((centre) => (
          <li key={centre.id}>
            <h2>{centre.name}</h2>
            <Link to={`/attendance/centres/${centre.id}`}>Open daily attendance</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
