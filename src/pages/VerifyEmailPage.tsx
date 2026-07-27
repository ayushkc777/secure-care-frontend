import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { authTokenSchema } from "../features/auth/auth.schemas";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const parsedToken = authTokenSchema.safeParse(searchParams.get("token"));
  const [verified, setVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(
    parsedToken.success ? null : "This verification link is incomplete or invalid.",
  );

  async function verify() {
    if (!parsedToken.success) return;
    setIsSubmitting(true);
    setRequestError(null);
    try {
      await postWithCsrf("/auth/email/verify", { token: parsedToken.data });
      setVerified(true);
    } catch (error) {
      setRequestError(safeApiMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title={verified ? "Email verified" : "Verify your email"}>
      <ErrorSummary message={requestError} />
      {verified ? (
        <>
          <p role="status">Your email address is verified. You can now sign in.</p>
          <Link className="primary-button link-button" to="/login">
            Sign in
          </Link>
        </>
      ) : (
        <>
          <p>Confirm this one-time link to activate your SecureCare account.</p>
          <button
            className="primary-button"
            disabled={!parsedToken.success || isSubmitting}
            onClick={() => void verify()}
            type="button"
          >
            {isSubmitting ? "Verifying…" : "Verify email"}
          </button>
          <p className="supporting-link">
            Link expired? <Link to="/resend-verification">Request another</Link>
          </p>
        </>
      )}
    </AuthCard>
  );
}
