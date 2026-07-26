import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import {
  safeguardingReasonSchema,
  type SafeguardingReasonForm,
} from "../features/incidents/incident.schemas";
import { incidentControls } from "../features/incidents/incident.types";

type Concern = {
  id: string;
  incidentId: string;
  classification: string;
  status: string;
  narrative?: string;
  escalationReason?: string | null;
  closureReason?: string | null;
  version: number;
  createdAt: string;
};

export function SafeguardingPage() {
  const { centreId = "", concernId } = useParams();
  const access = useAccess();
  const controls = access.status === "ready" ? incidentControls(access.access, centreId) : null;
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [concern, setConcern] = useState<Concern | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const reasonForm = useForm<SafeguardingReasonForm>({
    resolver: zodResolver(safeguardingReasonSchema),
    defaultValues: { reason: "" },
  });

  const load = useCallback(async () => {
    if (concernId === undefined) {
      const response = await apiClient.get<{ concerns: Concern[] }>(
        `/api/v1/centres/${centreId}/safeguarding-concerns`,
      );
      setConcerns(response.data.concerns);
      return;
    }
    const response = await apiClient.get<{ concern: Concern }>(
      `/api/v1/centres/${centreId}/safeguarding-concerns/${concernId}`,
    );
    setConcern(response.data.concern);
  }, [centreId, concernId]);

  useEffect(() => {
    let current = true;
    void Promise.resolve()
      .then(() => load())
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, [load]);

  async function transition(action: "review" | "escalate" | "close", reason?: string) {
    if (concern === null) return;
    setRequestError(null);
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/safeguarding-concerns/${concern.id}/${action}`,
        {
          version: concern.version,
          ...(action === "review" ? { note: null } : { reason }),
        },
      );
      reasonForm.reset();
      setStatusMessage(`Safeguarding ${action} action recorded.`);
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  }

  if (concernId === undefined) {
    return (
      <section className="content-card" aria-labelledby="safeguarding-list-title">
        <p className="eyebrow">Restricted records</p>
        <h1 id="safeguarding-list-title">Safeguarding concerns</h1>
        <p>Access is separately authorised and restricted after escalation.</p>
        <Link to={`/incidents/centres/${centreId}`}>Return to incidents</Link>
        <ErrorSummary message={requestError} />
        {concerns.length === 0 ? (
          <p>No safeguarding concerns are available.</p>
        ) : (
          <ul className="record-grid">
            {concerns.map((item) => (
              <li key={item.id}>
                <h2>{item.classification.replaceAll("_", " ")}</h2>
                <p>Status {item.status.replaceAll("_", " ")}</p>
                <Link to={`/incidents/centres/${centreId}/safeguarding/${item.id}`}>
                  Open restricted concern
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <article className="content-card" aria-labelledby="safeguarding-detail-title">
      <p className="eyebrow">Restricted safeguarding record</p>
      <h1 id="safeguarding-detail-title">Safeguarding concern</h1>
      <p>Sensitive values are intentionally absent from the page title and URL.</p>
      <Link to={`/incidents/centres/${centreId}/safeguarding`}>Return to concerns</Link>
      <ErrorSummary message={requestError} />
      <p aria-live="polite">{statusMessage}</p>
      {concern === null ? (
        <p>
          {requestError === null ? "Loading restricted record…" : "This record is unavailable."}
        </p>
      ) : (
        <>
          <dl className="detail-list">
            <div>
              <dt>Classification</dt>
              <dd>{concern.classification.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{concern.status.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Restricted narrative</dt>
              <dd>{concern.narrative}</dd>
            </div>
            {concern.escalationReason && (
              <div>
                <dt>Escalation reason</dt>
                <dd>{concern.escalationReason}</dd>
              </div>
            )}
          </dl>
          {controls?.canManageSafeguarding === true && (
            <section aria-labelledby="safeguarding-actions-title">
              <h2 id="safeguarding-actions-title">Restricted lifecycle actions</h2>
              <p>These actions require a recent MFA step-up.</p>
              {concern.status === "OPEN" && (
                <button type="button" onClick={() => void transition("review")}>
                  Start restricted review
                </button>
              )}
              {["OPEN", "UNDER_REVIEW"].includes(concern.status) && (
                <form
                  className="auth-form"
                  noValidate
                  onSubmit={(event) =>
                    void reasonForm.handleSubmit((values) => transition("escalate", values.reason))(
                      event,
                    )
                  }
                >
                  <label htmlFor="safeguarding-reason">Escalation reason</label>
                  <textarea id="safeguarding-reason" rows={4} {...reasonForm.register("reason")} />
                  <FieldError message={reasonForm.formState.errors.reason?.message} />
                  <button type="submit">Escalate concern</button>
                </form>
              )}
              {["ESCALATED", "ACTION_REQUIRED"].includes(concern.status) && (
                <form
                  className="auth-form"
                  noValidate
                  onSubmit={(event) =>
                    void reasonForm.handleSubmit((values) => transition("close", values.reason))(
                      event,
                    )
                  }
                >
                  <label htmlFor="safeguarding-closure-reason">Closure reason</label>
                  <textarea
                    id="safeguarding-closure-reason"
                    rows={4}
                    {...reasonForm.register("reason")}
                  />
                  <FieldError message={reasonForm.formState.errors.reason?.message} />
                  <button type="submit">Close concern</button>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </article>
  );
}
