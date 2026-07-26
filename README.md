# SecureCare Frontend

React, TypeScript, Vite, Tailwind CSS and the SecureCare authentication, authorisation,
childcare and Phase 8 secure pickup interface.

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
npm test
npm run build
```

Phase 8 adds a role-aware pickup workspace. Parents can manage authorisations and reveal
a newly generated code once. Educators can verify and complete an authorised pickup.
Managers and Administrators with the separate override permission can record an
emergency override after recent MFA. The backend remains the authorisation boundary;
hiding a control is only a usability measure.

Pickup codes, authorisation lists, child records and verification state are never
placed in browser storage. QR, incident, attendance, medication, notification,
payment, upload, biometric and dashboard features remain deferred. The open React
Router advisory and its temporary mitigation remain recorded in
[`docs/security/dependency-risk-register.md`](docs/security/dependency-risk-register.md).
