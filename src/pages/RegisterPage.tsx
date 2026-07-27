import { zodResolver } from "@hookform/resolvers/zod";
import { zxcvbn } from "@zxcvbn-ts/core";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { registerFormSchema, type RegisterForm } from "../features/auth/auth.schemas";

export function RegisterPage() {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterForm>({ resolver: zodResolver(registerFormSchema) });
  const password = useWatch({ control, name: "password", defaultValue: "" });
  const strength = useMemo(() => (password.length === 0 ? null : zxcvbn(password)), [password]);

  const submit = handleSubmit(async ({ confirmPassword: _confirmation, ...values }) => {
    setRequestError(null);
    try {
      await postWithCsrf("/auth/register", values);
      setCompleted(true);
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  if (completed) {
    return (
      <AuthCard title="Check your email">
        <p role="status">
          If the registration can be processed, verification instructions will be provided.
        </p>
        <p className="supporting-link">
          Already verified? <Link to="/login">Sign in</Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create a SecureCare account">
      <p>Use an address you can verify and a unique password you do not use elsewhere.</p>
      <ErrorSummary message={requestError} />
      <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="register-email">Email address</label>
        <input autoComplete="email" id="register-email" inputMode="email" {...register("email")} />
        <FieldError message={errors.email?.message} />

        <label htmlFor="register-password">Password</label>
        <input
          aria-describedby="password-guidance password-strength"
          autoComplete="new-password"
          id="register-password"
          type="password"
          {...register("password")}
        />
        <p className="field-help" id="password-guidance">
          12–128 characters with uppercase, lowercase, number and special character.
        </p>
        <p aria-live="polite" className="field-help" id="password-strength">
          {strength === null
            ? "Strength feedback appears as you type."
            : `Strength: ${["very weak", "weak", "fair", "strong", "very strong"][strength.score]}. ${strength.feedback.warning || strength.feedback.suggestions[0] || ""}`}
        </p>
        <FieldError message={errors.password?.message} />

        <label htmlFor="confirm-password">Confirm password</label>
        <input
          autoComplete="new-password"
          id="confirm-password"
          type="password"
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="supporting-link">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}
