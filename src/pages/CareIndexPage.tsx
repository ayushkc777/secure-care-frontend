import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { centreFormSchema, type CentreForm } from "../features/childcare/childcare.schemas";
import type { Centre, Pagination } from "../features/childcare/childcare.types";
import { useAccess } from "../features/access/useAccess";

export function CareIndexPage() {
  const access = useAccess();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const canCreate =
    access.status === "ready" && access.access.platformPermissions.includes("centre.manage");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CentreForm>({
    resolver: zodResolver(centreFormSchema),
    defaultValues: { timezone: "Europe/London" },
  });

  async function load() {
    const { data } = await apiClient.get<{ centres: Centre[]; pagination: Pagination }>(
      "/api/v1/centres",
    );
    setCentres(data.centres);
  }

  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ centres: Centre[] }>("/api/v1/centres")
      .then(({ data }) => {
        if (current) setCentres(data.centres);
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, []);

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await mutateWithCsrf("post", "/api/v1/centres", values);
      reset({ name: "", slug: "", timezone: "Europe/London" });
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <section className="content-card" aria-labelledby="care-title">
      <p className="eyebrow">Childcare records</p>
      <h1 id="care-title">Authorised centres</h1>
      <ErrorSummary message={requestError} />
      {centres.length === 0 ? (
        <p>No centres are available to your current access.</p>
      ) : (
        <ul className="record-grid">
          {centres.map((centre) => (
            <li key={centre.id}>
              <h2>{centre.name}</h2>
              <p>{centre.timezone}</p>
              <Link to={`/care/centres/${centre.id}`}>Open centre workspace</Link>
            </li>
          ))}
        </ul>
      )}
      {canCreate && (
        <>
          <h2 className="section-heading">Create centre</h2>
          <p>Creating a centre requires recent identity confirmation.</p>
          <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
            <label htmlFor="centre-name">Name</label>
            <input id="centre-name" {...register("name")} />
            <FieldError message={errors.name?.message} />
            <label htmlFor="centre-slug">URL slug</label>
            <input id="centre-slug" {...register("slug")} />
            <FieldError message={errors.slug?.message} />
            <label htmlFor="centre-timezone">IANA timezone</label>
            <input id="centre-timezone" {...register("timezone")} />
            <FieldError message={errors.timezone?.message} />
            <button className="primary-button" disabled={isSubmitting} type="submit">
              Create centre
            </button>
          </form>
        </>
      )}
    </section>
  );
}
