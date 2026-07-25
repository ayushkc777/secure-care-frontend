import { Link } from "react-router-dom";

import { useAccess } from "../features/access/useAccess";

export function CurrentAccessPage() {
  const state = useAccess();
  if (state.status !== "ready") return null;

  return (
    <section className="content-card" aria-labelledby="current-access-title">
      <p className="eyebrow">Server-derived access</p>
      <h1 id="current-access-title">My current access</h1>
      <p>
        These assignments and permissions were refreshed from the API. The server still evaluates
        every protected request.
      </p>

      <h2 className="section-heading">Role assignments</h2>
      {state.access.assignments.length === 0 ? (
        <p>No active assignments grant access.</p>
      ) : (
        <ul className="access-list">
          {state.access.assignments.map((assignment) => (
            <li key={assignment.id}>
              <strong>{assignment.roleCode.replaceAll("_", " ")}</strong>
              <span>
                {assignment.scope === "PLATFORM"
                  ? "Platform scope"
                  : `Centre ${assignment.centreId ?? "unavailable"}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-heading">Effective centre permissions</h2>
      <div className="access-centre-grid">
        {state.access.centres.map((centre) => (
          <section key={centre.centreId}>
            <h3>{centre.centreId}</h3>
            <ul>
              {centre.permissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="button-row">
        <Link className="secondary-button link-button" to="/session">
          View session assurance
        </Link>
        <button className="secondary-button" onClick={() => void state.refresh()} type="button">
          Refresh access
        </button>
      </div>
    </section>
  );
}
