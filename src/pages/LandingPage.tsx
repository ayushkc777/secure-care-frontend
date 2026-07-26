import { Link } from "react-router-dom";

import { useAccess } from "../features/access/useAccess";

export function LandingPage() {
  const access = useAccess();
  return (
    <section className="content-card landing-hero" aria-labelledby="landing-title">
      <div className="landing-copy">
        <p className="eyebrow">Zero-trust childcare operations</p>
        <h1 id="landing-title">Care information, handled with confidence.</h1>
        <p>
          SecureCare gives authorised families and childcare teams one calm, protected place for
          attendance, pickup, incidents, safeguarding, health and medication records.
        </p>
        <div className="button-row">
          {access.status === "ready" ? (
            <Link className="primary-button link-button" to="/dashboard">
              Open your workspace
            </Link>
          ) : (
            <>
              <Link className="primary-button link-button" to="/login">
                Sign in securely
              </Link>
              <Link className="secondary-button link-button" to="/register">
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="trust-panel" aria-label="SecureCare protections">
        <p className="eyebrow">Designed for sensitive care</p>
        <ul>
          <li>
            <strong>Role-aware access</strong>
            <span>Only authorised records and actions are shown.</span>
          </li>
          <li>
            <strong>Centre boundaries</strong>
            <span>Every protected workflow remains centre scoped.</span>
          </li>
          <li>
            <strong>Verified changes</strong>
            <span>CSRF protection and MFA guard sensitive actions.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
