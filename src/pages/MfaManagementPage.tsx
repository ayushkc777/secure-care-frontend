import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { useAuthFlow } from "../features/auth/useAuthFlow";

type RegenerateResponse = {
  recoveryCodes: string[];
};

export function MfaManagementPage() {
  const navigate = useNavigate();
  const { setRecoveryCodes } = useAuthFlow();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"regenerate" | "disable" | null>(null);

  async function regenerate() {
    setBusyAction("regenerate");
    setRequestError(null);
    try {
      const result = await postWithCsrf<RegenerateResponse>("/api/v1/auth/mfa/recovery/regenerate");
      setRecoveryCodes(result.recoveryCodes);
      void navigate("/mfa/recovery-codes");
    } catch (error) {
      setRequestError(safeApiMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function disable() {
    setBusyAction("disable");
    setRequestError(null);
    try {
      await postWithCsrf("/api/v1/auth/mfa/disable");
      void navigate("/mfa/required", { replace: true });
    } catch (error) {
      setRequestError(safeApiMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <AuthCard eyebrow="Account security" title="Manage multi-factor authentication">
      <p>
        Recovery-code regeneration and MFA disablement require a recent password and second-factor
        check.
      </p>
      <ErrorSummary message={requestError} />
      <div className="management-grid">
        <section>
          <h2>Recovery codes</h2>
          <p>Generating a new set invalidates every unused code from the old set.</p>
          <button
            className="secondary-button"
            disabled={busyAction !== null}
            onClick={() => void regenerate()}
            type="button"
          >
            {busyAction === "regenerate" ? "Generating…" : "Generate new codes"}
          </button>
        </section>
        <section className="danger-zone">
          <h2>Disable MFA</h2>
          <p>This signs out other sessions and returns this account to restricted setup status.</p>
          <button
            className="danger-button"
            disabled={busyAction !== null}
            onClick={() => void disable()}
            type="button"
          >
            {busyAction === "disable" ? "Disabling…" : "Disable MFA"}
          </button>
        </section>
      </div>
      <p className="supporting-link">
        Need recent verification? <Link to="/mfa/step-up">Confirm your identity</Link>
      </p>
    </AuthCard>
  );
}
