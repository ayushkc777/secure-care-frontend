# SecureCare Frontend

React, TypeScript, Vite, Tailwind CSS and the SecureCare authentication, authorisation,
childcare, secure pickup, incident, safeguarding, attendance, health, medication, and
Phase 12 secure communication interface.

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

Registration is available at `/register`. The UI performs strict password-policy and
zxcvbn strength feedback before sending only email and password to the existing CSRF-
protected registration endpoint. The server remains authoritative and returns a generic
anti-enumeration response; no plaintext password is persisted in the browser.

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Interface system

The application uses a local SecureCare design system rather than a dashboard framework.
The responsive role-aware shell, operational states, accessibility decisions and security
boundaries are documented in
[`docs/design/design-system.md`](docs/design/design-system.md). The findings that motivated
the redesign are recorded in [`docs/design/ui-ux-audit.md`](docs/design/ui-ux-audit.md).

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

Phase 11 adds permission-aware health summaries, allergy and medical alerts, Parent
medication-authorisation forms, Manager approval/lifecycle actions, active schedules,
Educator administration outcomes, history, suspension/discontinuation and append-only
correction workflows. The UI uses strict Zod validation and server-derived permissions;
recent MFA, centre isolation, Parent relationship checks and lifecycle enforcement remain
backend security boundaries. Sensitive health and medication responses remain in React
memory only.

Phase 12 adds role-aware Parent and staff inboxes, child-specific conversation threads,
plaintext-only replies, read receipts, append-only corrections, announcements,
acknowledgements, notification delivery states, dismissal and in-application preferences.
Message and notification responses remain in React memory only. The backend remains the
source of truth for participants, audience, relationships, centre scope, recent MFA and
lifecycle transitions.

Phase 13 adds a role-aware report catalogue, bounded date/room/child/status filters,
summary cards, accessible chart alternatives, paginated tables, printable views and
recent-MFA-protected CSV exports. Report responses and temporary download blobs are never
placed in browser storage. CSV formula hardening, relationship filtering, centre isolation
and export auditing remain enforced by the backend.

Pickup codes, authorisation lists, child records and verification state are also never
placed in browser storage. Payment, upload, external notification delivery, predictive
analytics, biometric and GPS features remain deferred. The open React
Router advisory and its temporary mitigation remain recorded in
[`docs/security/dependency-risk-register.md`](docs/security/dependency-risk-register.md).
Phase 14 also adds production document CSP, framing, content-type, referrer,
permissions and cross-origin isolation headers. TLS/HSTS remain deployment-edge
responsibilities and are completed in the production-readiness guidance.

Phase 15 lazy-loads every route. The production entry JavaScript decreased from
627.18 kB (182.82 kB gzip) to 422.92 kB (132.21 kB gzip); route code is emitted in
separate chunks and the previous 500 kB warning is gone. The production Nginx image exposes
the API through same-origin proxy paths and allows no development API origin in its CSP.
