import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import type { ChildSummary, Pagination } from "../features/childcare/childcare.types";
import {
  incidentCategories,
  incidentFormSchema,
  incidentSeverities,
  type IncidentForm,
} from "../features/incidents/incident.schemas";
import { incidentControls, type Incident } from "../features/incidents/incident.types";

function toServerDate(value: string): string {
  return new Date(value).toISOString();
}

export function IncidentWorkspacePage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const controls =
    access.status === "ready"
      ? incidentControls(access.access, centreId)
      : {
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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<IncidentForm>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      childId: "",
      category: "ACCIDENT",
      severity: "LOW",
      occurredAt: "",
      location: "",
      description: "",
      injuryDetails: "",
      symptoms: "",
      immediateActions: "",
      firstAid: "",
      emergencyServicesContacted: false,
      parentContacted: false,
      safeguardingNarrative: "",
    },
  });
  const safeguarding = useWatch({ control, name: "category" }) === "SAFEGUARDING_CONCERN";

  const load = useCallback(async () => {
    const incidentRequest = apiClient.get<{ incidents: Incident[]; pagination: Pagination }>(
      `/api/v1/centres/${centreId}/incidents`,
    );
    const childRequest = controls.canCreate
      ? apiClient.get<{ children: ChildSummary[] }>(`/api/v1/centres/${centreId}/children`)
      : Promise.resolve({ data: { children: [] as ChildSummary[] } });
    const [incidentResponse, childResponse] = await Promise.all([incidentRequest, childRequest]);
    setIncidents(incidentResponse.data.incidents);
    setChildren(childResponse.data.children);
  }, [centreId, controls.canCreate]);

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

  const create = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/incidents`, {
        childId: values.childId,
        category: values.category,
        severity: values.severity,
        occurredAt: toServerDate(values.occurredAt),
        location: values.location,
        description: values.description,
        injuryDetails: values.injuryDetails || null,
        symptoms: values.symptoms || null,
        immediateActions: values.immediateActions,
        firstAid: values.firstAid || null,
        emergencyServicesContacted: values.emergencyServicesContacted,
        parentContacted: values.parentContacted,
        witnesses: [],
        ...(values.category === "SAFEGUARDING_CONCERN"
          ? {
              safeguarding: {
                classification: values.safeguardingClassification,
                narrative: values.safeguardingNarrative,
              },
            }
          : {}),
      });
      reset();
      setStatusMessage("Incident draft created.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <section className="content-card" aria-labelledby="incident-workspace-title">
      <p className="eyebrow">Centre-scoped records</p>
      <h1 id="incident-workspace-title">Incident records</h1>
      <nav className="section-navigation" aria-label="Incident record sections">
        <Link to="/incidents">All available centres</Link>
        {controls.canReadSafeguarding && (
          <Link to={`/incidents/centres/${centreId}/safeguarding`}>
            Restricted safeguarding concerns
          </Link>
        )}
      </nav>
      <ErrorSummary message={requestError} />
      <p aria-live="polite">{statusMessage}</p>

      <h2 className="section-heading">Available records</h2>
      {incidents.length === 0 ? (
        <p>No incident records match your access.</p>
      ) : (
        <ul className="record-grid">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <h3>{incident.incidentNumber ?? "Incident lifecycle record"}</h3>
              <p>
                {incident.category.replaceAll("_", " ")} · Severity {incident.severity} · Status{" "}
                {incident.status.replaceAll("_", " ")}
              </p>
              <Link to={`/incidents/centres/${centreId}/${incident.id}`}>View record</Link>
            </li>
          ))}
        </ul>
      )}

      {controls.canCreate && (
        <>
          <h2 className="section-heading">Create incident draft</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void create(event)}>
            <label htmlFor="incident-child">Child</label>
            <select id="incident-child" {...register("childId")}>
              <option value="">Select a child</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.displayName || "Child record"}
                </option>
              ))}
            </select>
            <FieldError message={errors.childId?.message} />
            <label htmlFor="incident-category">Category</label>
            <select id="incident-category" {...register("category")}>
              {incidentCategories.map((category) => (
                <option key={category} value={category}>
                  {category.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <label htmlFor="incident-severity">Severity</label>
            <select id="incident-severity" {...register("severity")}>
              {incidentSeverities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
            <label htmlFor="incident-occurred-at">Occurrence date and time</label>
            <input id="incident-occurred-at" type="datetime-local" {...register("occurredAt")} />
            <FieldError message={errors.occurredAt?.message} />
            <label htmlFor="incident-location">Location</label>
            <input id="incident-location" autoComplete="off" {...register("location")} />
            <FieldError message={errors.location?.message} />
            <label htmlFor="incident-description">Factual description</label>
            <textarea id="incident-description" rows={5} {...register("description")} />
            <FieldError message={errors.description?.message} />
            <label htmlFor="incident-injury">Injury details</label>
            <textarea id="incident-injury" rows={3} {...register("injuryDetails")} />
            <label htmlFor="incident-symptoms">Illness or wellbeing observations</label>
            <textarea id="incident-symptoms" rows={3} {...register("symptoms")} />
            <label htmlFor="incident-actions">Immediate actions taken</label>
            <textarea id="incident-actions" rows={4} {...register("immediateActions")} />
            <FieldError message={errors.immediateActions?.message} />
            <label htmlFor="incident-first-aid">First aid provided</label>
            <textarea id="incident-first-aid" rows={3} {...register("firstAid")} />
            <label>
              <input type="checkbox" {...register("emergencyServicesContacted")} /> Emergency
              services contacted
            </label>
            <label>
              <input type="checkbox" {...register("parentContacted")} /> Parent contacted
            </label>
            {safeguarding && (
              <fieldset>
                <legend>Restricted safeguarding details</legend>
                <label htmlFor="safeguarding-classification">Classification</label>
                <select
                  id="safeguarding-classification"
                  {...register("safeguardingClassification")}
                >
                  <option value="">Select a classification</option>
                  <option value="INTERNAL_CONCERN">Internal concern</option>
                  <option value="IMMEDIATE_RISK">Immediate risk</option>
                  <option value="DISCLOSURE">Disclosure</option>
                  <option value="PATTERN_OF_CONCERN">Pattern of concern</option>
                  <option value="OTHER">Other</option>
                </select>
                <label htmlFor="safeguarding-narrative">Restricted narrative</label>
                <textarea
                  id="safeguarding-narrative"
                  rows={5}
                  {...register("safeguardingNarrative")}
                />
                <FieldError message={errors.safeguardingNarrative?.message} />
              </fieldset>
            )}
            <button className="primary-button" disabled={isSubmitting} type="submit">
              Create draft
            </button>
          </form>
        </>
      )}
    </section>
  );
}
