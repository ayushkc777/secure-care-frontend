export type AuthenticationState = "MFA_REQUIRED" | "MFA_ENROLMENT_REQUIRED" | "MFA_AUTHENTICATED";

export type SessionSummary = {
  authenticated: true;
  authenticationState: AuthenticationState;
  user: { id: string };
  session: {
    id: string;
    createdAt: string;
    lastSeenAt: string;
    idleExpiresAt: string;
    absoluteExpiresAt: string;
    mfaVerifiedAt: string | null;
    stepUpExpiresAt: string | null;
  };
};

export type LoginResponse =
  | {
      authenticationState: "MFA_REQUIRED";
      challengeToken: string;
      expiresAt: string;
    }
  | {
      authenticationState: "MFA_ENROLMENT_REQUIRED";
      session: { id: string; absoluteExpiresAt: string; idleExpiresAt: string };
    };

export type MfaSetup = {
  manualSecret: string;
  otpauthUri: string;
  expiresAt: string;
};
