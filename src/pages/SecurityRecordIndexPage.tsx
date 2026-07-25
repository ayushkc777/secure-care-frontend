import { Link } from "react-router-dom";

import { Permission } from "../features/access/access.types";
import { useAccess } from "../features/access/useAccess";

export function SecurityRecordIndexPage() {
  const state = useAccess();
  if (state.status !== "ready") return null;
  const centres = state.access.centres.filter(
    (centre) =>
      centre.permissions.includes(Permission.AuditRead) ||
      centre.permissions.includes(Permission.SecurityAlertRead),
  );

  return (
    <section className="content-card" aria-labelledby="security-record-index-title">
      <p className="eyebrow">Read-only access</p>
      <h1 id="security-record-index-title">Security records</h1>
      <p>Only limited metadata is available. This is not the audit dashboard.</p>
      <ul className="scope-link-list">
        {centres.map((centre) => (
          <li key={centre.centreId}>
            <Link to={`/access/centres/${centre.centreId}/security`}>Centre {centre.centreId}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
