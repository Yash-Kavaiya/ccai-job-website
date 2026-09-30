# AI Job Alchemist

Job platform (candidates + recruiters) built as a React/Vite SPA on Firebase.

## Deploy

Production hosting is on **Vercel**.

- **Typecheck and build** (`.github/workflows/ci.yml`) runs `npm ci` and `npm run build` on pushes and PRs to `main`. It does not need Vercel credentials.
- **Deploy to Vercel** (`.github/workflows/deploy.yml`) deploys only when `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set as GitHub Actions secrets. If any of them is missing, that workflow fails before calling the Vercel CLI and names the missing secret.

Setup instructions (Vercel project, GitHub secrets, Firebase env vars): [`AI Job Alchemist/DEPLOYMENT.md`](./AI%20Job%20Alchemist/DEPLOYMENT.md)

## Local development

```bash
cd "AI Job Alchemist"
npm install --legacy-peer-deps
cp .env.example .env   # fill in VITE_FIREBASE_* values
npm run dev
```
