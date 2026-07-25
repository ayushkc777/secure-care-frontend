import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAuthFlow } from "../features/auth/useAuthFlow";
import { loginFormSchema, type LoginForm } from "../features/auth/auth.schemas";
import type { LoginResponse } from "../features/auth/auth.types";
import { useAccess } from "../features/access/useAccess";

export function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAccess();
  const { clearRecoveryCodes, clearSetup, setChallenge } = useAuthFlow();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginForm>({ resolver: zodResolver(loginFormSchema) });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      const result = await postWithCsrf<LoginResponse>("/api/v1/auth/login", values);
      clearRecoveryCodes();
      clearSetup();
      if (result.authenticationState === "MFA_REQUIRED") {
        setChallenge(result.challengeToken, result.expiresAt);
        void navigate("/mfa/verify");
        return;
      }
      await refresh();
      void navigate("/mfa/required");
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <AuthCard title="Sign in to SecureCare">
      <p>Use your verified account details. A second step is required when MFA is active.</p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="email">Email address</label>
        <input autoComplete="username" id="email" inputMode="email" {...register("email")} />
        <FieldError message={errors.email?.message} />

        <label htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          id="password"
          type="password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Checking details…" : "Continue securely"}
        </button>
      </form>
      <p className="supporting-link">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </AuthCard>
  );
}
