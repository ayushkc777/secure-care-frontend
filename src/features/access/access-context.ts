import { createContext } from "react";

import type { AccessState } from "./access.types";

export type AccessContextValue = AccessState & {
  refresh: () => Promise<void>;
};

export const AccessContext = createContext<AccessContextValue | null>(null);
