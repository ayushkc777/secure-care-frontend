import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";

import { router } from "../routes/router";
import { AuthFlowProvider } from "../features/auth/AuthFlowContext";
import { AccessProvider } from "../features/access/AccessProvider";
import { PageLoader } from "../components/feedback/PageLoader";

export function App() {
  return (
    <AuthFlowProvider>
      <AccessProvider>
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </AccessProvider>
    </AuthFlowProvider>
  );
}
