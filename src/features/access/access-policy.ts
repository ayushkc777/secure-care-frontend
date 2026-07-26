import type { AccessState, CurrentAccess, Permission } from "./access.types";

export type ProtectedDestination = "allow" | "/login" | "/mfa/required" | "/access-denied";

export function hasPermission(
  access: CurrentAccess,
  permission: Permission,
  centreId?: string,
): boolean {
  if (access.platformPermissions.includes(permission)) return true;
  if (centreId === undefined) {
    return access.centres.some((centre) => centre.permissions.includes(permission));
  }
  return (
    access.centres
      .find((centre) => centre.centreId === centreId)
      ?.permissions.includes(permission) === true
  );
}

export function protectedDestination(
  state: AccessState,
  permission?: Permission,
  centreId?: string,
): ProtectedDestination {
  if (state.status === "unauthenticated") return "/login";
  if (state.status === "restricted") return "/mfa/required";
  if (state.status !== "ready") return "/access-denied";
  if (permission !== undefined && !hasPermission(state.access, permission, centreId)) {
    return "/access-denied";
  }
  return "allow";
}

export function visibleAccessNavigation(access: CurrentAccess): {
  label: string;
  to: string;
}[] {
  const items = [{ label: "My access", to: "/access" }];
  if (hasPermission(access, "centre.read") || hasPermission(access, "child.read")) {
    items.push({ label: "Care records", to: "/care" });
  }
  if (hasPermission(access, "role_assignment.read")) {
    items.push({ label: "Role assignments", to: "/access/role-assignments" });
  }
  if (hasPermission(access, "audit.read") || hasPermission(access, "security_alert.read")) {
    items.push({ label: "Security records", to: "/access/security" });
  }
  if (hasPermission(access, "child.read")) {
    items.push({ label: "Child access check", to: "/access/child" });
  }
  if (
    hasPermission(access, "pickup_authorisation.read") ||
    hasPermission(access, "pickup_verification.read") ||
    hasPermission(access, "pickup_completion.read")
  ) {
    items.push({ label: "Secure pickup", to: "/pickup" });
  }
  if (hasPermission(access, "incident.read") || hasPermission(access, "incident.history.read")) {
    items.push({ label: "Incident records", to: "/incidents" });
  }
  if (
    hasPermission(access, "attendance.read") ||
    hasPermission(access, "attendance.history.read")
  ) {
    items.push({ label: "Attendance", to: "/attendance" });
  }
  if (hasPermission(access, "health.read") || hasPermission(access, "medication.read")) {
    items.push({ label: "Health and medication", to: "/health" });
  }
  if (hasPermission(access, "communication.read")) {
    items.push({ label: "Messages", to: "/communications" });
  }
  if (hasPermission(access, "notification.read")) {
    items.push({ label: "Notifications", to: "/notifications" });
  }
  return items;
}
