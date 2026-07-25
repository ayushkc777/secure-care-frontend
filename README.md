# SecureCare Frontend

React, TypeScript, Vite, Tailwind CSS and the SecureCare authentication, authorisation
and Phase 7 childcare interface.

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

Phase 7 adds server-scoped centre workspaces, rooms, reduced child lists, child details,
parent relationships and current-room assignment controls. Managers receive only the
controls permitted for their centre; Educators and Parents receive read-only views.
The backend remains the authorisation boundary, and hiding a control is only a
usability measure. Permissions are refreshed from the API, and session tokens and
child data are never placed in browser storage.

Pickup, incident, attendance, medication, notification, payment, upload and dashboard
features remain deferred. The open React Router advisory and its temporary mitigation
are recorded in
[`docs/security/dependency-risk-register.md`](docs/security/dependency-risk-register.md).
