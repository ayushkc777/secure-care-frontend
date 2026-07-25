import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiClient, postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary } from "../components/auth/FormFeedback";
import type { SessionSummary } from "../features/auth/auth.types";

function readableDate(value: string | null): string {
  return value === null ? "Not available" : new Date(value).toLocaleString("en-GB");
}

export function SessionStatusPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let current = true;
    void apiClient
      .get<SessionSummary>("/api/v1/auth/session")
      .then(({ data }) => {
        if (current) setSession(data);
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, []);

  async function logout() {
    setIsLoggingOut(true);
    setRequestError(null);
    try {
      await postWithCsrf("/api/v1/auth/logout");
      void navigate("/login", { replace: true });
    } catch (error) {
      setRequestError(safeApiMessage(error));
      setIsLoggingOut(false);
    }
  }

  return (
    <AuthCard eyebrow="Current browser" title="Active session status">
      <ErrorSummary message={requestError} />
      {session === null ? (
        <p aria-live="polite">Loading session information…</p>
      ) : (
        <>
          <dl className="session-details">
            <div>
              <dt>Authentication state</dt>
              <dd>{session.authenticationState.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Last activity</dt>
              <dd>{readableDate(session.session.lastSeenAt)}</dd>
            </div>
            <div>
              <dt>Session expires</dt>
              <dd>{readableDate(session.session.absoluteExpiresAt)}</dd>
            </div>
            <div>
              <dt>MFA last verified</dt>
              <dd>{readableDate(session.session.mfaVerifiedAt)}</dd>
            </div>
            <div>
              <dt>Step-up valid until</dt>
              <dd>{readableDate(session.session.stepUpExpiresAt)}</dd>
            </div>
          </dl>
          <div className="button-row">
            {session.authenticationState === "MFA_ENROLMENT_REQUIRED" ? (
              <Link className="primary-button link-button" to="/mfa/enrol">
                Complete MFA setup
              </Link>
            ) : (
              <Link className="secondary-button link-button" to="/mfa/manage">
                Manage MFA
              </Link>
            )}
            <button
              className="secondary-button"
              disabled={isLoggingOut}
              onClick={() => void logout()}
              type="button"
            >
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </AuthCard>
  );
}
