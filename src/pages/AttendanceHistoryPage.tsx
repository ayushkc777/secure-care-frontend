import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import type { AttendanceRecord } from "../features/attendance/attendance.types";

export function AttendanceHistoryPage() {
  const { centreId = "", childId = "" } = useParams();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ attendance: AttendanceRecord[] }>(
        `/api/v1/centres/${centreId}/children/${childId}/attendance`,
      )
      .then(({ data }) => current && setRecords(data.attendance))
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
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
      <ol className="record-grid">
        {records.map((record) => (
          <li key={record.id}>
            <h2>{record.attendanceDate}</h2>
            <p>{record.status.replaceAll("_", " ")}</p>
            {record.checkedInAt && (
              <p>Checked in: {new Date(record.checkedInAt).toLocaleString()}</p>
            )}
            {record.checkedOutAt && (
              <p>Checked out: {new Date(record.checkedOutAt).toLocaleString()}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
