import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre, ChildSummary } from "../features/childcare/childcare.types";

type CentreChildren = Centre & { children: ChildSummary[] };

export function PickupPage() {
  const access = useAccess();
  const [centres, setCentres] = useState<CentreChildren[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (access.status !== "ready") return;
    let current = true;
    void apiClient
      .get<{ centres: Centre[] }>("/centres")
      .then(async ({ data }) => {
        const visible = data.centres.filter(
          (centre) =>
            hasPermission(access.access, "pickup_authorisation.read", centre.id) ||
            hasPermission(access.access, "pickup_verification.read", centre.id) ||
            hasPermission(access.access, "pickup_completion.read", centre.id),
        );
        return Promise.all(
          visible.map(async (centre) => {
            const response = await apiClient.get<{ children: ChildSummary[] }>(
              `/centres/${centre.id}/children`,
            );
            return { ...centre, children: response.data.children };
          }),
        );
      })
      .then((records) => {
        if (current) setCentres(records);
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, [access]);

  return (
    <section className="content-card" aria-labelledby="pickup-title">
      <p className="eyebrow">Authorised collection</p>
      <h1 id="pickup-title">Secure pickup</h1>
      <p>Select a child from a centre available to your current server-side access.</p>
      <ErrorSummary message={requestError} />
      {centres.length === 0 && requestError === null ? (
        <p>No pickup records are available.</p>
      ) : (
        centres.map((centre) => (
          <section key={centre.id} aria-labelledby={`pickup-centre-${centre.id}`}>
            <h2 className="section-heading" id={`pickup-centre-${centre.id}`}>
              {centre.name}
            </h2>
            {centre.children.length === 0 ? (
              <p>No active children are available in this centre.</p>
            ) : (
              <ul className="record-grid">
                {centre.children.map((child) => (
                  <li key={child.id}>
                    <h3>{child.displayName || "Child record"}</h3>
                    <Link to={`/pickup/centres/${centre.id}/children/${child.id}`}>
                      Open pickup workspace
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </section>
  );
}
