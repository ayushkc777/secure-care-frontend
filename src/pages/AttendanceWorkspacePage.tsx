import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import { attendanceControls, type AttendanceRecord } from "../features/attendance/attendance.types";
import type { ChildSummary, Room } from "../features/childcare/childcare.types";

const today = new Date().toISOString().slice(0, 10);

export function AttendanceWorkspacePage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const controls =
    access.status === "ready"
      ? attendanceControls(access.access, centreId)
      : { canRead: false, canManage: false, canCorrect: false, canReadHistory: false };
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [childId, setChildId] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctedStatus, setCorrectedStatus] = useState<AttendanceRecord["status"]>("EXPECTED");

  const load = useCallback(async () => {
    const attendance = await apiClient.get<{ attendance: AttendanceRecord[] }>(
      `/api/v1/centres/${centreId}/attendance`,
      { params: { date } },
    );
    setRecords(attendance.data.attendance);
    if (controls.canManage) {
      const [childResponse, roomResponse] = await Promise.all([
        apiClient.get<{ children: ChildSummary[] }>(`/api/v1/centres/${centreId}/children`),
        apiClient.get<{ rooms: Room[] }>(`/api/v1/centres/${centreId}/rooms`),
      ]);
      setChildren(childResponse.data.children);
      setRooms(roomResponse.data.rooms);
    }
  }, [centreId, controls.canManage, date]);

  useEffect(() => {
    let current = true;
    void Promise.resolve()
      .then(() => load())
      .catch((reason: unknown) => {
        if (current) setError(safeApiMessage(reason));
      });
    return () => {
      current = false;
    };
  }, [load]);

  async function action(record: AttendanceRecord, name: string, body: Record<string, unknown>) {
    setError(null);
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/attendance/${record.id}/${name}`, {
        version: record.version,
        ...body,
      });
      setMessage(`Attendance ${name.replaceAll("-", " ")} recorded.`);
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  }

  async function createExpected() {
    if (childId.length === 0) return;
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/attendance`, {
        childId,
        attendanceDate: date,
      });
      setMessage("Expected attendance created.");
      setChildId("");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  }

  async function correct(record: AttendanceRecord) {
    if (correctionReason.trim().length < 10) {
      setError("Enter a correction reason of at least 10 characters.");
      return;
    }
    try {
      const detail = await apiClient.get<{ attendance: AttendanceRecord }>(
        `/api/v1/centres/${centreId}/attendance/${record.id}`,
      );
      const target = detail.data.attendance.events?.[0];
      if (!target) {
        setError("This record has no lifecycle event to correct.");
        return;
      }
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/attendance/${record.id}/corrections`,
        {
          version: record.version,
          correctionOfEventId: target.id,
          correctedStatus,
          reason: correctionReason,
        },
      );
      setCorrectionReason("");
      setMessage("Attendance correction appended to history.");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  }

  const headcounts = rooms.map((room) => ({
    room,
    count: records.filter(
      (record) => record.status === "CHECKED_IN" && record.currentRoomId === room.id,
    ).length,
  }));

  return (
    <section className="content-card" aria-labelledby="daily-attendance-title">
      <p className="eyebrow">Centre-scoped operations</p>
      <h1 id="daily-attendance-title">Daily attendance</h1>
      <nav className="section-navigation" aria-label="Attendance sections">
        <Link to="/attendance">Available centres</Link>
      </nav>
      <ErrorSummary message={error} />
      <p aria-live="polite">{message}</p>
      <label htmlFor="attendance-date">Attendance date</label>
      <input
        id="attendance-date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />

      <h2 className="section-heading">Room headcount</h2>
      <ul className="record-grid">
        {headcounts.map(({ room, count }) => (
          <li key={room.id}>
            <h3>{room.name}</h3>
            <p>
              {count} of {room.capacity} children present
            </p>
          </li>
        ))}
      </ul>

      {controls.canManage && (
        <fieldset>
          <legend>Create expected attendance</legend>
          <label htmlFor="expected-child">Child</label>
          <select
            id="expected-child"
            value={childId}
            onChange={(event) => setChildId(event.target.value)}
          >
            <option value="">Select a child</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.displayName || "Child record"}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => void createExpected()} disabled={!childId}>
            Create expected record
          </button>
        </fieldset>
      )}

      <h2 className="section-heading">Attendance records</h2>
      {controls.canCorrect && (
        <fieldset>
          <legend>Manager correction</legend>
          <label htmlFor="corrected-status">Corrected status</label>
          <select
            id="corrected-status"
            value={correctedStatus}
            onChange={(event) =>
              setCorrectedStatus(event.target.value as AttendanceRecord["status"])
            }
          >
            {[
              "EXPECTED",
              "CHECKED_IN",
              "TEMPORARILY_OUT",
              "CHECKED_OUT",
              "ABSENT",
              "CANCELLED",
            ].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <label htmlFor="correction-reason">Correction reason</label>
          <textarea
            id="correction-reason"
            value={correctionReason}
            onChange={(event) => setCorrectionReason(event.target.value)}
            maxLength={1000}
          />
          <p>Choose “Correct this record” below. A recent MFA step-up is required.</p>
        </fieldset>
      )}
      {records.length === 0 ? (
        <p>No attendance records for this date.</p>
      ) : (
        <ul className="record-grid">
          {records.map((record) => (
            <li key={record.id}>
              <h3>{record.childId ?? "Lifecycle metadata"}</h3>
              <p>
                {record.status.replaceAll("_", " ")}
                {record.lateArrival ? " · Late arrival" : ""}
                {record.latePickup ? " · Late pickup" : ""}
              </p>
              {controls.canManage && record.status === "EXPECTED" && (
                <>
                  <button
                    type="button"
                    onClick={() => void action(record, "check-in", { roomId: rooms[0]?.id })}
                    disabled={rooms.length === 0}
                  >
                    Check in
                  </button>
                  <button type="button" onClick={() => void action(record, "absence", {})}>
                    Record absence
                  </button>
                </>
              )}
              {controls.canManage && record.status === "CHECKED_IN" && (
                <>
                  <button type="button" onClick={() => void action(record, "check-out", {})}>
                    Check out
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void action(record, "temporary-sign-out", {
                        reason: "Supervised temporary departure",
                      })
                    }
                  >
                    Temporary sign-out
                  </button>
                  {rooms.map(
                    (room) =>
                      room.id !== record.currentRoomId && (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() =>
                            void action(record, "transfer", {
                              destinationRoomId: room.id,
                              reason: "Planned room movement",
                            })
                          }
                        >
                          Move to {room.name}
                        </button>
                      ),
                  )}
                </>
              )}
              {controls.canManage && record.status === "TEMPORARILY_OUT" && (
                <button
                  type="button"
                  onClick={() =>
                    void action(record, "return", {
                      destinationRoomId: rooms[0]?.id,
                      reason: "Returned to centre",
                    })
                  }
                  disabled={rooms.length === 0}
                >
                  Record return
                </button>
              )}
              {record.childId && controls.canReadHistory && (
                <Link to={`/attendance/centres/${centreId}/children/${record.childId}`}>
                  View history
                </Link>
              )}
              {controls.canCorrect && (
                <button type="button" onClick={() => void correct(record)}>
                  Correct this record
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
