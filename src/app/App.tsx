import { RouterProvider } from "react-router-dom";

import { router } from "../routes/router";
import { AuthFlowProvider } from "../features/auth/AuthFlowContext";
import { AccessProvider } from "../features/access/AccessProvider";

export function App() {
  return (
    <AuthFlowProvider>
      <AccessProvider>
        <RouterProvider router={router} />
      </AccessProvider>
    </AuthFlowProvider>
  );
}
