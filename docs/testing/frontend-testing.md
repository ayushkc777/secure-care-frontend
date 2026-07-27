# Frontend verification

`npm test` runs unit and DOM interaction tests. `npm run test:a11y` runs the focused
keyboard/dialog/axe set, and `npm run test:coverage` enforces the measured baseline. The
current local result is 34 files, 76 tests and 18.67% line coverage; this is an initial
regression floor, not comprehensive UI coverage.

`npm run verify:build` builds the production bundle and rejects mixed API-prefix ownership
or a duplicated prefix in source/build output. `npm run test:e2e` targets the local
production Docker stack and completes registration, Mailpit verification, password reset,
CSRF requests and effective API-path checks through Nginx.

Playwright prerequisites:

```bash
npm run test:e2e:install
E2E_BASE_URL=http://localhost:18080 \
E2E_MAILPIT_URL=http://127.0.0.1:18025 \
npm run test:e2e
```

Role-fixture Parent, Educator and Manager browser workflows still require safe test
provisioning and are not represented as completed by the public-account smoke test.
