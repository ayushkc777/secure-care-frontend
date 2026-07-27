import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { changePasswordFormSchema, type ChangePasswordForm } from "../features/auth/auth.schemas";
import { useAccess } from "../features/access/useAccess";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { refresh } = useAccess();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordFormSchema) });

  const submit = handleSubmit(
    async ({ confirmPassword: _confirmation, currentPassword, newPassword }) => {
      setRequestError(null);
      try {
        await postWithCsrf("/auth/password/change", { currentPassword, newPassword });
        await refresh();
        void navigate("/session", { replace: true });
      } catch (error) {
        setRequestError(safeApiMessage(error));
      }
    },
  );

  return (
    <AuthCard title="Change your password">
      <p>Changing your password revokes your other active sessions.</p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="current-password">Current password</label>
        <input
          autoComplete="current-password"
          id="current-password"
          type="password"
          {...register("currentPassword")}
        />
        <FieldError message={errors.currentPassword?.message} />

        <label htmlFor="change-password">New password</label>
        <input
          aria-describedby="change-password-guidance"
          autoComplete="new-password"
          id="change-password"
          type="password"
          {...register("newPassword")}
        />
        <p className="field-help" id="change-password-guidance">
          12–128 characters with uppercase, lowercase, number and special character.
        </p>
        <FieldError message={errors.newPassword?.message} />

        <label htmlFor="change-confirm-password">Confirm new password</label>
        <input
          autoComplete="new-password"
          id="change-confirm-password"
          type="password"
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Changing password…" : "Change password"}
        </button>
      </form>
    </AuthCard>
  );
}
