import { Link } from "react-router-dom";

import { AuthCard } from "../components/auth/AuthCard";

export function MfaRequiredPage() {
  return (
    <AuthCard eyebrow="Action required" title="Protect your account with MFA">
      <p>
        Your sign-in is restricted until authenticator setup is complete. You can view session
        information, sign out, or continue setup.
      </p>
      <div className="button-row">
        <Link className="primary-button link-button" to="/mfa/enrol">
          Set up authenticator
        </Link>
        <Link className="secondary-button link-button" to="/session">
          View session
        </Link>
      </div>
    </AuthCard>
  );
}
