import { RouterProvider } from "react-router-dom";

import { router } from "../routes/router";
import { AuthFlowProvider } from "../features/auth/AuthFlowContext";

export function App() {
  return (
    <AuthFlowProvider>
      <RouterProvider router={router} />
    </AuthFlowProvider>
  );
}
