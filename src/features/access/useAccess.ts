import { useContext } from "react";

import { AccessContext, type AccessContextValue } from "./access-context";

export function useAccess(): AccessContextValue {
  const value = useContext(AccessContext);
  if (value === null) throw new Error("useAccess must be used inside AccessProvider");
  return value;
}
