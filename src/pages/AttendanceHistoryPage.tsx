import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { AttendanceRecord } from "../features/attendance/attendance.types";

export function AttendanceHistoryPage() {
  const { centreId = "", childId = "" } = useParams();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ attendance: AttendanceRecord[] }>(
        `/centres/${centreId}/children/${childId}/attendance`,
      )
      .then(({ data }) => current && setRecords(data.attendance))
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [centreId, childId]);
  return (
    <section className="content-card" aria-labelledby="attendance-history-title">
      <p className="eyebrow">Safe child view</p>
      <h1 id="attendance-history-title">Attendance history</h1>
      <Link to={`/attendance/centres/${centreId}`}>Back to daily attendance</Link>
      <ErrorSummary message={error} />
      {loading ? (
        <Skeleton lines={4} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No attendance history"
          description="No attendance lifecycle records are available for this child."
        />
      ) : (
        <ol className="timeline" aria-label="Attendance history timeline">
          {records.map((record) => (
            <li key={record.id}>
              <h2>{new Date(`${record.attendanceDate}T00:00:00`).toLocaleDateString()}</h2>
              <StatusBadge status={record.status} />
              {record.checkedInAt && (
                <p>Checked in: {new Date(record.checkedInAt).toLocaleString()}</p>
              )}
              {record.checkedOutAt && (
                <p>Checked out: {new Date(record.checkedOutAt).toLocaleString()}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
