import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { ConfirmDialog } from "../components/feedback/ConfirmDialog";
import { AlertBanner } from "../components/ui/AlertBanner";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
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
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{
    record: AttendanceRecord;
    name: string;
    body: Record<string, unknown>;
    title: string;
    description: string;
  } | null>(null);

  const load = useCallback(async () => {
    const attendance = await apiClient.get<{ attendance: AttendanceRecord[] }>(
      `/centres/${centreId}/attendance`,
      { params: { date } },
    );
    setRecords(attendance.data.attendance);
    if (controls.canManage) {
      const [childResponse, roomResponse] = await Promise.all([
        apiClient.get<{ children: ChildSummary[] }>(`/centres/${centreId}/children`),
        apiClient.get<{ rooms: Room[] }>(`/centres/${centreId}/rooms`),
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
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [load]);

  async function action(record: AttendanceRecord, name: string, body: Record<string, unknown>) {
    setError(null);
    try {
      await mutateWithCsrf("post", `/centres/${centreId}/attendance/${record.id}/${name}`, {
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
      await mutateWithCsrf("post", `/centres/${centreId}/attendance`, {
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
        `/centres/${centreId}/attendance/${record.id}`,
      );
      const target = detail.data.attendance.events?.[0];
      if (!target) {
        setError("This record has no lifecycle event to correct.");
        return;
      }
      await mutateWithCsrf("post", `/centres/${centreId}/attendance/${record.id}/corrections`, {
        version: record.version,
        correctionOfEventId: target.id,
        correctedStatus,
        reason: correctionReason,
      });
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
  const childName = (record: AttendanceRecord) =>
    children.find((child) => child.id === record.childId)?.displayName ??
    (record.childId ? "Child attendance record" : "Lifecycle metadata");
  const checkedIn = records.filter((record) => record.status === "CHECKED_IN").length;
  const expected = records.filter((record) => record.status === "EXPECTED").length;
  const late = records.filter((record) => record.lateArrival || record.latePickup).length;

  return (
    <section className="content-card" aria-labelledby="daily-attendance-title">
      <p className="eyebrow">Centre-scoped operations</p>
      <h1 id="daily-attendance-title">Daily attendance</h1>
      <nav className="section-navigation" aria-label="Attendance sections">
        <Link to="/attendance">Available centres</Link>
      </nav>
      <ErrorSummary message={error} />
      {message && (
        <AlertBanner title="Attendance updated" tone="success">
          {message}
        </AlertBanner>
      )}
      <div className="attendance-toolbar">
        <div>
          <label htmlFor="attendance-date">Attendance date</label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <dl className="attendance-totals" aria-label="Daily attendance totals">
          <div>
            <dt>Checked in</dt>
            <dd>{checkedIn}</dd>
          </div>
          <div>
            <dt>Expected</dt>
            <dd>{expected}</dd>
          </div>
          <div>
            <dt>Late flags</dt>
            <dd>{late}</dd>
          </div>
        </dl>
      </div>

      <h2 className="section-heading">Room headcount</h2>
      {loading ? (
        <Skeleton lines={3} />
      ) : headcounts.length === 0 ? (
        <EmptyState
          title="No active rooms available"
          description="Room headcounts will appear when rooms are available to this centre."
        />
      ) : (
        <ul className="record-grid">
          {headcounts.map(({ room, count }) => {
            const percentage = Math.min(100, Math.round((count / room.capacity) * 100));
            const capacityClass =
              count >= room.capacity
                ? "capacity-meter capacity-meter-full"
                : percentage >= 80
                  ? "capacity-meter capacity-meter-near"
                  : "capacity-meter";
            return (
              <li key={room.id}>
                <h3>{room.name}</h3>
                <p>
                  <strong>{count}</strong> of {room.capacity} children present
                </p>
                <div
                  className={capacityClass}
                  aria-label={`${percentage}% of room capacity used`}
                  role="img"
                >
                  <span style={{ width: `${percentage}%` }} />
                </div>
                {percentage >= 80 && (
                  <StatusBadge tone={count >= room.capacity ? "danger" : "warning"}>
                    {count >= room.capacity ? "At capacity" : "Near capacity"}
                  </StatusBadge>
                )}
              </li>
            );
          })}
        </ul>
      )}

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
          <button
            className="primary-button"
            type="button"
            onClick={() => void createExpected()}
            disabled={!childId}
          >
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
      {loading ? (
        <Skeleton lines={4} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No attendance recorded"
          description="There are no expected, present, absent or completed attendance records for this date."
          icon="○"
        />
      ) : (
        <ul className="record-grid">
          {records.map((record) => (
            <li className="attendance-record" data-status={record.status} key={record.id}>
              <h3>{childName(record)}</h3>
              <div className="status-row">
                <StatusBadge status={record.status} />
                {record.lateArrival && <StatusBadge tone="warning">Late arrival</StatusBadge>}
                {record.latePickup && <StatusBadge tone="warning">Late pickup</StatusBadge>}
              </div>
              {(record.expectedArrivalAt || record.expectedDepartureAt) && (
                <p className="record-meta">
                  Expected{" "}
                  {record.expectedArrivalAt
                    ? new Date(record.expectedArrivalAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                  –
                  {record.expectedDepartureAt
                    ? new Date(record.expectedDepartureAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              )}
              <div className="table-actions">
                {controls.canManage && record.status === "EXPECTED" && (
                  <>
                    <button
                      type="button"
                      onClick={() => void action(record, "check-in", { roomId: rooms[0]?.id })}
                      disabled={rooms.length === 0}
                    >
                      Check in
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          record,
                          name: "absence",
                          body: {},
                          title: "Record this child as absent?",
                          description: "This appends an absence event to the attendance lifecycle.",
                        })
                      }
                    >
                      Record absence
                    </button>
                  </>
                )}
                {controls.canManage && record.status === "CHECKED_IN" && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          record,
                          name: "check-out",
                          body: {},
                          title: "Confirm checkout",
                          description:
                            "Confirm the authorised pickup process is complete before checking this child out.",
                        })
                      }
                    >
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
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.title ?? "Confirm attendance action"}
        description={pendingAction?.description ?? ""}
        confirmLabel="Confirm action"
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction === null) return;
          const value = pendingAction;
          setPendingAction(null);
          void action(value.record, value.name, value.body);
        }}
      />
    </section>
  );
}
