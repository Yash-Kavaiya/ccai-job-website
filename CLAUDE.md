# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Job Alchemist — a job platform with two user roles (candidates and recruiters). Candidates search/apply for jobs and manage resumes; recruiters post jobs and manage applications. Built on Firebase (serverless) with a React SPA frontend.

## Repository Layout

All application code lives in the `AI Job Alchemist/` subdirectory. The root contains CI/CD (`.github/workflows/`), Firebase config (`firebase.json`, `firestore.rules`, `storage.rules`), and deployment files (`Dockerfile`, `nginx.conf`, `netlify.toml`).

## Commands

All commands must be run from the `AI Job Alchemist/` directory:

```bash
npm install                  # Install dependencies (use --legacy-peer-deps if conflicts)
npm run dev                  # Vite dev server on http://localhost:5173
npm run build                # TypeScript check + Vite production build
npm run lint                 # ESLint
npm run preview              # Preview production build
npx playwright test          # Run E2E tests (Chromium only, auto-starts dev server)
npx playwright test tests/e2e/some.spec.ts  # Run a single E2E test file
```

## Tech Stack

- **React 18** + **TypeScript 5.7** + **Vite 6**
- **Tailwind CSS 3** + **shadcn/ui** (Radix UI primitives in `src/components/ui/`)
- **Zustand 5** for state management (stores in `src/store/`)
- **React Router 6** for routing (all routes defined in `src/App.tsx`)
- **React Hook Form** + **Zod** for form validation
- **Firebase 12**: Auth, Firestore, Storage, Analytics
- **Playwright** for E2E testing

## Architecture

### Path Alias
`@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.json`).

### State Management
Zustand stores in `src/store/` — each domain has its own store file (e.g., `auth-store.ts`, `job-matching-store.ts`, `recruiter-store.ts`, `resume-store.ts`). Stores persist to localStorage and interact with Firebase services directly.

### Firebase Services
`src/lib/firebase.ts` exports initialized Firebase instances (`auth`, `db`, `storage`, `analytics`, `googleProvider`, `githubProvider`). Service modules in `src/services/` wrap Firestore operations (e.g., `jobService` for CRUD on the `jobs` collection).

### Auth & Routing
- Auth providers: Google OAuth, GitHub OAuth, Email/Password
- `ProtectedRoute` — requires authentication
- `RoleBasedRoute` — restricts by role (`candidate` or `recruiter`), checks onboarding completion
- `DashboardRedirect` — routes `/dashboard` to the correct role-specific dashboard
- Recruiter routes are under `/recruiter/*`; candidate routes under `/candidate/*`

### UI Components
shadcn/ui components live in `src/components/ui/`. Feature components are organized by domain: `src/components/auth/`, `src/components/jobs/`, `src/components/recruiter/`, `src/components/resume/`, etc.

### Firestore Collections
- `users` — user profiles with `role` field (`candidate` | `recruiter`)
- `jobs` — job postings (publicly readable, recruiter-writable)
- `applications` — job applications (authenticated users)
- `resumes` — resume data (owner or recruiter access)
- `recruiterProfiles` — recruiter company info

### TypeScript Config
Strict mode is relaxed: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `noUnusedParameters: false`. This means the codebase tolerates implicit `any` and nullable access without checks.

## Environment Variables

All prefixed with `VITE_` (Vite convention). Copy `.env.example` to `.env` and fill in Firebase credentials:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

## Deployment

- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`) — builds Docker image, pushes to Google Artifact Registry, deploys to Cloud Run on push to `main`
- **Cloud Run**: 1 CPU, 512MB RAM, 0-10 instances, port 8080
- **Alternative**: Netlify (`netlify.toml`) or Firebase Hosting (`firebase.json`)
