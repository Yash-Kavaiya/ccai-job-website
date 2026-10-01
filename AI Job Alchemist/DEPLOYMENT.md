# Deployment Guide — Vercel with GitHub Actions

This guide explains how to deploy the AI Job Alchemist Vite SPA to Vercel using GitHub Actions.

## Prerequisites

- A [Vercel](https://vercel.com) account
- Access to this GitHub repository
- Firebase project credentials (`VITE_FIREBASE_*`)

## Step 1: Create a Vercel Project

1. Install the Vercel CLI locally (optional but recommended):

```bash
npm install -g vercel
```

2. From the app directory, link the project:

```bash
cd "AI Job Alchemist"
vercel link
```

When prompted, create a new project (or link an existing one). Set the **Root Directory** to `AI Job Alchemist` if linking from the monorepo root in the Vercel dashboard.

3. Note the values written to `.vercel/project.json`:

- `orgId` → GitHub secret `VERCEL_ORG_ID`
- `projectId` → GitHub secret `VERCEL_PROJECT_ID`

## Step 2: Create a Vercel Token

1. Open [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Create a token with access to the target team/project
3. Save it as GitHub secret `VERCEL_TOKEN`

## Step 3: Configure Environment Variables on Vercel

In the Vercel project → **Settings → Environment Variables**, add these for Production, Preview, and Development:

| Name | Example |
|------|---------|
| `VITE_FIREBASE_API_KEY` | your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your_project_id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your_project_id.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your messaging sender ID |
| `VITE_FIREBASE_APP_ID` | your Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | your Analytics measurement ID (optional) |

These are applied on Vercel during the remote build from GitHub Actions / Git integration.

## Step 4: Add GitHub Secrets

In the repository → **Settings → Secrets and variables → Actions**, add:

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | Vercel account token |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

## Step 5: Deploy

Push to `main` (or run the workflow manually):

```bash
git push origin main
```

Two workflows run on pushes and pull requests to `main`:

| Workflow | File | Needs Vercel secrets? |
|----------|------|------------------------|
| Typecheck and build | `.github/workflows/ci.yml` | No. Runs `npm ci` and `npm run build` (`tsc -b && vite build`) in `AI Job Alchemist/`. |
| Deploy to Vercel | `.github/workflows/deploy.yml` | Yes for real deploys. On pull requests (and `workflow_dispatch`), missing `VERCEL_*` secrets skip the deploy with a notice (CI stays green). On push to `main`, missing secrets still fail so production misconfig is visible. |

When the three secrets are set, Deploy to Vercel will:

1. Link the project via `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`
2. Run `vercel deploy` so the build happens on Vercel (where Vite/devDependencies resolve correctly)
3. Use `--prod` on `main`, preview deploys on same-repo PRs

Pull requests opened from forks do not receive these secrets, so the deploy job is skipped for them. Typecheck still runs. The Vercel Git integration may also create its own preview deployment in parallel.

Check the GitHub Actions tab for the deployment URL.

### Node version

`.nvmrc` is `18`. GitHub Actions installs **Node 20** for both workflows (Node 18 is end of life). `actions/checkout` and `actions/setup-node` are on major v7, which run on the Actions Node 24 runtime. That runtime is only for the actions themselves; the app build uses Node 20.

## SPA Routing

`vercel.json` rewrites all routes to `/index.html` so React Router deep links work on refresh.

## Local Preview

```bash
cd "AI Job Alchemist"
npm install --legacy-peer-deps
npm run build
npx vercel --prod   # or: npx vercel   for a preview deploy
```

## Troubleshooting

### Deploy fails with "Missing Vercel GitHub Actions secrets"

The deploy log names each unset secret (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). Add them in the repository settings. An empty `--token` is not passed to the CLI. Typecheck and build can still be green in the other workflow.

### Missing env vars at build time

Ensure all `VITE_FIREBASE_*` variables are set in the Vercel project for the environment being deployed (Production vs Preview). Re-run the workflow after updating them.

### Wrong root directory

The app lives in `AI Job Alchemist/`. In the Vercel dashboard, set **Root Directory** to `AI Job Alchemist`, or always run the CLI from that folder.

### Auth / CORS after deploy

Add your Vercel domain (e.g. `*.vercel.app` and any custom domain) to Firebase Authentication → Authorized domains.
