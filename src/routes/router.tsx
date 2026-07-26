import { lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../components/access/ProtectedRoute";
import { Permission } from "../features/access/access.types";
const page = <T extends Record<K, ComponentType>, K extends keyof T>(
  loader: () => Promise<T>,
  name: K,
) => lazy(async () => ({ default: (await loader())[name] }));

const AccessDeniedPage = page(() => import("../pages/AccessDeniedPage"), "AccessDeniedPage");
const AttendanceHistoryPage = page(
  () => import("../pages/AttendanceHistoryPage"),
  "AttendanceHistoryPage",
);
const AttendancePage = page(() => import("../pages/AttendancePage"), "AttendancePage");
const AttendanceWorkspacePage = page(
  () => import("../pages/AttendanceWorkspacePage"),
  "AttendanceWorkspacePage",
);
const CareChildrenPage = page(() => import("../pages/CareChildrenPage"), "CareChildrenPage");
const CareIndexPage = page(() => import("../pages/CareIndexPage"), "CareIndexPage");
const CentreWorkspacePage = page(
  () => import("../pages/CentreWorkspacePage"),
  "CentreWorkspacePage",
);
const ChildAccessPage = page(() => import("../pages/ChildAccessPage"), "ChildAccessPage");
const ChildRecordPage = page(() => import("../pages/ChildRecordPage"), "ChildRecordPage");
const CommunicationsPage = page(() => import("../pages/CommunicationsPage"), "CommunicationsPage");
const CommunicationWorkspacePage = page(
  () => import("../pages/CommunicationWorkspacePage"),
  "CommunicationWorkspacePage",
);
const ConversationPage = page(() => import("../pages/ConversationPage"), "ConversationPage");
const CurrentAccessPage = page(() => import("../pages/CurrentAccessPage"), "CurrentAccessPage");
const DashboardPage = page(() => import("../pages/DashboardPage"), "DashboardPage");
const HealthChildrenPage = page(() => import("../pages/HealthChildrenPage"), "HealthChildrenPage");
const HealthPage = page(() => import("../pages/HealthPage"), "HealthPage");
const HealthWorkspacePage = page(
  () => import("../pages/HealthWorkspacePage"),
  "HealthWorkspacePage",
);
const IncidentDetailPage = page(() => import("../pages/IncidentDetailPage"), "IncidentDetailPage");
const IncidentsPage = page(() => import("../pages/IncidentsPage"), "IncidentsPage");
const IncidentWorkspacePage = page(
  () => import("../pages/IncidentWorkspacePage"),
  "IncidentWorkspacePage",
);
const LandingPage = page(() => import("../pages/LandingPage"), "LandingPage");
const LoginPage = page(() => import("../pages/LoginPage"), "LoginPage");
const MfaEnrolmentPage = page(() => import("../pages/MfaEnrolmentPage"), "MfaEnrolmentPage");
const MfaManagementPage = page(() => import("../pages/MfaManagementPage"), "MfaManagementPage");
const MfaRecoveryLoginPage = page(
  () => import("../pages/MfaRecoveryLoginPage"),
  "MfaRecoveryLoginPage",
);
const MfaRequiredPage = page(() => import("../pages/MfaRequiredPage"), "MfaRequiredPage");
const MfaVerifyPage = page(() => import("../pages/MfaVerifyPage"), "MfaVerifyPage");
const NotificationWorkspacePage = page(
  () => import("../pages/NotificationWorkspacePage"),
  "NotificationWorkspacePage",
);
const NotificationsPage = page(() => import("../pages/NotificationsPage"), "NotificationsPage");
const NotFoundPage = page(() => import("../pages/NotFoundPage"), "NotFoundPage");
const PickupPage = page(() => import("../pages/PickupPage"), "PickupPage");
const PickupWorkspacePage = page(
  () => import("../pages/PickupWorkspacePage"),
  "PickupWorkspacePage",
);
const RecoveryCodesPage = page(() => import("../pages/RecoveryCodesPage"), "RecoveryCodesPage");
const RegisterPage = page(() => import("../pages/RegisterPage"), "RegisterPage");
const ReportDashboardPage = page(
  () => import("../pages/ReportDashboardPage"),
  "ReportDashboardPage",
);
const ReportsPage = page(() => import("../pages/ReportsPage"), "ReportsPage");
const RoleAssignmentIndexPage = page(
  () => import("../pages/RoleAssignmentIndexPage"),
  "RoleAssignmentIndexPage",
);
const RoleAssignmentsPage = page(
  () => import("../pages/RoleAssignmentsPage"),
  "RoleAssignmentsPage",
);
const RoomsPage = page(() => import("../pages/RoomsPage"), "RoomsPage");
const RouteErrorPage = page(() => import("../pages/RouteErrorPage"), "RouteErrorPage");
const SafeguardingPage = page(() => import("../pages/SafeguardingPage"), "SafeguardingPage");
const SecurityRecordIndexPage = page(
  () => import("../pages/SecurityRecordIndexPage"),
  "SecurityRecordIndexPage",
);
const SecurityRecordsPage = page(
  () => import("../pages/SecurityRecordsPage"),
  "SecurityRecordsPage",
);
const SessionStatusPage = page(() => import("../pages/SessionStatusPage"), "SessionStatusPage");
const StepUpPage = page(() => import("../pages/StepUpPage"), "StepUpPage");

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "mfa/verify", element: <MfaVerifyPage /> },
      { path: "mfa/recovery", element: <MfaRecoveryLoginPage /> },
      { path: "mfa/required", element: <MfaRequiredPage /> },
      { path: "mfa/enrol", element: <MfaEnrolmentPage /> },
      { path: "mfa/recovery-codes", element: <RecoveryCodesPage /> },
      { path: "mfa/step-up", element: <StepUpPage /> },
      { path: "mfa/manage", element: <MfaManagementPage /> },
      { path: "session", element: <SessionStatusPage /> },
      {
        path: "care",
        element: (
          <ProtectedRoute permission={Permission.CentreRead}>
            <CareIndexPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "care/centres/:centreId",
        element: (
          <ProtectedRoute permission={Permission.CentreRead} useCentreParam>
            <CentreWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "care/centres/:centreId/rooms",
        element: (
          <ProtectedRoute permission={Permission.RoomRead} useCentreParam>
            <RoomsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "care/centres/:centreId/children",
        element: (
          <ProtectedRoute permission={Permission.ChildRead} useCentreParam>
            <CareChildrenPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "care/centres/:centreId/children/:childId",
        element: (
          <ProtectedRoute permission={Permission.ChildRead} useCentreParam>
            <ChildRecordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "access",
        element: (
          <ProtectedRoute>
            <CurrentAccessPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "access/role-assignments",
        element: (
          <ProtectedRoute permission={Permission.RoleAssignmentRead}>
            <RoleAssignmentIndexPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "access/centres/:centreId/role-assignments",
        element: (
          <ProtectedRoute permission={Permission.RoleAssignmentRead} useCentreParam>
            <RoleAssignmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "access/platform/role-assignments",
        element: (
          <ProtectedRoute permission={Permission.RoleAssignmentRead} platformOnly>
            <RoleAssignmentsPage platform />
          </ProtectedRoute>
        ),
      },
      {
        path: "access/security",
        element: (
          <ProtectedRoute permission={Permission.AuditRead}>
            <SecurityRecordIndexPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "access/centres/:centreId/security",
        element: (
          <ProtectedRoute permission={Permission.AuditRead} useCentreParam>
            <SecurityRecordsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "access/child",
        element: (
          <ProtectedRoute permission={Permission.ChildRead}>
            <ChildAccessPage />
          </ProtectedRoute>
        ),
      },
      { path: "access-denied", element: <AccessDeniedPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "notifications",
        element: (
          <ProtectedRoute permission={Permission.NotificationRead}>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "notifications/centres/:centreId",
        element: (
          <ProtectedRoute permission={Permission.NotificationRead} useCentreParam>
            <NotificationWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "communications",
        element: (
          <ProtectedRoute permission={Permission.CommunicationRead}>
            <CommunicationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "communications/centres/:centreId",
        element: (
          <ProtectedRoute permission={Permission.CommunicationRead} useCentreParam>
            <CommunicationWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "communications/centres/:centreId/conversations/:conversationId",
        element: (
          <ProtectedRoute permission={Permission.CommunicationRead} useCentreParam>
            <ConversationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute permission={Permission.ReportRead}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports/centres/:centreId",
        element: (
          <ProtectedRoute permission={Permission.ReportRead} useCentreParam>
            <ReportDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "incidents",
        element: (
          <ProtectedRoute permission={Permission.IncidentHistoryRead}>
            <IncidentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "incidents/centres/:centreId",
        element: (
          <ProtectedRoute permission={Permission.IncidentHistoryRead} useCentreParam>
            <IncidentWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "incidents/centres/:centreId/safeguarding",
        element: (
          <ProtectedRoute permission={Permission.SafeguardingRead} useCentreParam>
            <SafeguardingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "incidents/centres/:centreId/safeguarding/:concernId",
        element: (
          <ProtectedRoute permission={Permission.SafeguardingRead} useCentreParam>
            <SafeguardingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "incidents/centres/:centreId/:incidentId",
        element: (
          <ProtectedRoute permission={Permission.IncidentHistoryRead} useCentreParam>
            <IncidentDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "attendance",
        element: (
          <ProtectedRoute permission={Permission.AttendanceHistoryRead}>
            <AttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "attendance/centres/:centreId",
        element: (
          <ProtectedRoute permission={Permission.AttendanceRead} useCentreParam>
            <AttendanceWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "attendance/centres/:centreId/children/:childId",
        element: (
          <ProtectedRoute permission={Permission.AttendanceHistoryRead} useCentreParam>
            <AttendanceHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "health",
        element: (
          <ProtectedRoute permission={Permission.HealthRead}>
            <HealthPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "health/centres/:centreId",
        element: (
          <ProtectedRoute permission={Permission.HealthRead} useCentreParam>
            <HealthChildrenPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "health/centres/:centreId/children/:childId",
        element: (
          <ProtectedRoute permission={Permission.HealthRead} useCentreParam>
            <HealthWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pickup",
        element: (
          <ProtectedRoute permission={Permission.PickupAuthorisationRead}>
            <PickupPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pickup/centres/:centreId/children/:childId",
        element: (
          <ProtectedRoute permission={Permission.PickupAuthorisationRead} useCentreParam>
            <PickupWorkspacePage />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
