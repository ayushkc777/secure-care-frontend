import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../components/access/ProtectedRoute";
import { Permission } from "../features/access/access.types";
import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { AdminPage } from "../pages/AdminPage";
import { AuditPage } from "../pages/AuditPage";
import { ChildAccessPage } from "../pages/ChildAccessPage";
import { ChildrenPage } from "../pages/ChildrenPage";
import { DashboardPage } from "../pages/DashboardPage";
import { IncidentsPage } from "../pages/IncidentsPage";
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
      { path: "incidents", element: <IncidentsPage /> },
      { path: "pickup", element: <PickupPage /> },
      { path: "audit", element: <AuditPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
