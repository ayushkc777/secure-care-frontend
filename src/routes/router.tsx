import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../components/access/ProtectedRoute";
import { Permission } from "../features/access/access.types";
import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { AdminPage } from "../pages/AdminPage";
import { AuditPage } from "../pages/AuditPage";
import { ChildAccessPage } from "../pages/ChildAccessPage";
import { ChildRecordPage } from "../pages/ChildRecordPage";
import { ChildrenPage } from "../pages/ChildrenPage";
import { CareChildrenPage } from "../pages/CareChildrenPage";
import { CareIndexPage } from "../pages/CareIndexPage";
import { CentreWorkspacePage } from "../pages/CentreWorkspacePage";
import { DashboardPage } from "../pages/DashboardPage";
import { IncidentsPage } from "../pages/IncidentsPage";
import { IncidentDetailPage } from "../pages/IncidentDetailPage";
import { IncidentWorkspacePage } from "../pages/IncidentWorkspacePage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { MfaEnrolmentPage } from "../pages/MfaEnrolmentPage";
import { MfaManagementPage } from "../pages/MfaManagementPage";
import { MfaRecoveryLoginPage } from "../pages/MfaRecoveryLoginPage";
import { MfaRequiredPage } from "../pages/MfaRequiredPage";
import { MfaVerifyPage } from "../pages/MfaVerifyPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { PickupPage } from "../pages/PickupPage";
import { PickupWorkspacePage } from "../pages/PickupWorkspacePage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { RecoveryCodesPage } from "../pages/RecoveryCodesPage";
import { RouteErrorPage } from "../pages/RouteErrorPage";
import { SessionStatusPage } from "../pages/SessionStatusPage";
import { StepUpPage } from "../pages/StepUpPage";
import { CurrentAccessPage } from "../pages/CurrentAccessPage";
import { RoleAssignmentIndexPage } from "../pages/RoleAssignmentIndexPage";
import { RoleAssignmentsPage } from "../pages/RoleAssignmentsPage";
import { SecurityRecordIndexPage } from "../pages/SecurityRecordIndexPage";
import { SecurityRecordsPage } from "../pages/SecurityRecordsPage";
import { RoomsPage } from "../pages/RoomsPage";
import { SafeguardingPage } from "../pages/SafeguardingPage";

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
      { path: "profile", element: <ProfilePage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "children", element: <ChildrenPage /> },
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
      { path: "audit", element: <AuditPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
