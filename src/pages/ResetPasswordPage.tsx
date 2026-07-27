import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import {
  authTokenSchema,
  resetPasswordFormSchema,
  type ResetPasswordForm,
} from "../features/auth/auth.schemas";
import type { PasswordAuthenticationResponse } from "../features/auth/auth.types";
import { useAuthFlow } from "../features/auth/useAuthFlow";
import { useAccess } from "../features/access/useAccess";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = authTokenSchema.safeParse(searchParams.get("token"));
  const { setChallenge } = useAuthFlow();
  const { refresh } = useAccess();
  const [requestError, setRequestError] = useState<string | null>(
    token.success ? null : "This reset link is incomplete or invalid.",
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordFormSchema) });

  const submit = handleSubmit(async ({ confirmPassword: _confirmation, newPassword }) => {
    if (!token.success) return;
    setRequestError(null);
    try {
      const result = await postWithCsrf<PasswordAuthenticationResponse>("/auth/password/reset", {
        token: token.data,
        newPassword,
      });
      if (result.authenticationState === "MFA_REQUIRED") {
        setChallenge(result.challengeToken, result.expiresAt);
        void navigate("/mfa/verify", { replace: true });
        return;
      }
      await refresh();
      void navigate("/mfa/required", { replace: true });
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <AuthCard title="Choose a new password">
      <p>This one-time link is invalidated after a successful reset.</p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="reset-password">New password</label>
        <input
          aria-describedby="reset-password-guidance"
          autoComplete="new-password"
          id="reset-password"
          type="password"
          {...register("newPassword")}
        />
        <p className="field-help" id="reset-password-guidance">
          12–128 characters with uppercase, lowercase, number and special character.
        </p>
        <FieldError message={errors.newPassword?.message} />

        <label htmlFor="reset-confirm-password">Confirm new password</label>
        <input
          autoComplete="new-password"
          id="reset-confirm-password"
          type="password"
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
        <button className="primary-button" disabled={!token.success || isSubmitting} type="submit">
          {isSubmitting ? "Resetting password…" : "Reset password"}
        </button>
      </form>
      <p className="supporting-link">
        Need a new link? <Link to="/forgot-password">Request another</Link>
      </p>
    </AuthCard>
  );
}
