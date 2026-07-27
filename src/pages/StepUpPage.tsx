import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { stepUpFormSchema, type StepUpForm } from "../features/auth/auth.schemas";

export function StepUpPage() {
  const navigate = useNavigate();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    control,
  } = useForm<StepUpForm>({
    defaultValues: { method: "totp" },
    resolver: zodResolver(stepUpFormSchema),
  });
  const method = useWatch({ control, name: "method" });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await postWithCsrf("/auth/step-up", values);
      void navigate("/mfa/manage");
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <AuthCard eyebrow="Sensitive action" title="Confirm it is you">
      <p>
        Enter your current password and a second factor. The server keeps this assurance for a short
        time.
      </p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="step-up-password">Current password</label>
        <input
          autoComplete="current-password"
          id="step-up-password"
          type="password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />

        <fieldset>
          <legend>Verification method</legend>
          <label className="radio-label">
            <input type="radio" value="totp" {...register("method")} />
            Authenticator code
          </label>
          <label className="radio-label">
            <input type="radio" value="recovery" {...register("method")} />
            Recovery code
          </label>
        </fieldset>

        <label htmlFor="step-up-code">
          {method === "totp" ? "Six-digit code" : "Recovery code"}
        </label>
        <input
          autoComplete={method === "totp" ? "one-time-code" : "off"}
          id="step-up-code"
          inputMode={method === "totp" ? "numeric" : "text"}
          {...register("code")}
        />
        <FieldError message={errors.code?.message} />
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Confirming…" : "Confirm identity"}
        </button>
      </form>
    </AuthCard>
  );
}
