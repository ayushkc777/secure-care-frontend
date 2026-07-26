# SecureCare Frontend

React, TypeScript, Vite, Tailwind CSS and the SecureCare authentication, authorisation,
childcare, secure pickup, incident, safeguarding, and Phase 10 attendance interface.

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

Phase 10 adds a role-aware daily attendance workspace, room headcounts, explicit check-in,
check-out, absence, movement and return controls, plus a safe related-child history view.
Attendance responses remain in memory only; the interface does not use browser storage.

Phase 9 adds permission-aware incident centre/list, draft, detail, review,
Parent-acknowledgement, immutable-history and separately guarded safeguarding pages. Sensitive
incident and safeguarding state remains in memory and is never placed in browser storage.
The backend remains authoritative for centre, child, lifecycle, Parent relationship and
safeguarding access.

Pickup codes, authorisation lists, child records and verification state are also never
placed in browser storage. Attendance, medication, notification, payment, upload, external
reporting, biometric and dashboard features remain deferred. The open React
Router advisory and its temporary mitigation remain recorded in
[`docs/security/dependency-risk-register.md`](docs/security/dependency-risk-register.md).
