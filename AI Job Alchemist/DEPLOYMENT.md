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

These are pulled into the CI build via `vercel pull` / `vercel build`.

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

The workflow in `.github/workflows/deploy.yml` will:

1. Pull Vercel project + env config
2. Build with `vercel build`
3. Deploy prebuilt artifacts (`--prod` on `main`, preview on PRs)

Check the GitHub Actions tab for the deployment URL.

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

### Missing env vars at build time

Ensure all `VITE_FIREBASE_*` variables are set in the Vercel project for the environment being deployed (Production vs Preview). Re-run the workflow after updating them.

### Wrong root directory

The app lives in `AI Job Alchemist/`. In the Vercel dashboard, set **Root Directory** to `AI Job Alchemist`, or always run the CLI from that folder.

### Auth / CORS after deploy

Add your Vercel domain (e.g. `*.vercel.app` and any custom domain) to Firebase Authentication → Authorized domains.
