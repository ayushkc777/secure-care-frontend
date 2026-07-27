import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import {
  administrationFormSchema,
  amendmentFormSchema,
  healthProfileFormSchema,
  medicationFormSchema,
  type AdministrationForm,
  type AmendmentForm,
  type HealthProfileForm,
  type MedicationForm,
  type MedicationFormInput,
} from "../features/health/health.schemas";
import {
  allergySeverities,
  healthControls,
  medicationOutcomes,
  type HealthProfile,
  type Medication,
} from "../features/health/health.types";

const emptyProfile: HealthProfileForm = {
  allergySeverity: "NONE",
  allergies: "",
  allergyTriggers: "",
  emergencyInstructions: "",
  dietaryRestrictions: "",
  medicalConditions: "",
  healthAlert: "",
  hasActiveHealthAlert: false,
  correctionReason: "",
};

function optional(value: string): string | null {
  return value.length === 0 ? null : value;
}

function serverTimestamp(value: string): string {
  return new Date(value).toISOString();
}

export function HealthWorkspacePage() {
  const { centreId = "", childId = "" } = useParams();
  const access = useAccess();
  const controls =
    access.status === "ready"
      ? healthControls(access.access, centreId)
      : {
          canRead: false,
          canManageProfile: false,
          canCreateMedication: false,
          canParentAuthorise: false,
          canApprove: false,
          canAdminister: false,
          canSuspend: false,
          canCorrect: false,
          canReadHistory: false,
        };
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const selected = medications.find(({ id }) => id === selectedId) ?? null;

  const profileForm = useForm<HealthProfileForm>({
    resolver: zodResolver(healthProfileFormSchema),
    defaultValues: emptyProfile,
  });
  const medicationForm = useForm<MedicationFormInput, unknown, MedicationForm>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      medicationName: "",
      dosage: "",
      instructions: "",
      scheduleTimes: "09:00",
      administrationWindowMinutes: 30,
      validFrom: "",
      expiresAt: "",
      highRisk: false,
    },
  });
  const administrationForm = useForm<AdministrationForm>({
    resolver: zodResolver(administrationFormSchema),
    defaultValues: {
      scheduledFor: "",
      outcome: "ADMINISTERED",
      dosage: "",
      reason: "",
      note: "",
      scheduleOverride: false,
      overrideReason: "",
    },
  });
  const amendmentForm = useForm<AmendmentForm>({
    resolver: zodResolver(amendmentFormSchema),
    defaultValues: { reason: "", correctedContent: "", medicationError: false },
  });

  const load = useCallback(async () => {
    const [profileResponse, medicationResponse] = await Promise.all([
      apiClient.get<{ healthProfile: HealthProfile | null }>(
        `/centres/${centreId}/children/${childId}/health`,
      ),
      apiClient.get<{ medications: Medication[] }>(
        `/centres/${centreId}/children/${childId}/medications`,
      ),
    ]);
    setProfile(profileResponse.data.healthProfile);
    setMedications(medicationResponse.data.medications);
    if (selectedId !== null) {
      const detail = await apiClient.get<{ medication: Medication }>(
        `/centres/${centreId}/children/${childId}/medications/${selectedId}`,
      );
      setMedications((items) =>
        items.map((item) => (item.id === selectedId ? detail.data.medication : item)),
      );
    }
    const value = profileResponse.data.healthProfile;
    profileForm.reset(
      value === null
        ? emptyProfile
        : {
            allergySeverity: value.allergySeverity,
            allergies: value.allergies ?? "",
            allergyTriggers: value.allergyTriggers ?? "",
            emergencyInstructions: value.emergencyInstructions ?? "",
            dietaryRestrictions: value.dietaryRestrictions ?? "",
            medicalConditions: value.medicalConditions ?? "",
            healthAlert: value.healthAlert ?? "",
            hasActiveHealthAlert: value.hasActiveHealthAlert,
            correctionReason: "",
          },
    );
  }, [centreId, childId, profileForm, selectedId]);

  useEffect(() => {
    let current = true;
    void Promise.resolve()
      .then(() => load())
      .catch((error: unknown) => current && setRequestError(safeApiMessage(error)));
    return () => {
      current = false;
    };
  }, [load]);

  const saveProfile = profileForm.handleSubmit(async (values) => {
    try {
      await mutateWithCsrf("put", `/centres/${centreId}/children/${childId}/health`, {
        allergySeverity: values.allergySeverity,
        allergies: optional(values.allergies),
        allergyTriggers: optional(values.allergyTriggers),
        emergencyInstructions: optional(values.emergencyInstructions),
        dietaryRestrictions: optional(values.dietaryRestrictions),
        medicalConditions: optional(values.medicalConditions),
        healthAlert: optional(values.healthAlert),
        hasActiveHealthAlert: values.hasActiveHealthAlert,
        ...(profile === null ? {} : { version: profile.version }),
        ...(values.correctionReason.length === 0
          ? {}
          : { correctionReason: values.correctionReason }),
      });
      setStatusMessage("Health profile saved.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const createMedication = medicationForm.handleSubmit(async (values) => {
    try {
      const response = await mutateWithCsrf<{ medication: Medication }>(
        "post",
        `/centres/${centreId}/children/${childId}/medications`,
        {
          ...values,
          validFrom: serverTimestamp(values.validFrom),
          expiresAt: serverTimestamp(values.expiresAt),
        },
      );
      setSelectedId(response.medication.id);
      medicationForm.reset({
        medicationName: "",
        dosage: "",
        instructions: "",
        scheduleTimes: "09:00",
        administrationWindowMinutes: 30,
        validFrom: "",
        expiresAt: "",
        highRisk: false,
      });
      setStatusMessage("Medication authorisation draft created.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  async function lifecycle(action: string, reason?: string) {
    if (selected === null) return;
    try {
      await mutateWithCsrf(
        "post",
        `/centres/${centreId}/children/${childId}/medications/${selected.id}/${action}`,
        { version: selected.version, ...(reason === undefined ? {} : { reason }) },
      );
      setStatusMessage(`Medication ${action.replaceAll("-", " ")} recorded.`);
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  }

  const administer = administrationForm.handleSubmit(async (values) => {
    if (selected === null) return;
    try {
      await mutateWithCsrf(
        "post",
        `/centres/${centreId}/children/${childId}/medications/${selected.id}/administrations`,
        {
          ...values,
          version: selected.version,
          scheduledFor: serverTimestamp(values.scheduledFor),
          dosage: optional(values.dosage),
          reason: optional(values.reason),
          note: optional(values.note),
          overrideReason: optional(values.overrideReason),
        },
      );
      administrationForm.reset();
      setStatusMessage("Medication administration outcome recorded.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const amend = amendmentForm.handleSubmit(async (values) => {
    if (selected === null) return;
    try {
      await mutateWithCsrf(
        "post",
        `/centres/${centreId}/children/${childId}/medications/${selected.id}/amendments`,
        { ...values, medicationError: false, version: selected.version },
      );
      amendmentForm.reset();
      setStatusMessage("Append-only medication amendment recorded.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  async function amendAdministration(administrationId: string, version: number) {
    if (selected === null) return;
    const values = amendmentForm.getValues();
    const parsed = amendmentFormSchema.safeParse(values);
    if (!parsed.success) {
      setRequestError("Complete the correction form before selecting an administration.");
      return;
    }
    try {
      await mutateWithCsrf(
        "post",
        `/centres/${centreId}/children/${childId}/medications/${selected.id}/administrations/${administrationId}/amendments`,
        { ...parsed.data, version },
      );
      amendmentForm.reset();
      setStatusMessage("Append-only administration amendment recorded.");
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  }

  return (
    <section className="content-card" aria-labelledby="health-workspace-title">
      <p className="eyebrow">Restricted child record</p>
      <h1 id="health-workspace-title">Health and medication record</h1>
      <nav className="section-navigation" aria-label="Health record sections">
        <Link to={`/health/centres/${centreId}`}>Choose another child</Link>
        <Link to={`/attendance/centres/${centreId}/children/${childId}`}>Attendance history</Link>
      </nav>
      <ErrorSummary message={requestError} />
      <p aria-live="polite">{statusMessage}</p>

      <h2 className="section-heading">Health summary</h2>
      {profile === null ? (
        <p>No health profile is recorded.</p>
      ) : (
        <dl className="detail-list">
          <div>
            <dt>Allergy alert</dt>
            <dd>
              {profile.allergySeverity.replaceAll("_", " ")}
              {profile.healthAlert ? ` — ${profile.healthAlert}` : ""}
            </dd>
          </div>
          <div>
            <dt>Emergency instructions</dt>
            <dd>{profile.emergencyInstructions ?? "Not provided"}</dd>
          </div>
          <div>
            <dt>Dietary restrictions</dt>
            <dd>{profile.dietaryRestrictions ?? "Not provided"}</dd>
          </div>
          {profile.medicalConditions !== undefined && (
            <div>
              <dt>Medical conditions</dt>
              <dd>{profile.medicalConditions ?? "Not provided"}</dd>
            </div>
          )}
        </dl>
      )}

      {controls.canManageProfile && (
        <>
          <h2 className="section-heading">Update health profile</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void saveProfile(event)}>
            <label htmlFor="allergy-severity">Allergy severity</label>
            <select id="allergy-severity" {...profileForm.register("allergySeverity")}>
              {allergySeverities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <label htmlFor="allergies">Allergies</label>
            <textarea id="allergies" rows={3} {...profileForm.register("allergies")} />
            <FieldError message={profileForm.formState.errors.allergies?.message} />
            <label htmlFor="allergy-triggers">Triggers</label>
            <textarea id="allergy-triggers" rows={3} {...profileForm.register("allergyTriggers")} />
            <label htmlFor="emergency-instructions">Emergency instructions</label>
            <textarea
              id="emergency-instructions"
              rows={3}
              {...profileForm.register("emergencyInstructions")}
            />
            <label htmlFor="dietary-restrictions">Dietary restrictions</label>
            <textarea
              id="dietary-restrictions"
              rows={3}
              {...profileForm.register("dietaryRestrictions")}
            />
            <label htmlFor="medical-conditions">Medical conditions</label>
            <textarea
              id="medical-conditions"
              rows={3}
              {...profileForm.register("medicalConditions")}
            />
            <label htmlFor="health-alert">Concise staff health alert</label>
            <textarea id="health-alert" rows={2} {...profileForm.register("healthAlert")} />
            <label>
              <input type="checkbox" {...profileForm.register("hasActiveHealthAlert")} /> Active
              health alert
            </label>
            {profile !== null && (
              <>
                <label htmlFor="health-correction-reason">Reason for changing this record</label>
                <textarea
                  id="health-correction-reason"
                  rows={2}
                  {...profileForm.register("correctionReason")}
                />
              </>
            )}
            <button className="primary-button" type="submit">
              Save health profile
            </button>
          </form>
        </>
      )}

      <h2 className="section-heading">Medication authorisations and schedule</h2>
      <ul className="record-grid">
        {medications.map((medication) => (
          <li key={medication.id}>
            <h3>{medication.medicationName ?? "Restricted medication lifecycle record"}</h3>
            <p>
              {medication.status.replaceAll("_", " ")} · Expires{" "}
              {new Date(medication.expiresAt).toLocaleDateString()}
            </p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setSelectedId(medication.id)}
            >
              View workflow
            </button>
          </li>
        ))}
      </ul>

      {controls.canCreateMedication && (
        <>
          <h2 className="section-heading">Create medication authorisation</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void createMedication(event)}>
            <label htmlFor="medication-name">Medication name</label>
            <input
              id="medication-name"
              autoComplete="off"
              {...medicationForm.register("medicationName")}
            />
            <FieldError message={medicationForm.formState.errors.medicationName?.message} />
            <label htmlFor="medication-dosage">Authorised dosage</label>
            <input
              id="medication-dosage"
              autoComplete="off"
              {...medicationForm.register("dosage")}
            />
            <label htmlFor="medication-instructions">Administration instructions</label>
            <textarea
              id="medication-instructions"
              rows={3}
              {...medicationForm.register("instructions")}
            />
            <label htmlFor="medication-schedule">Schedule times (comma separated HH:mm)</label>
            <input
              id="medication-schedule"
              placeholder="09:00, 13:00"
              {...medicationForm.register("scheduleTimes")}
            />
            <FieldError message={medicationForm.formState.errors.scheduleTimes?.message} />
            <label htmlFor="medication-window">Administration window in minutes</label>
            <input
              id="medication-window"
              type="number"
              {...medicationForm.register("administrationWindowMinutes")}
            />
            <label htmlFor="medication-valid-from">Valid from</label>
            <input
              id="medication-valid-from"
              type="datetime-local"
              {...medicationForm.register("validFrom")}
            />
            <label htmlFor="medication-expires">Expires at</label>
            <input
              id="medication-expires"
              type="datetime-local"
              {...medicationForm.register("expiresAt")}
            />
            <FieldError message={medicationForm.formState.errors.expiresAt?.message} />
            <label>
              <input type="checkbox" {...medicationForm.register("highRisk")} /> High-risk
              medication
            </label>
            <button className="primary-button" type="submit">
              Create draft
            </button>
          </form>
        </>
      )}

      {selected !== null && (
        <>
          <h2 className="section-heading">Selected medication workflow</h2>
          <p>
            <strong>{selected.medicationName ?? "Restricted medication record"}</strong> —{" "}
            {selected.status.replaceAll("_", " ")}
          </p>
          {selected.scheduleTimes && <p>Schedule: {selected.scheduleTimes.join(", ")}</p>}
          <div className="button-row" aria-label="Medication lifecycle actions">
            {controls.canParentAuthorise && selected.status === "DRAFT" && (
              <button type="button" onClick={() => void lifecycle("parent-authorise")}>
                Parent authorise
              </button>
            )}
            {controls.canApprove && selected.status === "PARENT_AUTHORISED" && (
              <button type="button" onClick={() => void lifecycle("approve")}>
                Manager approve
              </button>
            )}
            {controls.canApprove && selected.status === "MANAGER_APPROVED" && (
              <button type="button" onClick={() => void lifecycle("activate")}>
                Activate
              </button>
            )}
            {controls.canSuspend && selected.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() =>
                  void lifecycle("suspend", "Suspended after an authorised clinical review.")
                }
              >
                Suspend
              </button>
            )}
            {controls.canSuspend &&
              ["PARENT_AUTHORISED", "MANAGER_APPROVED", "ACTIVE", "SUSPENDED"].includes(
                selected.status,
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    void lifecycle(
                      "discontinue",
                      "Discontinued following an authorised instruction.",
                    )
                  }
                >
                  Discontinue
                </button>
              )}
          </div>

          {controls.canAdminister && selected.status === "ACTIVE" && (
            <form className="auth-form" noValidate onSubmit={(event) => void administer(event)}>
              <h3>Record administration outcome</h3>
              <label htmlFor="administration-time">Scheduled date and time</label>
              <input
                id="administration-time"
                type="datetime-local"
                {...administrationForm.register("scheduledFor")}
              />
              <label htmlFor="administration-outcome">Outcome</label>
              <select id="administration-outcome" {...administrationForm.register("outcome")}>
                {medicationOutcomes.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <label htmlFor="administered-dosage">Dosage administered</label>
              <input
                id="administered-dosage"
                autoComplete="off"
                {...administrationForm.register("dosage")}
              />
              <label htmlFor="administration-reason">Outcome reason</label>
              <textarea
                id="administration-reason"
                rows={2}
                {...administrationForm.register("reason")}
              />
              <FieldError message={administrationForm.formState.errors.reason?.message} />
              <label htmlFor="administration-note">Factual note</label>
              <textarea
                id="administration-note"
                rows={2}
                {...administrationForm.register("note")}
              />
              <label>
                <input type="checkbox" {...administrationForm.register("scheduleOverride")} />{" "}
                Outside-schedule override
              </label>
              <label htmlFor="override-reason">Override reason</label>
              <textarea
                id="override-reason"
                rows={2}
                {...administrationForm.register("overrideReason")}
              />
              <FieldError message={administrationForm.formState.errors.overrideReason?.message} />
              <button className="primary-button" type="submit">
                Record outcome
              </button>
            </form>
          )}

          {controls.canReadHistory && (
            <>
              <h3>Administration and amendment history</h3>
              <ul className="record-grid">
                {(selected.administrations ?? []).map((administration) => (
                  <li key={administration.id}>
                    <p>
                      {administration.outcome.replaceAll("_", " ")} —{" "}
                      {new Date(administration.scheduledFor).toLocaleString()}
                    </p>
                    {administration.scheduleOverride && <p>Documented schedule override</p>}
                    {controls.canCorrect && (
                      <button
                        type="button"
                        onClick={() =>
                          void amendAdministration(administration.id, administration.version)
                        }
                      >
                        Apply correction form to this administration
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {controls.canCorrect && (
            <form className="auth-form" noValidate onSubmit={(event) => void amend(event)}>
              <h3>Append-only correction or amendment</h3>
              <label htmlFor="amendment-reason">Correction reason</label>
              <textarea id="amendment-reason" rows={2} {...amendmentForm.register("reason")} />
              <FieldError message={amendmentForm.formState.errors.reason?.message} />
              <label htmlFor="corrected-content">Corrected factual content</label>
              <textarea
                id="corrected-content"
                rows={3}
                {...amendmentForm.register("correctedContent")}
              />
              <label>
                <input type="checkbox" {...amendmentForm.register("medicationError")} />{" "}
                Medication-error amendment
              </label>
              <button className="primary-button" type="submit">
                Append medication correction
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
