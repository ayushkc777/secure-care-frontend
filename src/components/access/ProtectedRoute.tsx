import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";

import { PageLoader } from "../feedback/PageLoader";
import type { Permission } from "../../features/access/access.types";
import { protectedDestination } from "../../features/access/access-policy";
import { useAccess } from "../../features/access/useAccess";

export function ProtectedRoute({
  children,
  permission,
  platformOnly = false,
  useCentreParam = false,
}: {
  children: ReactNode;
  permission?: Permission;
  platformOnly?: boolean;
  useCentreParam?: boolean;
}) {
  const state = useAccess();
  const { centreId } = useParams();
  if (state.status === "loading") return <PageLoader />;
  const destination = protectedDestination(
    state,
    permission,
    platformOnly ? "" : useCentreParam ? centreId : undefined,
  );
  return destination === "allow" ? children : <Navigate replace to={destination} />;
}
