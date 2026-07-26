import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { SkipLink } from "../accessibility/SkipLink";
import { useAccess } from "../../features/access/useAccess";
import { AppNavigation } from "./AppNavigation";
import { BrandMark } from "./BrandMark";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppShell() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const access = useAccess();
  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => {
      if (current) setNavigationOpen(false);
    });
    return () => {
      current = false;
    };
  }, [location.pathname]);
  const assignment = access.status === "ready" ? access.access.assignments[0] : undefined;
  const roleLabel =
    assignment === undefined ? "Secure session" : assignment.roleCode.replaceAll("_", " ");

  return (
    <div className="app-frame">
      <SkipLink />
      <aside className={navigationOpen ? "app-sidebar app-sidebar-open" : "app-sidebar"}>
        <div className="sidebar-header">
          <Link className="brand-link" to="/">
            <BrandMark />
          </Link>
          <button
            className="sidebar-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => {
              setNavigationOpen(false);
              toggleRef.current?.focus();
            }}
          >
            ×
          </button>
        </div>
        <div className="sidebar-context">
          <span className="status-presence" aria-hidden="true" />
          <span>
            <strong>{access.status === "ready" ? "Signed in securely" : "Secure access"}</strong>
            <small>{roleLabel}</small>
          </span>
        </div>
        <div className="sidebar-navigation">
          <AppNavigation />
        </div>
        <p className="sidebar-security-note">
          <span aria-hidden="true">●</span> Sensitive records are protected by role and centre.
        </p>
      </aside>
      {navigationOpen && (
        <button
          className="navigation-backdrop"
          aria-label="Close navigation"
          type="button"
          onClick={() => setNavigationOpen(false)}
        />
      )}
      <div className="app-workspace">
        <header className="top-bar">
          <button
            className="mobile-menu-button"
            ref={toggleRef}
            aria-controls="primary-navigation"
            aria-expanded={navigationOpen}
            type="button"
            onClick={() => setNavigationOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
            <span>Menu</span>
          </button>
          <div className="top-bar-brand">
            <BrandMark compact />
            <span>SecureCare workspace</span>
          </div>
          {access.status === "ready" ? (
            <details className="profile-menu">
              <summary>
                <span className="profile-avatar" aria-hidden="true">
                  {roleLabel.charAt(0)}
                </span>
                <span className="profile-summary">
                  <strong>{roleLabel}</strong>
                  <small>Verified session</small>
                </span>
              </summary>
              <div className="profile-menu-panel">
                <Link to="/access">My access</Link>
                <Link to="/session">Session security</Link>
                <Link to="/mfa/manage">Manage MFA</Link>
              </div>
            </details>
          ) : (
            <Link className="top-bar-login" to="/login">
              Sign in
            </Link>
          )}
        </header>
        <main className="page-shell" id="main-content">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
