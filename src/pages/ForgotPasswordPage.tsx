import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { emailFormSchema, type EmailForm } from "../features/auth/auth.schemas";

export function ForgotPasswordPage() {
  const [completed, setCompleted] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<EmailForm>({ resolver: zodResolver(emailFormSchema) });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await postWithCsrf("/auth/password/forgot", values);
      setCompleted(true);
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <AuthCard title={completed ? "Check your email" : "Reset your password"}>
      {completed ? (
        <>
          <p role="status">
            If the account can be processed, password reset instructions will be provided.
          </p>
          <p className="supporting-link">
            <Link to="/login">Return to sign in</Link>
          </p>
        </>
      ) : (
        <>
          <p>
            Enter your account email. The response is the same whether an account exists or not.
          </p>
          <ErrorSummary message={requestError} />
          <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
            <label htmlFor="forgot-email">Email address</label>
            <input
              autoComplete="email"
              id="forgot-email"
              inputMode="email"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Requesting reset…" : "Send reset instructions"}
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
