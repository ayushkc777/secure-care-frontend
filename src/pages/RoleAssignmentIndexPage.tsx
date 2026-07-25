import { Link } from "react-router-dom";

import { hasPermission } from "../features/access/access-policy";
import { Permission } from "../features/access/access.types";
import { useAccess } from "../features/access/useAccess";

export function RoleAssignmentIndexPage() {
  const state = useAccess();
  if (state.status !== "ready") return null;
  const centres = state.access.centres.filter((centre) =>
    centre.permissions.includes(Permission.RoleAssignmentRead),
  );

  return (
    <section className="content-card" aria-labelledby="assignment-index-title">
      <p className="eyebrow">Least privilege</p>
      <h1 id="assignment-index-title">Role assignments</h1>
      <p>Select only a scope supplied by the backend access response.</p>
      <ul className="scope-link-list">
        {hasPermission(state.access, Permission.RoleAssignmentRead, "") && (
          <li>
            <Link to="/access/platform/role-assignments">Platform Administrator assignments</Link>
          </li>
        )}
        {centres.map((centre) => (
          <li key={centre.centreId}>
            <Link to={`/access/centres/${centre.centreId}/role-assignments`}>
              Centre {centre.centreId}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
