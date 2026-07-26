import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { ConfirmDialog } from "../components/feedback/ConfirmDialog";
import { useAccess } from "../features/access/useAccess";
import type { ChildSummary, Pagination } from "../features/childcare/childcare.types";
import { PickupCodeReveal } from "../features/pickups/PickupCodeReveal";
import {
  pickupAuthorisationFormSchema,
  pickupEditFormSchema,
  pickupOverrideFormSchema,
  pickupVerificationFormSchema,
  type PickupAuthorisationForm,
  type PickupEditForm,
  type PickupOverrideForm,
  type PickupVerificationForm,
} from "../features/pickups/pickup.schemas";
import {
  pickupControls,
  type PickupAuthorisation,
  type PickupHistoryEntry,
  type PickupVerification,
} from "../features/pickups/pickup.types";

type RevealedCode = { code: string; expiresAt: string };

function localDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function serverDateTime(value: string): string {
  return new Date(value).toISOString();
}

export function PickupWorkspacePage() {
  const { centreId = "", childId = "" } = useParams();
  const access = useAccess();
  const permissions =
    access.status === "ready"
      ? pickupControls(access.access, centreId)
      : {
          canCreate: false,
          canUpdate: false,
          canRevoke: false,
          canVerify: false,
          canComplete: false,
          canOverride: false,
        };
  const [child, setChild] = useState<ChildSummary | null>(null);
  const [authorisations, setAuthorisations] = useState<PickupAuthorisation[]>([]);
  const [history, setHistory] = useState<PickupHistoryEntry[]>([]);
  const [editing, setEditing] = useState<PickupAuthorisation | null>(null);
  const [revoking, setRevoking] = useState<PickupAuthorisation | null>(null);
  const [revealedCode, setRevealedCode] = useState<RevealedCode | null>(null);
  const [verification, setVerification] = useState<PickupVerification | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const verificationResult = useRef<HTMLDivElement>(null);

  const createForm = useForm<PickupAuthorisationForm>({
    resolver: zodResolver(pickupAuthorisationFormSchema),
    defaultValues: {
      ownerParentEmail: "",
      displayName: "",
      relationshipLabel: "",
      phone: "",
      referenceNote: "",
      validFrom: "",
      validUntil: "",
      isRecurring: false,
      restrictions: "",
    },
  });
  const editForm = useForm<PickupEditForm>({ resolver: zodResolver(pickupEditFormSchema) });
  const verificationForm = useForm<PickupVerificationForm>({
    resolver: zodResolver(pickupVerificationFormSchema),
    defaultValues: { authorisationId: "", code: "", identityCheckMethod: "KNOWN_TO_CENTRE" },
  });
  const overrideForm = useForm<PickupOverrideForm>({
    resolver: zodResolver(pickupOverrideFormSchema),
    defaultValues: { authorisationId: "", reason: "" },
  });

  const clearCode = useCallback(() => setRevealedCode(null), []);

  const load = useCallback(async () => {
    const requests = [
      apiClient.get<{ child: ChildSummary }>(`/api/v1/centres/${centreId}/children/${childId}`),
      apiClient.get<{
        authorisations: PickupAuthorisation[];
        pagination: Pagination;
      }>(`/api/v1/centres/${centreId}/children/${childId}/pickup-authorisations`),
      apiClient.get<{ pickups: PickupHistoryEntry[]; pagination: Pagination }>(
        `/api/v1/centres/${centreId}/children/${childId}/pickup-history`,
      ),
    ] as const;
    const [childResponse, authorisationResponse, historyResponse] = await Promise.all(requests);
    setChild(childResponse.data.child);
    setAuthorisations(authorisationResponse.data.authorisations);
    setHistory(historyResponse.data.pickups);
  }, [centreId, childId]);

  useEffect(() => {
    let current = true;
    void Promise.resolve()
      .then(() => load())
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
      setRevealedCode(null);
      setVerification(null);
    };
  }, [load]);

  useEffect(() => {
    if (verification === null) return;
    const frame = requestAnimationFrame(() => verificationResult.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [verification]);

  const createAuthorisation = createForm.handleSubmit(async (values) => {
    setRequestError(null);
    try {
      let ownerParentUserId: string | undefined;
      if (permissions.canVerify) {
        const lookup = await apiClient.get<{ parents: { userId: string }[] }>(
          `/api/v1/centres/${centreId}/eligible-parents`,
          { params: { query: values.ownerParentEmail } },
        );
        ownerParentUserId = lookup.data.parents[0]?.userId;
        if (ownerParentUserId === undefined) {
          setRequestError("No eligible Parent account matched that email.");
          return;
        }
      }
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/children/${childId}/pickup-authorisations`,
        {
          ...(ownerParentUserId === undefined ? {} : { ownerParentUserId }),
          pickupPerson: {
            displayName: values.displayName,
            relationshipLabel: values.relationshipLabel,
            phone: values.phone,
            referenceNote: values.referenceNote || null,
          },
          validFrom: serverDateTime(values.validFrom),
          validUntil: serverDateTime(values.validUntil),
          isRecurring: values.isRecurring,
          restrictions: values.restrictions || null,
        },
      );
      createForm.reset();
      setStatusMessage("Pickup authorisation created.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  function beginEdit(authorisation: PickupAuthorisation) {
    setEditing(authorisation);
    editForm.reset({
      validFrom: localDateTime(authorisation.validFrom),
      validUntil: localDateTime(authorisation.validUntil ?? authorisation.validFrom),
      restrictions: authorisation.restrictions ?? "",
    });
  }

  const updateAuthorisation = editForm.handleSubmit(async (values) => {
    if (editing === null) return;
    setRequestError(null);
    try {
      await mutateWithCsrf(
        "patch",
        `/api/v1/centres/${centreId}/children/${childId}/pickup-authorisations/${editing.id}`,
        {
          validFrom: serverDateTime(values.validFrom),
          validUntil: serverDateTime(values.validUntil),
          restrictions: values.restrictions || null,
          version: editing.version,
        },
      );
      setEditing(null);
      setStatusMessage("Pickup authorisation updated.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  async function revokeAuthorisation() {
    if (revoking === null) return;
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/children/${childId}/pickup-authorisations/${revoking.id}/revoke`,
        { reasonCode: "PARENT_REQUEST", version: revoking.version },
      );
      setRevoking(null);
      setStatusMessage("Pickup authorisation revoked.");
      await load();
    } catch (error) {
      setRevoking(null);
      setRequestError(safeApiMessage(error));
    }
  }

  async function generateCode(authorisation: PickupAuthorisation) {
    clearCode();
    setRequestError(null);
    try {
      const response = await mutateWithCsrf<{
        challenge: RevealedCode & { verificationId: string };
      }>(
        "post",
        `/api/v1/centres/${centreId}/children/${childId}/pickup-authorisations/${authorisation.id}/code`,
      );
      setRevealedCode({ code: response.challenge.code, expiresAt: response.challenge.expiresAt });
      setStatusMessage("A new one-time code was generated. Any previous code is invalid.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  }

  const verifyPickup = verificationForm.handleSubmit(async (values) => {
    setVerification(null);
    setRequestError(null);
    try {
      const response = await mutateWithCsrf<{ verification: PickupVerification }>(
        "post",
        `/api/v1/centres/${centreId}/children/${childId}/pickup/verify`,
        values,
      );
      setVerification(response.verification);
      setStatusMessage("Pickup person verified. Complete pickup before this result expires.");
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  async function completePickup() {
    if (verification === null) return;
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/children/${childId}/pickup/complete`,
        { verificationId: verification.verificationId },
      );
      setVerification(null);
      verificationForm.reset();
      setStatusMessage("Authorised pickup completed.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  }

  const emergencyOverride = overrideForm.handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/children/${childId}/pickup/emergency-override`,
        values,
      );
      overrideForm.reset();
      setStatusMessage("Emergency pickup override recorded.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const activeAuthorisations = authorisations.filter(
    (authorisation) => authorisation.status === "ACTIVE",
  );

  return (
    <section className="content-card" aria-labelledby="pickup-workspace-title">
      <p className="eyebrow">Secure pickup workflow</p>
      <h1 id="pickup-workspace-title">{child?.displayName ?? "Pickup workspace"}</h1>
      <p>
        Codes establish possession of a short-lived secret. Staff must still check the approved
        person using the selected identity-check method.
      </p>
      <div className="section-navigation">
        <Link to="/pickup">Choose another child</Link>
        <Link to={`/care/centres/${centreId}/children/${childId}`}>Open child record</Link>
      </div>
      <ErrorSummary message={requestError} />
      <p className="success-panel" aria-live="polite">
        {statusMessage || "No pickup action has been completed in this browser view."}
      </p>

      <h2 className="section-heading">Pickup authorisations</h2>
      {authorisations.length === 0 ? (
        <p>No pickup authorisations are available.</p>
      ) : (
        <div className="responsive-table">
          <table>
            <caption>Authorised pickup people and permission state</caption>
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Period</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {authorisations.map((authorisation) => (
                <tr key={authorisation.id}>
                  <td>
                    <strong>{authorisation.pickupPerson.displayName}</strong>
                    <br />
                    {authorisation.pickupPerson.relationshipLabel}
                    {authorisation.pickupPerson.phone === undefined ? null : (
                      <>
                        <br />
                        {authorisation.pickupPerson.phone}
                      </>
                    )}
                  </td>
                  <td>
                    <time dateTime={authorisation.validFrom}>{authorisation.validFrom}</time>
                    <br />
                    to{" "}
                    <time dateTime={authorisation.validUntil ?? undefined}>
                      {authorisation.validUntil ?? "No end recorded"}
                    </time>
                    <br />
                    {authorisation.isRecurring ? "Recurring" : "One-time"}
                  </td>
                  <td>
                    {authorisation.status}
                    {authorisation.hasActiveCode ? " — code active" : ""}
                  </td>
                  <td>
                    <div className="table-actions">
                      {permissions.canUpdate && authorisation.status === "ACTIVE" && (
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => beginEdit(authorisation)}
                        >
                          Edit
                        </button>
                      )}
                      {permissions.canRevoke && authorisation.status === "ACTIVE" && (
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => setRevoking(authorisation)}
                        >
                          Revoke
                        </button>
                      )}
                      {permissions.canCreate && authorisation.status === "ACTIVE" && (
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => void generateCode(authorisation)}
                        >
                          Generate one-time code
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {revealedCode !== null && (
        <PickupCodeReveal
          code={revealedCode.code}
          expiresAt={revealedCode.expiresAt}
          onClear={clearCode}
        />
      )}

      {permissions.canCreate && (
        <>
          <h2 className="section-heading">Create pickup authorisation</h2>
          <form
            className="auth-form"
            noValidate
            onSubmit={(event) => void createAuthorisation(event)}
          >
            {permissions.canVerify && (
              <>
                <label htmlFor="pickup-parent-email">Authorising Parent email</label>
                <input
                  autoComplete="off"
                  id="pickup-parent-email"
                  type="email"
                  {...createForm.register("ownerParentEmail")}
                />
                <FieldError message={createForm.formState.errors.ownerParentEmail?.message} />
              </>
            )}
            <label htmlFor="pickup-person-name">Pickup person display name</label>
            <input
              autoComplete="off"
              id="pickup-person-name"
              {...createForm.register("displayName")}
            />
            <FieldError message={createForm.formState.errors.displayName?.message} />
            <label htmlFor="pickup-relationship">Relationship to child</label>
            <input id="pickup-relationship" {...createForm.register("relationshipLabel")} />
            <FieldError message={createForm.formState.errors.relationshipLabel?.message} />
            <label htmlFor="pickup-phone">Contact number</label>
            <input
              autoComplete="off"
              id="pickup-phone"
              inputMode="tel"
              placeholder="+441234567890"
              {...createForm.register("phone")}
            />
            <FieldError message={createForm.formState.errors.phone?.message} />
            <label htmlFor="pickup-reference-note">Reference note</label>
            <textarea
              id="pickup-reference-note"
              rows={3}
              {...createForm.register("referenceNote")}
            />
            <label htmlFor="pickup-valid-from">Valid from</label>
            <input
              id="pickup-valid-from"
              type="datetime-local"
              {...createForm.register("validFrom")}
            />
            <label htmlFor="pickup-valid-until">Valid until</label>
            <input
              id="pickup-valid-until"
              type="datetime-local"
              {...createForm.register("validUntil")}
            />
            <FieldError message={createForm.formState.errors.validUntil?.message} />
            <label className="radio-label">
              <input type="checkbox" {...createForm.register("isRecurring")} /> Recurring permission
            </label>
            <label htmlFor="pickup-restrictions">Optional restrictions</label>
            <textarea id="pickup-restrictions" rows={3} {...createForm.register("restrictions")} />
            <button
              className="primary-button"
              disabled={createForm.formState.isSubmitting}
              type="submit"
            >
              Create authorisation
            </button>
          </form>
        </>
      )}

      {editing !== null && permissions.canUpdate && (
        <>
          <h2 className="section-heading">Edit pickup authorisation</h2>
          <form
            className="auth-form"
            noValidate
            onSubmit={(event) => void updateAuthorisation(event)}
          >
            <label htmlFor="edit-pickup-valid-from">Valid from</label>
            <input
              id="edit-pickup-valid-from"
              type="datetime-local"
              {...editForm.register("validFrom")}
            />
            <label htmlFor="edit-pickup-valid-until">Valid until</label>
            <input
              id="edit-pickup-valid-until"
              type="datetime-local"
              {...editForm.register("validUntil")}
            />
            <FieldError message={editForm.formState.errors.validUntil?.message} />
            <label htmlFor="edit-pickup-restrictions">Restrictions</label>
            <textarea
              id="edit-pickup-restrictions"
              rows={3}
              {...editForm.register("restrictions")}
            />
            <div className="button-row">
              <button className="primary-button" type="submit">
                Save changes
              </button>
              <button className="secondary-button" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </>
      )}

      {permissions.canVerify && (
        <>
          <h2 className="section-heading">Verify pickup person</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void verifyPickup(event)}>
            <label htmlFor="verification-authorisation">Active authorisation</label>
            <select
              id="verification-authorisation"
              {...verificationForm.register("authorisationId")}
            >
              <option value="">Choose an authorisation</option>
              {activeAuthorisations.map((authorisation) => (
                <option key={authorisation.id} value={authorisation.id}>
                  {authorisation.pickupPerson.displayName}
                </option>
              ))}
            </select>
            <FieldError message={verificationForm.formState.errors.authorisationId?.message} />
            <label htmlFor="pickup-code">Ten-character pickup code</label>
            <input
              autoCapitalize="characters"
              autoComplete="one-time-code"
              className="code-input"
              id="pickup-code"
              spellCheck={false}
              {...verificationForm.register("code")}
            />
            <FieldError message={verificationForm.formState.errors.code?.message} />
            <label htmlFor="identity-check-method">Identity check completed</label>
            <select
              id="identity-check-method"
              {...verificationForm.register("identityCheckMethod")}
            >
              <option value="KNOWN_TO_CENTRE">Known to centre</option>
              <option value="PHYSICAL_ID_SIGHTED">Physical ID sighted</option>
              <option value="PHOTO_MATCH">Photo matched</option>
            </select>
            <button className="primary-button" type="submit">
              Verify pickup person
            </button>
          </form>
        </>
      )}

      {verification !== null && permissions.canComplete && (
        <div className="success-panel" ref={verificationResult} tabIndex={-1}>
          <h2>Verification succeeded</h2>
          <p>
            Approved person: {verification.pickupPerson.displayName}. Verification expires at{" "}
            <time dateTime={verification.expiresAt}>{verification.expiresAt}</time>.
          </p>
          <button
            className="primary-button standalone-button"
            type="button"
            onClick={() => void completePickup()}
          >
            Complete authorised pickup
          </button>
        </div>
      )}

      {permissions.canOverride && (
        <section className="danger-zone" aria-labelledby="pickup-override-title">
          <h2 id="pickup-override-title">Emergency pickup override</h2>
          <p>
            This action needs recent MFA and creates a high-severity security alert. It does not
            create or alter a normal authorisation.
          </p>
          <form
            className="auth-form"
            noValidate
            onSubmit={(event) => void emergencyOverride(event)}
          >
            <label htmlFor="override-authorisation">Pickup person record</label>
            <select id="override-authorisation" {...overrideForm.register("authorisationId")}>
              <option value="">Choose a pickup person</option>
              {authorisations.map((authorisation) => (
                <option key={authorisation.id} value={authorisation.id}>
                  {authorisation.pickupPerson.displayName} — {authorisation.status}
                </option>
              ))}
            </select>
            <FieldError message={overrideForm.formState.errors.authorisationId?.message} />
            <label htmlFor="override-reason">Mandatory emergency reason</label>
            <textarea id="override-reason" rows={5} {...overrideForm.register("reason")} />
            <FieldError message={overrideForm.formState.errors.reason?.message} />
            <button className="danger-button" type="submit">
              Record emergency override
            </button>
          </form>
        </section>
      )}

      <h2 className="section-heading">Pickup history</h2>
      {history.length === 0 ? (
        <p>No completed pickups are visible.</p>
      ) : (
        <ul className="metadata-list">
          {history.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.result === "VERIFIED" ? "Authorised pickup" : entry.result}</strong>
              <span>
                <time dateTime={entry.occurredAt}>{entry.occurredAt}</time>
              </span>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        confirmLabel="Revoke authorisation"
        description="Revocation takes effect immediately and invalidates active verification codes."
        onCancel={() => setRevoking(null)}
        onConfirm={() => void revokeAuthorisation()}
        open={revoking !== null}
        title="Revoke this pickup authorisation?"
      />
    </section>
  );
}
