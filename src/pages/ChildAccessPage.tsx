import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import {
  childAccessFormSchema,
  type ChildAccessForm,
} from "../features/access/role-assignment.schemas";
import { useAccess } from "../features/access/useAccess";

type AccessResult = {
  childId: string;
  centreId: string;
  permittedActions: string[];
  access: "granted";
};

export function ChildAccessPage() {
  const state = useAccess();
  const [result, setResult] = useState<AccessResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ChildAccessForm>({
    resolver: zodResolver(childAccessFormSchema),
    defaultValues: {
      centreId: state.status === "ready" ? (state.access.centres[0]?.centreId ?? "") : "",
      action: "child.read",
    },
  });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    setResult(null);
    try {
      const { data } = await apiClient.get<AccessResult>(
        `/api/v1/centres/${values.centreId}/children/${values.childId}/access`,
        { params: { action: values.action } },
      );
      setResult(data);
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <section className="content-card" aria-labelledby="child-access-title">
      <p className="eyebrow">Policy demonstration</p>
      <h1 id="child-access-title">Check child access</h1>
      <p>
        This endpoint returns identifiers and the permitted action only. It does not return child
        profile information.
      </p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="child-centre-id">Centre ID</label>
        <input id="child-centre-id" {...register("centreId")} />
        <FieldError message={errors.centreId?.message} />
        <label htmlFor="child-id">Child ID</label>
        <input id="child-id" {...register("childId")} />
        <FieldError message={errors.childId?.message} />
        <label htmlFor="child-action">Requested action</label>
        <select id="child-action" {...register("action")}>
          <option value="child.read">Read child access</option>
          <option value="incident.read">Read incidents</option>
          <option value="pickup_authorisation.manage">Manage pickup authorisation</option>
        </select>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          Check access
        </button>
      </form>
      {result !== null && (
        <div className="success-panel" role="status">
          Access granted for {result.permittedActions.join(", ")} at centre {result.centreId}.
        </div>
      )}
    </section>
  );
}
