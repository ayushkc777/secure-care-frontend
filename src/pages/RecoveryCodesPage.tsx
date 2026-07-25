import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { AuthCard } from "../components/auth/AuthCard";
import { useAuthFlow } from "../features/auth/useAuthFlow";

export function RecoveryCodesPage() {
  const navigate = useNavigate();
  const { clearRecoveryCodes, recoveryCodes } = useAuthFlow();
  const [copyMessage, setCopyMessage] = useState("");

  if (recoveryCodes.length === 0) return <Navigate replace to="/mfa/manage" />;

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopyMessage("Recovery codes copied.");
    } catch {
      setCopyMessage("Copy failed. Select and save the codes manually.");
    }
  }

  function finish() {
    clearRecoveryCodes();
    void navigate("/session", { replace: true });
  }

  return (
    <AuthCard eyebrow="Shown once" title="Save your recovery codes">
      <div className="warning-panel" role="note">
        These codes will not be shown again. Store them in a trusted password manager or another
        secure offline location.
      </div>
      <ol className="recovery-code-list" aria-label="Recovery codes">
        {recoveryCodes.map((code) => (
          <li key={code}>
            <code>{code}</code>
          </li>
        ))}
      </ol>
      <p aria-live="polite">{copyMessage}</p>
      <div className="button-row">
        <button className="secondary-button" onClick={() => void copyCodes()} type="button">
          Copy all codes
        </button>
        <button className="primary-button" onClick={finish} type="button">
          I have saved the codes
        </button>
      </div>
    </AuthCard>
  );
}
