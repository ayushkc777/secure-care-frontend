# Hosted CI rerun and repository protection

GitHub-hosted execution remains pending while the repository account billing lock prevents
runner startup. After it is resolved, rerun `Frontend CI`, `Security Scanning` and `CodeQL`
on the final commit and retain coverage/SBOM/browser artifacts. Do not treat local execution
as hosted evidence.

Protect `main`: require pull requests, conversation resolution and required checks; block
force pushes and deletion; dismiss stale approvals; and limit bypass. Enable Dependabot and
secret scanning where the plan allows.

Local equivalent:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run test:a11y
npm run verify:build
npm audit
docker build --target production -t securecare-frontend:verify .
```
