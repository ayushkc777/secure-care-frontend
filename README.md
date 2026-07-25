# SecureCare Frontend

React, TypeScript, Vite, Tailwind CSS and the Phase 5 authentication interface for
SecureCare.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Local development

```bash
cp .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Phase 5 implements only the login and MFA interfaces: TOTP verification and
enrolment, local QR rendering, recovery-code login and one-time display, step-up,
MFA management, mandatory-enrolment notice and current session status. Opaque
session tokens remain in Secure HttpOnly cookies. Temporary challenges, setup
secrets and recovery codes are held only in React memory and disappear when their
flow ends or the page reloads.

The non-authentication Phase 2 pages remain navigation-only placeholders. No RBAC
or childcare behaviour is implemented.
