import { zodResolver } from "@hookform/resolvers/zod";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { postWithCsrf, safeApiMessage } from "../api/client";
import { AuthCard } from "../components/auth/AuthCard";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAuthFlow } from "../features/auth/useAuthFlow";
import { totpFormSchema, type TotpForm } from "../features/auth/auth.schemas";
import type { MfaSetup } from "../features/auth/auth.types";
import { useAccess } from "../features/access/useAccess";

type ConfirmationResponse = {
  authenticationState: "MFA_AUTHENTICATED";
  recoveryCodes: string[];
};

export function MfaEnrolmentPage() {
  const navigate = useNavigate();
  const { refresh } = useAccess();
  const { clearSetup, setup, setRecoveryCodes, setSetup } = useAuthFlow();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<TotpForm>({ resolver: zodResolver(totpFormSchema) });

  useEffect(() => {
    let current = true;
    if (setup === null) return;
    void QRCode.toDataURL(setup.otpauthUri, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
    }).then((dataUrl) => {
      if (current) setQrDataUrl(dataUrl);
    });
    return () => {
      current = false;
    };
  }, [setup]);

  async function startSetup() {
    setRequestError(null);
    setQrDataUrl(null);
    setIsStarting(true);
    try {
      setSetup(await postWithCsrf<MfaSetup>("/auth/mfa/setup/start"));
    } catch (error) {
      setRequestError(safeApiMessage(error));
    } finally {
      setIsStarting(false);
    }
  }

  const confirm = handleSubmit(async ({ code }) => {
    setRequestError(null);
    try {
      const result = await postWithCsrf<ConfirmationResponse>("/auth/mfa/setup/confirm", {
        code,
      });
      setRecoveryCodes(result.recoveryCodes);
      clearSetup();
      await refresh();
      void navigate("/mfa/recovery-codes", { replace: true });
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  return (
    <AuthCard eyebrow="Authenticator setup" title="Set up multi-factor authentication">
      <p>
        SecureCare creates the QR code in this browser. The setup URI is not sent to an external
        image service.
      </p>
      <ErrorSummary message={requestError} />
      {setup === null ? (
        <button
          className="primary-button standalone-button"
          disabled={isStarting}
          onClick={() => void startSetup()}
          type="button"
        >
          {isStarting ? "Creating setup…" : "Begin authenticator setup"}
        </button>
      ) : (
        <>
          <div className="qr-panel">
            {qrDataUrl === null ? (
              <span>Preparing QR code…</span>
            ) : (
              <img alt="Authenticator setup QR code" height="280" src={qrDataUrl} width="280" />
            )}
          </div>
          <div className="manual-secret">
            <span>Cannot scan the code? Enter this secret manually:</span>
            <code>{setup.manualSecret}</code>
          </div>
          <p>
            Setup expires at {new Date(setup.expiresAt).toLocaleTimeString("en-GB")}. Enter a
            current code to activate MFA.
          </p>
          <form className="auth-form" noValidate onSubmit={(event) => void confirm(event)}>
            <label htmlFor="setup-code">Six-digit code</label>
            <input
              autoComplete="one-time-code"
              className="code-input"
              id="setup-code"
              inputMode="numeric"
              maxLength={6}
              {...register("code")}
            />
            <FieldError message={errors.code?.message} />
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Activating…" : "Activate MFA"}
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
