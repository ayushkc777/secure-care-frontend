import { Link, useLocation } from "react-router-dom";

const labels: Record<string, string> = {
  access: "Access",
  attendance: "Attendance",
  care: "Care records",
  centres: "Centres",
  children: "Children",
  health: "Health and medication",
  incidents: "Incidents",
  pickup: "Secure pickup",
  safeguarding: "Safeguarding",
  security: "Security records",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const crumbs = segments
    .map((segment, index) => ({
      label: labels[segment],
      to: `/${segments.slice(0, index + 1).join("/")}`,
    }))
    .filter((crumb): crumb is { label: string; to: string } => crumb.label !== undefined);

  if (crumbs.length === 0) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/dashboard">Overview</Link>
        </li>
        {crumbs.map((crumb, index) => (
          <li key={crumb.to}>
            {index === crumbs.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.to}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
