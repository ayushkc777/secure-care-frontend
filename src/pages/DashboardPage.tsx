import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../api/client";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { hasPermission, visibleAccessNavigation } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre } from "../features/childcare/childcare.types";

type DashboardSummary = {
  centres: number;
  checkedIn: number | null;
  expected: number | null;
  openIncidents: number | null;
};

export function DashboardPage() {
  const access = useAccess();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dataUnavailable, setDataUnavailable] = useState(false);

  useEffect(() => {
    if (access.status !== "ready") return;
    let current = true;
    void apiClient
      .get<{ centres: Centre[] }>("/centres")
      .then(async ({ data }) => {
        const today = new Date().toISOString().slice(0, 10);
        const attendanceCentres = data.centres.filter((centre) =>
          hasPermission(access.access, "attendance.manage", centre.id),
        );
        const incidentCentres = data.centres.filter(
          (centre) =>
            hasPermission(access.access, "incident.read", centre.id) ||
            hasPermission(access.access, "incident.history.read", centre.id),
        );
        const attendanceResults = await Promise.allSettled(
          attendanceCentres.map((centre) =>
            apiClient.get<{ totals: Record<string, number> }>(
              `/centres/${centre.id}/attendance/overview`,
              { params: { date: today } },
            ),
          ),
        );
        const incidentResults = await Promise.allSettled(
          incidentCentres.map((centre) =>
            apiClient.get<{ incidents: { status: string }[] }>(`/centres/${centre.id}/incidents`),
          ),
        );
        const attendanceValues = attendanceResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value.data.totals] : [],
        );
        const incidents = incidentResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value.data.incidents : [],
        );
        const hasAttendanceData = attendanceResults.some((result) => result.status === "fulfilled");
        const hasIncidentData = incidentResults.some((result) => result.status === "fulfilled");
        return {
          centres: data.centres.length,
          checkedIn:
            attendanceCentres.length === 0 || !hasAttendanceData
              ? null
              : attendanceValues.reduce((sum, totals) => sum + (totals.CHECKED_IN ?? 0), 0),
          expected:
            attendanceCentres.length === 0 || !hasAttendanceData
              ? null
              : attendanceValues.reduce((sum, totals) => sum + (totals.EXPECTED ?? 0), 0),
          openIncidents:
            incidentCentres.length === 0 || !hasIncidentData
              ? null
              : incidents.filter((incident) => !["CLOSED", "ARCHIVED"].includes(incident.status))
                  .length,
        };
      })
      .then((value) => {
        if (current) setSummary(value);
      })
      .catch(() => {
        if (current) setDataUnavailable(true);
      });
    return () => {
      current = false;
    };
  }, [access]);

  if (access.status !== "ready") {
    return (
      <section className="content-card">
        <EmptyState
          title="Sign in to view your workspace"
          description="Your dashboard is assembled from your current server-issued roles and centre permissions."
          action={
            <Link className="primary-button link-button" to="/login">
              Sign in
            </Link>
          }
        />
      </section>
    );
  }

  const navigation = visibleAccessNavigation(access.access).filter((item) => item.to !== "/access");
  const role =
    access.access.assignments[0]?.roleCode.replaceAll("_", " ").toLowerCase() ??
    "authorised team member";

  return (
    <section className="content-card" aria-labelledby="dashboard-title">
      <PageHeader
        eyebrow="Today’s secure overview"
        title="Welcome to SecureCare"
        description={`Your workspace reflects your current access as an ${role}. Counts below come from live, authorised centre records.`}
      />
      {summary === null && !dataUnavailable ? (
        <div className="dashboard-grid">
          <Skeleton lines={3} />
          <Skeleton lines={3} />
        </div>
      ) : summary === null ? (
        <EmptyState
          title="Overview temporarily unavailable"
          description="Your protected workspaces remain available from the navigation."
        />
      ) : (
        <div className="dashboard-grid" aria-label="Today’s operational summary">
          <article className="summary-card">
            <span>Available centres</span>
            <strong>{summary.centres}</strong>
            <p>Limited by your current server-issued access.</p>
          </article>
          <article className="summary-card">
            <span>Children checked in</span>
            <strong>{summary.checkedIn ?? "—"}</strong>
            <p>Current total from centres you may manage.</p>
          </article>
          <article className="summary-card">
            <span>Expected today</span>
            <strong>{summary.expected ?? "—"}</strong>
            <p>Expected records not yet checked in.</p>
          </article>
          <article className="summary-card">
            <span>Open incidents</span>
            <strong>{summary.openIncidents ?? "—"}</strong>
            <p>Visible records not closed or archived.</p>
          </article>
          <section className="workspace-panel">
            <h2>Quick actions</h2>
            <p>Open a workspace already authorised for your role.</p>
            {navigation.length === 0 ? (
              <EmptyState
                title="No operational actions available"
                description="Ask a Centre Manager or Administrator to review your role assignment."
              />
            ) : (
              <ul className="quick-action-list">
                {navigation.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="workspace-panel">
            <h2>Important care checks</h2>
            <p>
              Attendance, pickup, incidents and health alerts remain in their specialised,
              permission-controlled workspaces.
            </p>
            <ul className="care-check-list">
              <li>Review active health alerts before care transitions.</li>
              <li>Confirm pickup verification before checkout.</li>
              <li>Use recent MFA for corrections and approvals.</li>
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}
