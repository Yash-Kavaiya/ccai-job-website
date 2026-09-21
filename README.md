# AI Job Alchemist

Job platform (candidates + recruiters) built as a React/Vite SPA on Firebase.

## Deploy

Production hosting is on **Vercel**. CI/CD runs from `.github/workflows/deploy.yml` on pushes and PRs to `main`.

Setup instructions (Vercel project, GitHub secrets, Firebase env vars): [`AI Job Alchemist/DEPLOYMENT.md`](./AI%20Job%20Alchemist/DEPLOYMENT.md)

## Local development

```bash
cd "AI Job Alchemist"
npm install --legacy-peer-deps
cp .env.example .env   # fill in VITE_FIREBASE_* values
npm run dev
```
