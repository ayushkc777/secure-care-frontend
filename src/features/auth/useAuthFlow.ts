import { useContext } from "react";

import { AuthFlowContext, type AuthFlowValue } from "./auth-flow-context";

export function useAuthFlow(): AuthFlowValue {
  const value = useContext(AuthFlowContext);
  if (value === null) throw new Error("useAuthFlow must be used inside AuthFlowProvider");
  return value;
}
