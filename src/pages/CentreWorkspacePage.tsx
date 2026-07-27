import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import { centreFormSchema, type CentreForm } from "../features/childcare/childcare.schemas";
import type { Centre } from "../features/childcare/childcare.types";

export function CentreWorkspacePage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const [centre, setCentre] = useState<Centre | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const canManage =
    access.status === "ready" && hasPermission(access.access, "centre.manage", centreId);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CentreForm>({ resolver: zodResolver(centreFormSchema) });

  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ centre: Centre }>(`/centres/${centreId}`)
      .then(({ data }) => {
        if (!current) return;
        setCentre(data.centre);
        reset({
          name: data.centre.name,
          slug: data.centre.slug,
          timezone: data.centre.timezone,
        });
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, [centreId, reset]);

  const submit = handleSubmit(async (values) => {
    if (centre === null) return;
    setRequestError(null);
    try {
      const data = await mutateWithCsrf<{ centre: Centre }>("patch", `/centres/${centreId}`, {
        ...values,
        version: centre.version,
      });
      setCentre(data.centre);
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <section className="content-card" aria-labelledby="centre-workspace-title">
      <p className="eyebrow">Centre workspace</p>
      <h1 id="centre-workspace-title">{centre?.name ?? "Loading centre"}</h1>
      <ErrorSummary message={requestError} />
      <nav aria-label="Centre records" className="section-navigation">
        <Link to={`/care/centres/${centreId}/rooms`}>Rooms</Link>
        <Link to={`/care/centres/${centreId}/children`}>Children</Link>
      </nav>
      {centre !== null && (
        <dl className="detail-list">
          <div>
            <dt>Status</dt>
            <dd>{centre.status}</dd>
          </div>
          <div>
            <dt>Timezone</dt>
            <dd>{centre.timezone}</dd>
          </div>
        </dl>
      )}
      {canManage && centre !== null && (
        <>
          <h2 className="section-heading">Edit centre profile</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
            <label htmlFor="edit-centre-name">Name</label>
            <input id="edit-centre-name" {...register("name")} />
            <FieldError message={errors.name?.message} />
            <label htmlFor="edit-centre-slug">URL slug</label>
            <input id="edit-centre-slug" {...register("slug")} />
            <FieldError message={errors.slug?.message} />
            <label htmlFor="edit-centre-timezone">IANA timezone</label>
            <input id="edit-centre-timezone" {...register("timezone")} />
            <FieldError message={errors.timezone?.message} />
            <button className="primary-button" disabled={isSubmitting} type="submit">
              Save centre
            </button>
          </form>
        </>
      )}
    </section>
  );
}
