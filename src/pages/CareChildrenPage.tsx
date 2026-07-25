import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import { childFormSchema, type ChildForm } from "../features/childcare/childcare.schemas";
import type { ChildSummary } from "../features/childcare/childcare.types";

export function CareChildrenPage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const canCreate =
    access.status === "ready" && hasPermission(access.access, "child.create", centreId);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ChildForm>({
    resolver: zodResolver(childFormSchema),
    defaultValues: { preferredName: "", careNotes: "", enrolledAt: "" },
  });

  const load = useCallback(async () => {
    const { data } = await apiClient.get<{ children: ChildSummary[] }>(
      `/api/v1/centres/${centreId}/children`,
    );
    setChildren(data.children);
  }, [centreId]);

  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ children: ChildSummary[] }>(`/api/v1/centres/${centreId}/children`)
      .then(({ data }) => {
        if (current) setChildren(data.children);
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, [centreId]);

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/children`, {
        ...values,
        preferredName: values.preferredName || null,
        careNotes: values.careNotes || null,
        enrolledAt: values.enrolledAt || null,
      });
      reset({
        externalReference: "",
        firstName: "",
        lastName: "",
        preferredName: "",
        dateOfBirth: "",
        careNotes: "",
        enrolledAt: "",
      });
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <section className="content-card" aria-labelledby="children-title">
      <p className="eyebrow">Permission-filtered records</p>
      <h1 id="children-title">Children</h1>
      <p>Parents see only actively related children. Staff see only their authorised centre.</p>
      <ErrorSummary message={requestError} />
      {children.length === 0 ? (
        <p>No active child records are available.</p>
      ) : (
        <ul className="record-grid">
          {children.map((child) => (
            <li key={child.id}>
              <h2>{child.displayName || "Child record"}</h2>
              <p>{child.roomId === null ? "Not currently assigned to a room" : "Room assigned"}</p>
              <Link to={`/care/centres/${centreId}/children/${child.id}`}>View child record</Link>
            </li>
          ))}
        </ul>
      )}
      {canCreate && (
        <>
          <h2 className="section-heading">Create child record</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
            <label htmlFor="child-reference">Centre reference</label>
            <input id="child-reference" {...register("externalReference")} />
            <FieldError message={errors.externalReference?.message} />
            <label htmlFor="child-first-name">First name</label>
            <input autoComplete="off" id="child-first-name" {...register("firstName")} />
            <FieldError message={errors.firstName?.message} />
            <label htmlFor="child-last-name">Last name</label>
            <input autoComplete="off" id="child-last-name" {...register("lastName")} />
            <FieldError message={errors.lastName?.message} />
            <label htmlFor="child-preferred-name">Preferred name</label>
            <input autoComplete="off" id="child-preferred-name" {...register("preferredName")} />
            <FieldError message={errors.preferredName?.message} />
            <label htmlFor="child-date-of-birth">Date of birth</label>
            <input id="child-date-of-birth" type="date" {...register("dateOfBirth")} />
            <FieldError message={errors.dateOfBirth?.message} />
            <label htmlFor="child-enrolled-at">Enrolment date</label>
            <input id="child-enrolled-at" type="date" {...register("enrolledAt")} />
            <FieldError message={errors.enrolledAt?.message} />
            <label htmlFor="child-care-notes">Care information</label>
            <textarea id="child-care-notes" rows={4} {...register("careNotes")} />
            <FieldError message={errors.careNotes?.message} />
            <button className="primary-button" disabled={isSubmitting} type="submit">
              Create child
            </button>
          </form>
        </>
      )}
    </section>
  );
}
