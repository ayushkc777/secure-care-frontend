import { createContext } from "react";

import type { MfaSetup } from "./auth.types";

export type AuthFlowValue = {
  challengeToken: string | null;
  challengeExpiresAt: string | null;
  recoveryCodes: readonly string[];
  setup: MfaSetup | null;
  clearChallenge: () => void;
  clearRecoveryCodes: () => void;
  clearSetup: () => void;
  setChallenge: (token: string, expiresAt: string) => void;
  setRecoveryCodes: (codes: readonly string[]) => void;
  setSetup: (setup: MfaSetup) => void;
};

export const AuthFlowContext = createContext<AuthFlowValue | null>(null);
