import { useMemo, useState, type ReactNode } from "react";

import { AuthFlowContext, type AuthFlowValue } from "./auth-flow-context";
import type { MfaSetup } from "./auth.types";

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeExpiresAt, setChallengeExpiresAt] = useState<string | null>(null);
  const [recoveryCodes, updateRecoveryCodes] = useState<readonly string[]>([]);
  const [setup, updateSetup] = useState<MfaSetup | null>(null);

  const value = useMemo<AuthFlowValue>(
    () => ({
      challengeToken,
      challengeExpiresAt,
      recoveryCodes,
      setup,
      clearChallenge: () => {
        setChallengeToken(null);
        setChallengeExpiresAt(null);
      },
      clearRecoveryCodes: () => updateRecoveryCodes([]),
      clearSetup: () => updateSetup(null),
      setChallenge: (token, expiresAt) => {
        setChallengeToken(token);
        setChallengeExpiresAt(expiresAt);
      },
      setRecoveryCodes: (codes) => updateRecoveryCodes([...codes]),
      setSetup: updateSetup,
    }),
    [challengeExpiresAt, challengeToken, recoveryCodes, setup],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}
