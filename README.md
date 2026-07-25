# SecureCare Frontend

React, TypeScript, Vite, and Tailwind CSS foundation for SecureCare.

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

The Phase 2 pages are intentionally navigation-only placeholders. Authentication and childcare
features are not implemented.
