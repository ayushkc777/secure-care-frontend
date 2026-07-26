import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import {
  communicationControls,
  type Notification,
  type NotificationPreference,
} from "../features/communications/communication.types";

const notificationTypes = [
  "ANNOUNCEMENT_AVAILABLE",
  "MESSAGE_RECEIVED",
  "ATTENDANCE_CHECKED_IN",
  "ATTENDANCE_CHECKED_OUT",
  "ATTENDANCE_LATE_ARRIVAL",
  "ATTENDANCE_LATE_PICKUP",
  "PICKUP_COMPLETED",
  "PICKUP_OVERRIDE_RECORDED",
  "INCIDENT_PUBLISHED",
  "MEDICATION_AUTHORIZATION_REQUIRED",
  "MEDICATION_ADMINISTERED",
  "MEDICATION_MISSED",
  "HEALTH_ALERT_UPDATED",
] as const;

export function NotificationWorkspacePage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const controls =
    access.status === "ready"
      ? communicationControls(access.access, centreId)
      : { canReadNotifications: false, canManagePreferences: false };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [selectedType, setSelectedType] =
    useState<(typeof notificationTypes)[number]>("MESSAGE_RECEIVED");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const [notificationsResponse, preferenceResponse] = await Promise.all([
      apiClient.get<{ notifications: Notification[] }>(`/api/v1/centres/${centreId}/notifications`),
      controls.canManagePreferences
        ? apiClient.get<{ preferences: NotificationPreference[] }>(
            `/api/v1/centres/${centreId}/notification-preferences`,
          )
        : Promise.resolve({ data: { preferences: [] } }),
    ]);
    setNotifications(notificationsResponse.data.notifications);
    setPreferences(preferenceResponse.data.preferences);
  }, [centreId, controls.canManagePreferences]);

  useEffect(() => {
    let current = true;
    void Promise.resolve()
      .then(() => load())
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [load]);

  const notificationAction = async (notificationId: string, action: "read" | "dismiss") => {
    setError(null);
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/notifications/${notificationId}/${action}`,
        {},
      );
      setStatus(`Notification marked ${action === "read" ? "read" : "dismissed"}.`);
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  const savePreference = async (event: React.FormEvent) => {
    event.preventDefault();
    const existing = preferences.find(({ type }) => type === selectedType);
    setError(null);
    try {
      await mutateWithCsrf("put", `/api/v1/centres/${centreId}/notification-preferences`, {
        type: selectedType,
        inAppEnabled: enabled,
        emailEnabled: false,
        ...(existing ? { version: existing.version } : {}),
      });
      setStatus("Notification preference saved.");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  return (
    <section className="content-card" aria-labelledby="notification-workspace-title">
      <p className="eyebrow">Recipient-scoped delivery history</p>
      <h1 id="notification-workspace-title">Notifications</h1>
      <nav className="section-navigation" aria-label="Notification sections">
        <Link to="/notifications">All available centres</Link>
        <Link to={`/communications/centres/${centreId}`}>Secure inbox</Link>
      </nav>
      <ErrorSummary message={error} />
      <p aria-live="polite">{status}</p>
      {notifications.length === 0 ? (
        <p>No notifications are available.</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <div>
                <h2>{notification.title ?? notification.type.replaceAll("_", " ")}</h2>
                <p>
                  {notification.status}
                  {notification.important ? " · Important" : ""}
                </p>
                {notification.body && <p>{notification.body}</p>}
              </div>
              <div className="button-row">
                {notification.status !== "READ" && notification.status !== "DISMISSED" && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void notificationAction(notification.id, "read")}
                  >
                    Mark read
                  </button>
                )}
                {notification.status !== "DISMISSED" && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void notificationAction(notification.id, "dismiss")}
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {controls.canManagePreferences && (
        <form className="auth-form" onSubmit={(event) => void savePreference(event)}>
          <h2>Notification preferences</h2>
          <p>External email delivery is unavailable; this controls in-application notices.</p>
          <label htmlFor="notification-type">Notification type</label>
          <select
            id="notification-type"
            value={selectedType}
            onChange={(event) =>
              setSelectedType(event.currentTarget.value as (typeof notificationTypes)[number])
            }
          >
            {notificationTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.currentTarget.checked)}
            />{" "}
            Receive in-application notifications
          </label>
          <button className="primary-button" type="submit">
            Save preference
          </button>
        </form>
      )}
    </section>
  );
}
