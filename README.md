# SecureCare Frontend

React, TypeScript, Vite, Tailwind CSS and the SecureCare authentication and Phase 6
authorisation interface.

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

Phase 6 adds server-derived access state, protected route handling,
permission-aware navigation, current-access details, role-assignment controls,
limited security metadata and a child-access proof form. The backend remains the
authorisation boundary; hiding a page or control is only a usability measure.
Permissions are refreshed from the API and session tokens are never placed in
browser storage.

The childcare, pickup, incident, notification and payment pages remain Phase 2
placeholders. The open React Router advisory and its temporary mitigation are
recorded in
[`docs/security/dependency-risk-register.md`](docs/security/dependency-risk-register.md).
