# AI Job Alchemist

Job platform (candidates + recruiters) built as a React/Vite SPA on Firebase.

## Deploy

Production hosting is on **Vercel**.

- **Typecheck and build** (`.github/workflows/ci.yml`) runs `npm ci` and `npm run build` on pushes and PRs to `main`. It does not need Vercel credentials.
- **Deploy to Vercel** (`.github/workflows/deploy.yml`) deploys when `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set as GitHub Actions secrets. On pull requests, missing secrets skip deploy with a notice (CI stays green). On push to `main`, missing secrets still fail the job.

Setup instructions (Vercel project, GitHub secrets, Firebase env vars): [`AI Job Alchemist/DEPLOYMENT.md`](./AI%20Job%20Alchemist/DEPLOYMENT.md)

## Local development

```bash
cd "AI Job Alchemist"
npm install --legacy-peer-deps
cp .env.example .env   # fill in VITE_FIREBASE_* values
npm run dev
```
