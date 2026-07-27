import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import {
  acknowledgementSchema,
  amendmentSchema,
  draftUpdateSchema,
  returnSchema,
  reviewSchema,
  type AcknowledgementForm,
  type AmendmentForm,
  type DraftUpdateForm,
  type ReturnForm,
  type ReviewForm,
} from "../features/incidents/incident.schemas";
import { incidentControls, type Incident } from "../features/incidents/incident.types";

type Revision = {
  id: string;
  revisionNumber: number;
  type: string;
  statusAfter: string;
  changedFields: string[];
  reason?: string | null;
  content?: string | null;
  parentVisible?: boolean;
  createdAt: string;
};

const noControls = {
  canCreate: false,
  canEditDraft: false,
  canSubmit: false,
  canReview: false,
  canApprove: false,
  canAmend: false,
  canArchive: false,
  canAcknowledge: false,
  canReadHistory: false,
  canReadSafeguarding: false,
  canManageSafeguarding: false,
};

export function IncidentDetailPage() {
  const { centreId = "", incidentId = "" } = useParams();
  const navigate = useNavigate();
  const access = useAccess();
  const controls =
    access.status === "ready" ? incidentControls(access.access, centreId) : noControls;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [history, setHistory] = useState<Revision[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const updateForm = useForm<DraftUpdateForm>({ resolver: zodResolver(draftUpdateSchema) });
  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { note: "" },
  });
  const returnForm = useForm<ReturnForm>({ resolver: zodResolver(returnSchema) });
  const acknowledgementForm = useForm<AcknowledgementForm>({
    resolver: zodResolver(acknowledgementSchema),
    defaultValues: { comment: "" },
  });
  const amendmentForm = useForm<AmendmentForm>({
    resolver: zodResolver(amendmentSchema),
    defaultValues: {
      reason: "",
      content: "",
      changedField: "description",
      parentVisible: false,
    },
  });

  const load = useCallback(async () => {
    const detail = await apiClient.get<{ incident: Incident }>(
      `/centres/${centreId}/incidents/${incidentId}`,
    );
    setIncident(detail.data.incident);
    updateForm.reset({
      location: detail.data.incident.location ?? "",
      description: detail.data.incident.description ?? "",
      immediateActions: detail.data.incident.immediateActions ?? "",
    });
    if (controls.canReadHistory) {
      const historyResponse = await apiClient.get<{ history: Revision[] }>(
        `/centres/${centreId}/incidents/${incidentId}/history`,
      );
      setHistory(historyResponse.data.history);
    }
  }, [centreId, controls.canReadHistory, incidentId, updateForm]);

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

  async function action(
    name: "submit" | "review" | "return" | "approve" | "archive",
    body: Record<string, unknown> = {},
  ) {
    if (incident?.version === undefined) return;
    setRequestError(null);
    try {
      await mutateWithCsrf("post", `/centres/${centreId}/incidents/${incidentId}/${name}`, {
        version: incident.version,
        ...body,
      });
      setStatusMessage(`Incident ${name.replaceAll("_", " ")} action recorded.`);
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  }

  const updateDraft = updateForm.handleSubmit(async (values) => {
    if (incident?.version === undefined) return;
    try {
      await mutateWithCsrf("patch", `/centres/${centreId}/incidents/${incidentId}`, {
        ...values,
        version: incident.version,
      });
      setStatusMessage("Draft updated.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const acknowledge = acknowledgementForm.handleSubmit(async (values) => {
    if (incident?.childId === undefined) return;
    try {
      await mutateWithCsrf(
        "post",
        `/centres/${centreId}/children/${incident.childId}/incidents/${incidentId}/acknowledge`,
        { status: "ACKNOWLEDGED", comment: values.comment || null },
      );
      setStatusMessage("Receipt acknowledged. This records receipt, not agreement.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const amend = amendmentForm.handleSubmit(async (values) => {
    if (incident?.version === undefined) return;
    try {
      await mutateWithCsrf("post", `/centres/${centreId}/incidents/${incidentId}/amendments`, {
        version: incident.version,
        type: "CORRECTION",
        reason: values.reason,
        content: values.content,
        changedFields: [values.changedField],
        parentVisible: values.parentVisible,
      });
      amendmentForm.reset();
      setStatusMessage("Append-only amendment recorded.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  if (incident === null) {
    return (
      <section className="content-card" aria-labelledby="incident-loading-title">
        <h1 id="incident-loading-title">Incident record</h1>
        <ErrorSummary message={requestError} />
        <p>{requestError === null ? "Loading incident…" : "This record is unavailable."}</p>
        <Link to={`/incidents/centres/${centreId}`}>Return to incident records</Link>
      </section>
    );
  }

  return (
    <article className="content-card" aria-labelledby="incident-detail-title">
      <p className="eyebrow">Incident lifecycle record</p>
      <h1 id="incident-detail-title">{incident.incidentNumber ?? "Incident metadata"}</h1>
      <p>
        Severity {incident.severity}; status {incident.status.replaceAll("_", " ")}.
      </p>
      <nav className="section-navigation" aria-label="Incident navigation">
        <Link to={`/incidents/centres/${centreId}`}>Incident list</Link>
      </nav>
      <ErrorSummary message={requestError} />
      <p aria-live="polite">{statusMessage}</p>
      <dl className="detail-list">
        <div>
          <dt>Occurred</dt>
          <dd>{new Date(incident.occurredAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{incident.category.replaceAll("_", " ")}</dd>
        </div>
        {incident.location !== undefined && (
          <div>
            <dt>Location</dt>
            <dd>{incident.location}</dd>
          </div>
        )}
        {incident.description !== undefined && (
          <div>
            <dt>Factual description</dt>
            <dd>{incident.description}</dd>
          </div>
        )}
        {incident.injuryDetails && (
          <div>
            <dt>Injury details</dt>
            <dd>{incident.injuryDetails}</dd>
          </div>
        )}
        {incident.symptoms && (
          <div>
            <dt>Illness or wellbeing observations</dt>
            <dd>{incident.symptoms}</dd>
          </div>
        )}
        {incident.immediateActions !== undefined && (
          <div>
            <dt>Immediate actions</dt>
            <dd>{incident.immediateActions}</dd>
          </div>
        )}
        {incident.firstAid && (
          <div>
            <dt>First aid</dt>
            <dd>{incident.firstAid}</dd>
          </div>
        )}
        {incident.followUp && (
          <div>
            <dt>Approved follow-up</dt>
            <dd>{incident.followUp}</dd>
          </div>
        )}
      </dl>

      {controls.canEditDraft && incident.status === "DRAFT" && (
        <form className="auth-form" noValidate onSubmit={(event) => void updateDraft(event)}>
          <h2>Edit draft</h2>
          <label htmlFor="draft-location">Location</label>
          <input id="draft-location" {...updateForm.register("location")} />
          <FieldError message={updateForm.formState.errors.location?.message} />
          <label htmlFor="draft-description">Factual description</label>
          <textarea id="draft-description" rows={5} {...updateForm.register("description")} />
          <FieldError message={updateForm.formState.errors.description?.message} />
          <label htmlFor="draft-actions">Immediate actions</label>
          <textarea id="draft-actions" rows={4} {...updateForm.register("immediateActions")} />
          <FieldError message={updateForm.formState.errors.immediateActions?.message} />
          <button className="primary-button" type="submit">
            Save draft
          </button>
        </form>
      )}

      <section aria-labelledby="lifecycle-actions">
        <h2 className="section-heading" id="lifecycle-actions">
          Lifecycle actions
        </h2>
        <div className="table-actions">
          {controls.canSubmit && incident.status === "DRAFT" && (
            <button type="button" onClick={() => void action("submit")}>
              Submit for review
            </button>
          )}
          {controls.canReview && incident.status === "SUBMITTED" && (
            <button
              type="button"
              onClick={() => void action("review", { note: reviewForm.getValues("note") || null })}
            >
              Start Manager review
            </button>
          )}
          {controls.canApprove && incident.status === "UNDER_REVIEW" && (
            <button type="button" onClick={() => void action("approve")}>
              Approve report
            </button>
          )}
          {controls.canArchive && ["APPROVED", "AMENDED", "CLOSED"].includes(incident.status) && (
            <button type="button" onClick={() => void action("archive")}>
              Archive report
            </button>
          )}
        </div>
        {controls.canReview && ["SUBMITTED", "UNDER_REVIEW"].includes(incident.status) && (
          <form
            className="auth-form"
            noValidate
            onSubmit={(event) =>
              void returnForm.handleSubmit((values) => action("return", values))(event)
            }
          >
            <label htmlFor="return-note">Correction request</label>
            <textarea id="return-note" rows={3} {...returnForm.register("note")} />
            <FieldError message={returnForm.formState.errors.note?.message} />
            <button type="submit">Return for correction</button>
          </form>
        )}
      </section>

      {controls.canAcknowledge && incident.acknowledgement === null && (
        <form className="auth-form" noValidate onSubmit={(event) => void acknowledge(event)}>
          <h2>Parent acknowledgement</h2>
          <p>Acknowledgement records receipt of this report. It does not record agreement.</p>
          <label htmlFor="acknowledgement-comment">Optional comment</label>
          <textarea
            id="acknowledgement-comment"
            rows={3}
            {...acknowledgementForm.register("comment")}
          />
          <FieldError message={acknowledgementForm.formState.errors.comment?.message} />
          <button className="primary-button" type="submit">
            Acknowledge receipt
          </button>
        </form>
      )}

      {controls.canAmend &&
        ["APPROVED", "PARENT_ACKNOWLEDGED", "AMENDED", "CLOSED"].includes(incident.status) && (
          <form className="auth-form" noValidate onSubmit={(event) => void amend(event)}>
            <h2>Create immutable amendment</h2>
            <p>This action requires a recent MFA step-up and does not overwrite the original.</p>
            <label htmlFor="amendment-field">Corrected field</label>
            <select id="amendment-field" {...amendmentForm.register("changedField")}>
              <option value="description">Description</option>
              <option value="injuryDetails">Injury details</option>
              <option value="symptoms">Symptoms</option>
              <option value="immediateActions">Immediate actions</option>
              <option value="firstAid">First aid</option>
              <option value="followUp">Follow-up</option>
            </select>
            <label htmlFor="amendment-reason">Reason</label>
            <textarea id="amendment-reason" rows={3} {...amendmentForm.register("reason")} />
            <FieldError message={amendmentForm.formState.errors.reason?.message} />
            <label htmlFor="amendment-content">Corrected content</label>
            <textarea id="amendment-content" rows={4} {...amendmentForm.register("content")} />
            <FieldError message={amendmentForm.formState.errors.content?.message} />
            <label>
              <input type="checkbox" {...amendmentForm.register("parentVisible")} /> Show this
              amendment to authorised Parents
            </label>
            <button type="submit">Record amendment</button>
          </form>
        )}

      {controls.canReadHistory && (
        <section aria-labelledby="incident-history-title">
          <h2 className="section-heading" id="incident-history-title">
            Immutable history
          </h2>
          {history.length === 0 ? (
            <p>No lifecycle revisions are available.</p>
          ) : (
            <ol className="metadata-list">
              {history.map((revision) => (
                <li key={revision.id}>
                  <strong>
                    Revision {revision.revisionNumber}: {revision.type.replaceAll("_", " ")}
                  </strong>
                  <span>
                    Status {revision.statusAfter.replaceAll("_", " ")} ·{" "}
                    {new Date(revision.createdAt).toLocaleString()}
                  </span>
                  {revision.reason && <span>{revision.reason}</span>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => {
          void navigate(`/incidents/centres/${centreId}`);
        }}
      >
        Return to records
      </button>
    </article>
  );
}
