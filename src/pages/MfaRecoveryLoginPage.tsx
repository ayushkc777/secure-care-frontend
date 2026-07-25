import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAuthFlow } from "../features/auth/useAuthFlow";
import { recoveryFormSchema, type RecoveryForm } from "../features/auth/auth.schemas";
import { useAccess } from "../features/access/useAccess";

export function MfaRecoveryLoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAccess();
  const { challengeToken, clearChallenge } = useAuthFlow();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RecoveryForm>({ resolver: zodResolver(recoveryFormSchema) });

  if (challengeToken === null) return <Navigate replace to="/login" />;

  const submit = handleSubmit(async ({ recoveryCode }) => {
    setRequestError(null);
    try {
      await postWithCsrf("/api/v1/auth/mfa/recovery/verify", {
        challengeToken,
        recoveryCode,
      });
      clearChallenge();
      await refresh();
      void navigate("/session");
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <AuthCard eyebrow="Account recovery" title="Use a recovery code">
      <p>Each recovery code works once. Use your authenticator when it is available.</p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="recovery-code">Recovery code</label>
        <input
          autoComplete="off"
          className="recovery-input"
          id="recovery-code"
          spellCheck={false}
          {...register("recoveryCode")}
        />
        <FieldError message={errors.recoveryCode?.message} />
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Verifying…" : "Use recovery code"}
        </button>
      </form>
      <p className="supporting-link">
        <Link to="/mfa/verify">Use an authenticator code instead</Link>
      </p>
    </AuthCard>
  );
}
