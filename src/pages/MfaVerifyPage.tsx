import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAuthFlow } from "../features/auth/useAuthFlow";
import { totpFormSchema, type TotpForm } from "../features/auth/auth.schemas";

export function MfaVerifyPage() {
  const navigate = useNavigate();
  const { challengeExpiresAt, challengeToken, clearChallenge } = useAuthFlow();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<TotpForm>({ resolver: zodResolver(totpFormSchema) });

  if (challengeToken === null) return <Navigate replace to="/login" />;

  const submit = handleSubmit(async ({ code }) => {
    setRequestError(null);
    try {
      await postWithCsrf("/api/v1/auth/mfa/verify", { challengeToken, code });
      clearChallenge();
      void navigate("/session");
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <AuthCard eyebrow="Two-step verification" title="Enter your authenticator code">
      <p>
        Enter the current six-digit code. This request expires{" "}
        {challengeExpiresAt === null
          ? "shortly"
          : new Date(challengeExpiresAt).toLocaleTimeString("en-GB")}
        .
      </p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="code">Six-digit code</label>
        <input
          autoComplete="one-time-code"
          className="code-input"
          id="code"
          inputMode="numeric"
          maxLength={6}
          {...register("code")}
        />
        <FieldError message={errors.code?.message} />
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Verifying…" : "Verify and sign in"}
        </button>
      </form>
      <p className="supporting-link">
        Cannot use your authenticator? <Link to="/mfa/recovery">Use a recovery code</Link>
      </p>
    </AuthCard>
  );
}
