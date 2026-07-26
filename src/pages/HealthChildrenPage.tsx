import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import type { ChildSummary } from "../features/childcare/childcare.types";

export function HealthChildrenPage() {
  const { centreId = "" } = useParams();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ children: ChildSummary[] }>(`/api/v1/centres/${centreId}/children`)
      .then(({ data }) => current && setChildren(data.children))
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [centreId]);

  return (
    <section className="content-card" aria-labelledby="health-children-title">
      <p className="eyebrow">Centre-scoped records</p>
      <h1 id="health-children-title">Select a child health record</h1>
      <nav className="section-navigation" aria-label="Health record sections">
        <Link to="/health">All available centres</Link>
      </nav>
      <ErrorSummary message={error} />
      <ul className="record-grid">
        {children.map((child) => (
          <li key={child.id}>
            <h2>{child.displayName || "Child record"}</h2>
            <Link to={`/health/centres/${centreId}/children/${child.id}`}>
              Open health and medication
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
