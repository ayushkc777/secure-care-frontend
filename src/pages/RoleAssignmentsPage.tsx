import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import {
  administratorAssignmentFormSchema,
  centreRoleOptions,
  roleAssignmentFormSchema,
  type AdministratorAssignmentForm,
  type RoleAssignmentForm,
} from "../features/access/role-assignment.schemas";
import type { RoleAssignment } from "../features/access/role-assignment.types";
import { useAccess } from "../features/access/useAccess";

export function RoleAssignmentsPage({ platform = false }: { platform?: boolean }) {
  const { centreId } = useParams();
  const accessState = useAccess();
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const access = accessState.status === "ready" ? accessState.access : null;
  const permittedRoles = useMemo(
    () => (access === null ? [] : centreRoleOptions(access)),
    [access],
  );
  const endpoint = platform
    ? "/platform/role-assignments"
    : `/centres/${centreId ?? ""}/role-assignments`;

  const centreForm = useForm<RoleAssignmentForm>({
    resolver: zodResolver(roleAssignmentFormSchema(permittedRoles)),
    defaultValues: { roleCode: "EDUCATOR" },
  });
  const administratorForm = useForm<AdministratorAssignmentForm>({
    resolver: zodResolver(administratorAssignmentFormSchema),
  });

  const loadAssignments = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ assignments: RoleAssignment[] }>(endpoint);
      setAssignments(data.assignments);
      setRequestError(null);
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  }, [endpoint]);

  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ assignments: RoleAssignment[] }>(endpoint)
      .then(({ data }) => {
        if (current) setAssignments(data.assignments);
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, [endpoint]);

  const submitCentre = centreForm.handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await mutateWithCsrf("post", endpoint, values);
      centreForm.reset({ userId: "", roleCode: "EDUCATOR" });
      await loadAssignments();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const submitAdministrator = administratorForm.handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await mutateWithCsrf("post", endpoint, values);
      administratorForm.reset();
      await loadAssignments();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  async function changeStatus(assignment: RoleAssignment, status: "ACTIVE" | "SUSPENDED") {
    setBusyId(assignment.id);
    setRequestError(null);
    try {
      await mutateWithCsrf("patch", `${endpoint}/${assignment.id}`, {
        status,
        version: assignment.version,
      });
      await loadAssignments();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(assignment: RoleAssignment) {
    setBusyId(assignment.id);
    setRequestError(null);
    try {
      await mutateWithCsrf("delete", `${endpoint}/${assignment.id}`, {
        version: assignment.version,
      });
      await loadAssignments();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="content-card" aria-labelledby="role-assignment-title">
      <p className="eyebrow">{platform ? "Platform scope" : "Centre scope"}</p>
      <h1 id="role-assignment-title">Manage role assignments</h1>
      <p>
        {platform
          ? "Only Administrator assignments can be created here."
          : `Assignments are constrained to centre ${centreId ?? "unavailable"}.`}
      </p>
      <ErrorSummary message={requestError} />
      {requestError !== null && (
        <p className="supporting-link">
          Privileged changes may require <Link to="/mfa/step-up">recent identity confirmation</Link>
          .
        </p>
      )}

      <form
        className="auth-form assignment-form"
        noValidate
        onSubmit={(event) => void (platform ? submitAdministrator(event) : submitCentre(event))}
      >
        <label htmlFor="assignment-user-id">Target user ID</label>
        <input
          id="assignment-user-id"
          spellCheck={false}
          {...(platform ? administratorForm.register("userId") : centreForm.register("userId"))}
        />
        <FieldError
          message={
            platform
              ? administratorForm.formState.errors.userId?.message
              : centreForm.formState.errors.userId?.message
          }
        />
        {!platform && (
          <>
            <label htmlFor="assignment-role">Role</label>
            <select id="assignment-role" {...centreForm.register("roleCode")}>
              {permittedRoles.map((roleCode) => (
                <option key={roleCode} value={roleCode}>
                  {roleCode.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <FieldError message={centreForm.formState.errors.roleCode?.message} />
          </>
        )}
        <button
          className="primary-button"
          disabled={
            platform ? administratorForm.formState.isSubmitting : centreForm.formState.isSubmitting
          }
          type="submit"
        >
          Create assignment
        </button>
      </form>

      <div
        aria-label="Scrollable role assignments"
        className="responsive-table"
        role="region"
        tabIndex={0}
      >
        <table>
          <caption>Current non-deleted role assignments</caption>
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Controls</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.userId}</td>
                <td>{assignment.roleCode.replaceAll("_", " ")}</td>
                <td>{assignment.status}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="secondary-button"
                      disabled={busyId !== null}
                      onClick={() =>
                        void changeStatus(
                          assignment,
                          assignment.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                        )
                      }
                      type="button"
                    >
                      {assignment.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                    <button
                      className="danger-button"
                      disabled={busyId !== null}
                      onClick={() => void revoke(assignment)}
                      type="button"
                    >
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
