# CLAUDE.md - AI Assistant Guide

> **Last Updated:** 2025-11-14
> **Project:** CCAI Jobs - AI-Powered Career Platform by Easy AI Labs

This document provides comprehensive guidance for AI assistants (like Claude) working on this codebase. It outlines the project structure, development workflows, and key conventions to follow.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [State Management](#state-management)
6. [Routing & Navigation](#routing--navigation)
7. [Component Organization](#component-organization)
8. [Styling Guidelines](#styling-guidelines)
9. [Development Workflows](#development-workflows)
10. [Key Conventions](#key-conventions)
11. [Common Tasks](#common-tasks)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**CCAI Jobs** is an AI-powered career platform designed to help job seekers find opportunities, prepare resumes, practice interviews, and connect with professional networks. The platform features:

- **Job Search & Matching**: AI-powered job recommendations and search
- **Resume Builder**: ATS-optimized resume creation and analysis
- **Interview Prep**: AI-driven interview question practice
- **Social Networking**: Professional profile sharing and connections
- **AI Agents**: Specialized AI assistants for various career tasks
- **Authentication**: OTP-based email authentication via Devv AI backend

---

## Tech Stack

### Core Technologies
- **React 18.2.0** - UI library
- **TypeScript 5.7.2** - Type-safe JavaScript
- **Vite 6.3.1** - Build tool and dev server
- **React Router 7.5.1** - Client-side routing

### Styling & UI
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **shadcn/ui** - Pre-built accessible components (New York style)
- **Lucide React** - Icon library
- **tailwindcss-animate** - Animation utilities

### State Management
- **Zustand** - Lightweight state management with persistence

### Development Tools
- **ESLint** - Code linting with TypeScript and React hooks support
- **PostCSS** - CSS processing with Autoprefixer

### Package Manager
- **bun** (recommended) or **npm** - Faster dependency management

---

## Directory Structure

```
ccai-job-website/
├── public/                    # Static assets
├── src/
│   ├── components/           # React components
│   │   ├── agents/          # AI agent components
│   │   ├── auth/            # Authentication components (ProtectedRoute)
│   │   ├── interview/       # Interview prep components
│   │   ├── jobs/            # Job search components
│   │   ├── layout/          # Layout components (DashboardLayout, Sidebar, Header)
│   │   ├── resume/          # Resume builder components
│   │   ├── social/          # Social networking components
│   │   └── ui/              # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── data/                # Static data and constants
│   │   └── interview-questions.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── pages/               # Page-level components
│   │   ├── AIAgentsPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── InterviewPage.tsx
│   │   ├── JobSearchPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── PublicProfilePage.tsx
│   │   ├── ResumePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── SocialPage.tsx
│   ├── store/               # Zustand state stores
│   │   ├── ai-agents-store.ts
│   │   ├── auth-store.ts
│   │   ├── interview-scheduling-store.ts
│   │   ├── interview-store.ts
│   │   ├── job-matching-store.ts
│   │   ├── resume-store.ts
│   │   ├── settings-store.ts
│   │   └── social-store.ts
│   ├── App.tsx              # Main application with routing
│   ├── SimpleApp.tsx        # Simplified app entry point
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles and CSS variables
├── components.json          # shadcn/ui configuration
├── tailwind.config.js       # Tailwind configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint configuration
└── package.json             # Project dependencies
```

---

## Architecture Patterns

### 1. **Feature-Based Organization**
Components are organized by feature domain (jobs, resume, interview, social, agents) rather than by type. This makes it easier to find and maintain related code.

### 2. **Page-Component Pattern**
- **Pages** (`src/pages/`) are route-level components that compose smaller components
- **Components** are reusable UI pieces organized by feature
- **Layout** components provide consistent structure across pages

### 3. **Separation of Concerns**
- **UI components** (`components/ui/`) are pure presentation components from shadcn/ui
- **Feature components** contain business logic and compose UI components
- **Stores** manage application state separately from UI
- **Hooks** encapsulate reusable logic

### 4. **Protected Route Pattern**
Routes requiring authentication are wrapped with `<ProtectedRoute>` which checks authentication state and redirects to home if unauthenticated.

---

## State Management

### Zustand Pattern

All state is managed using **Zustand** with the following conventions:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  // State properties
  data: SomeType | null;
  isLoading: boolean;

  // Actions (methods that modify state)
  fetchData: () => Promise<void>;
  updateData: (data: SomeType) => void;
  reset: () => void;
}

export const useStoreNameStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      data: null,
      isLoading: false,

      // Actions
      fetchData: async () => {
        set({ isLoading: true });
        try {
          // Fetch logic
          set({ data: result, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateData: (data) => set({ data }),
      reset: () => set({ data: null, isLoading: false }),
    }),
    {
      name: 'store-name-key', // localStorage key
      partialize: (state) => ({
        // Only persist specific fields
        data: state.data
      }),
    }
  )
);
```

### Existing Stores

1. **auth-store.ts** - User authentication (OTP), session management
2. **job-matching-store.ts** - Job search, filtering, saved jobs
3. **resume-store.ts** - Resume creation, ATS analysis
4. **interview-store.ts** - Interview questions, practice sessions
5. **interview-scheduling-store.ts** - Interview scheduling logic
6. **social-store.ts** - Social profiles, connections
7. **ai-agents-store.ts** - AI agent configurations and interactions
8. **settings-store.ts** - User preferences and settings

### Usage in Components

```typescript
import { useAuthStore } from '@/store/auth-store';

function MyComponent() {
  // Select only needed state/actions (prevents unnecessary re-renders)
  const { isAuthenticated, user } = useAuthStore();
  const login = useAuthStore(state => state.sendOTP);

  // Use in component
}
```

---

## Routing & Navigation

### Route Structure

The app uses **React Router v7** with the following route pattern:

```typescript
<BrowserRouter>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<HomePage />} />
    <Route path="/profile/:profileSlug" element={<PublicProfilePage />} />

    {/* Protected Routes (require auth) */}
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      </ProtectedRoute>
    } />

    {/* 404 Fallback */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

### Protected Routes

All authenticated pages are wrapped in:
1. **`<ProtectedRoute>`** - Checks authentication and redirects if needed
2. **`<DashboardLayout>`** - Provides sidebar, header, and consistent layout

### Navigation

- Use `<Link>` from `react-router-dom` for internal navigation
- Use `useNavigate()` hook for programmatic navigation
- Sidebar navigation is defined in `src/components/layout/Sidebar.tsx`

---

## Component Organization

### UI Components (`src/components/ui/`)

Pre-built components from **shadcn/ui** following the New York style:
- Fully accessible (follows WAI-ARIA)
- Customizable via Tailwind classes
- Located in `components/ui/`
- Never modify these directly; extend or wrap them instead

**Common components:**
- `Button`, `Card`, `Dialog`, `Dropdown`, `Input`, `Select`
- `Table`, `Tabs`, `Toast`, `Tooltip`, `Avatar`
- `Alert`, `Badge`, `Skeleton`, `Separator`
- `Sheet`, `Popover`, `Command`, `Calendar`

### Feature Components

Organized by domain:
- **agents/** - AI agent cards, configurations
- **auth/** - Login forms, protected route wrapper
- **interview/** - Question lists, practice sessions
- **jobs/** - Job cards, filters, search
- **layout/** - Sidebar, header, dashboard wrapper
- **resume/** - Resume builder, upload, ATS checker
- **social/** - Profile cards, social sharing

### Layout Components

1. **DashboardLayout** - Main authenticated layout with sidebar
2. **Sidebar** - Navigation menu for authenticated users
3. **Header** - Top bar with user menu and notifications

---

## Styling Guidelines

### Tailwind CSS

The project uses **Tailwind CSS** with a custom configuration:

1. **CSS Variables** for theming (defined in `src/index.css`)
2. **Dark mode** support via class-based switching
3. **Custom colors** using HSL color space
4. **Responsive utilities** (sm, md, lg, xl, 2xl breakpoints)

### Color System

Colors are defined as CSS variables and accessed via Tailwind:

```css
/* In index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* etc... */
}

.dark {
  --background: 222.2 84% 4.9%;
  /* Dark mode overrides */}
```

```tsx
// In components
<div className="bg-background text-foreground">
  <Button variant="default">Primary Action</Button>
</div>
```

### Component Styling Best Practices

1. **Use Tailwind utilities first**
   ```tsx
   <div className="flex items-center gap-4 p-6 rounded-lg bg-card">
   ```

2. **Use `cn()` helper for conditional classes**
   ```tsx
   import { cn } from '@/lib/utils';

   <div className={cn(
     "base classes",
     isActive && "active classes",
     className // Allow prop overrides
   )} />
   ```

3. **Leverage CSS variables for theming**
   ```tsx
   <div className="bg-primary text-primary-foreground">
   ```

4. **Responsive design**
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

### Icon Usage

Use **Lucide React** for all icons:

```tsx
import { Search, User, Settings } from 'lucide-react';

<Search className="h-4 w-4" />
```

---

## Development Workflows

### Starting Development

```bash
# Install dependencies (recommended: bun)
bun install

# Start dev server (http://localhost:5173)
bun dev

# Alternative with npm
npm install
npm run dev
```

### Building for Production

```bash
# Build optimized production bundle
bun run build

# Preview production build locally
bun run preview
```

### Linting

```bash
# Run ESLint
bun run lint

# Auto-fix issues
bunx eslint . --fix
```

### Adding shadcn/ui Components

```bash
# Add a new component (example: dropdown-menu)
bunx shadcn@latest add dropdown-menu

# Components are automatically added to src/components/ui/
```

### TypeScript Configuration

- **Strict mode is relaxed** for rapid development:
  - `noImplicitAny: false`
  - `noUnusedParameters: false`
  - `strictNullChecks: false`
- Use types where beneficial, but don't let it slow you down
- Path aliases configured: `@/*` maps to `src/*`

---

## Key Conventions

### For AI Assistants Working on This Codebase

#### 1. **File and Component Naming**
- Components: **PascalCase** (e.g., `UserProfile.tsx`)
- Utilities/Hooks: **kebab-case** (e.g., `use-auth.ts`)
- Stores: **kebab-case** with `-store` suffix (e.g., `auth-store.ts`)

#### 2. **Import Aliases**
Always use path aliases for imports:

```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

// ❌ Avoid
import { Button } from '../../components/ui/button';
```

#### 3. **Component Structure**
Follow this order in component files:

```typescript
// 1. External imports
import { useState } from 'react';
import { Link } from 'react-router-dom';

// 2. Internal imports (components)
import { Button } from '@/components/ui/button';

// 3. Store/hooks imports
import { useAuthStore } from '@/store/auth-store';

// 4. Type definitions
interface MyComponentProps {
  title: string;
}

// 5. Component definition
export function MyComponent({ title }: MyComponentProps) {
  // Component logic
}
```

#### 4. **State Management**
- **Use Zustand stores** for global state (auth, jobs, resumes, etc.)
- **Use React's useState** for local component state only
- **Never duplicate state** between stores and components
- Always check if a store exists before creating new state

#### 5. **Async Operations**
Handle async operations with loading and error states:

```typescript
const fetchData = async () => {
  set({ isLoading: true, error: null });
  try {
    const result = await api.fetch();
    set({ data: result, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
    console.error('Fetch failed:', error);
  }
};
```

#### 6. **Authentication**
- Authentication uses **OTP (One-Time Password)** via email
- Backend is provided by **@devvai/devv-code-backend**
- Protected routes redirect to `/` if not authenticated
- User session persists via Zustand's persist middleware

#### 7. **Routing**
- All authenticated pages must use `<ProtectedRoute>` wrapper
- Most authenticated pages use `<DashboardLayout>` for consistency
- Use semantic URLs (e.g., `/jobs`, `/resume`, `/interview`)

#### 8. **Error Handling**
- Always catch and log errors in async operations
- Show user-friendly error messages via Toast notifications
- Never let errors crash the app silently

#### 9. **Accessibility**
- All interactive elements must be keyboard accessible
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- shadcn/ui components are pre-built with accessibility
- Add `aria-label` for icon-only buttons

#### 10. **Performance**
- Lazy load heavy pages/components where appropriate
- Minimize Zustand selector scope (select only needed state)
- Use React.memo() for expensive components if needed
- Avoid inline function definitions in render (use useCallback)

---

## Common Tasks

### Adding a New Page

1. **Create page component** in `src/pages/NewPage.tsx`:
   ```tsx
   export function NewPage() {
     return <div>New Page Content</div>;
   }
   ```

2. **Add route** in `src/App.tsx`:
   ```tsx
   <Route path="/new-page" element={
     <ProtectedRoute>
       <DashboardLayout>
         <NewPage />
       </DashboardLayout>
     </ProtectedRoute>
   } />
   ```

3. **Add navigation** in `src/components/layout/Sidebar.tsx` (if needed)

### Adding a New Store

1. **Create store file** `src/store/feature-store.ts`:
   ```tsx
   import { create } from 'zustand';
   import { persist } from 'zustand/middleware';

   interface FeatureState {
     data: any;
     fetchData: () => Promise<void>;
   }

   export const useFeatureStore = create<FeatureState>()(
     persist(
       (set) => ({
         data: null,
         fetchData: async () => {
           // Implementation
         },
       }),
       { name: 'feature-store' }
     )
   );
   ```

2. **Use in components**:
   ```tsx
   import { useFeatureStore } from '@/store/feature-store';

   const data = useFeatureStore(state => state.data);
   ```

### Adding a New UI Component from shadcn

```bash
bunx shadcn@latest add [component-name]

# Example:
bunx shadcn@latest add dropdown-menu
```

Then import and use:
```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
```

### Modifying Tailwind Theme

Edit `tailwind.config.js`:
```javascript
export default {
  theme: {
    extend: {
      colors: {
        // Add custom colors
      },
      spacing: {
        // Add custom spacing
      },
    },
  },
};
```

For semantic colors, edit CSS variables in `src/index.css`.

---

## Troubleshooting

### Common Issues

#### 1. **Import errors for components**
**Problem:** `Cannot find module '@/components/...'`

**Solution:** Check that `vite.config.ts` has the alias configured:
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

#### 2. **TypeScript errors on Zustand stores**
**Problem:** Type errors when using stores

**Solution:** Always type your store interface and use it:
```typescript
export const useStore = create<StoreInterface>()(...)
```

#### 3. **Authentication loop (redirects constantly)**
**Problem:** Protected routes keep redirecting

**Solution:** Check that `auth-store.ts` properly persists authentication state:
```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'aijobhub-auth',
    partialize: (state) => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user
    }),
  }
)
```

#### 4. **Styles not applying**
**Problem:** Tailwind classes don't work

**Solution:**
- Ensure file is included in `tailwind.config.js` content array
- Check that CSS variable is defined in `src/index.css`
- Restart dev server after config changes

#### 5. **Build failures**
**Problem:** `bun run build` fails with TypeScript errors

**Solution:**
- Fix TypeScript errors or adjust `tsconfig.json` strictness
- Check for unused imports
- Ensure all dependencies are installed

---

## Authentication Flow

The app uses **OTP-based email authentication**:

1. User enters email on HomePage
2. `auth.sendOTP(email)` sends verification code
3. User enters OTP code
4. `auth.verifyOTP(email, code)` validates and returns user
5. User session stored in `auth-store` and persisted to localStorage
6. `isAuthenticated` flag gates access to protected routes

**Backend Integration:**
```typescript
import { auth } from '@devvai/devv-code-backend';

// Send OTP
await auth.sendOTP(email);

// Verify OTP
const response = await auth.verifyOTP(email, code);
// Returns: { user: { projectId, uid, name, email, createdTime, lastLoginTime } }

// Logout
await auth.logout();
```

---

## Final Notes for AI Assistants

### Development Philosophy
- **Move fast, iterate quickly** - TypeScript strict mode is relaxed for rapid prototyping
- **Component reusability** - Abstract common patterns into reusable components
- **User experience first** - Prioritize responsiveness and accessibility
- **Consistent patterns** - Follow existing code style and architecture

### When Making Changes
1. ✅ **DO** check existing stores before creating new state
2. ✅ **DO** use shadcn/ui components for new UI elements
3. ✅ **DO** test authentication flows after auth-related changes
4. ✅ **DO** use TypeScript interfaces for props and state
5. ✅ **DO** follow the established directory structure

6. ❌ **DON'T** modify `components/ui/` files directly (regenerate via shadcn CLI)
7. ❌ **DON'T** use inline styles (use Tailwind classes)
8. ❌ **DON'T** create duplicate state management (check stores first)
9. ❌ **DON'T** skip error handling in async operations
10. ❌ **DON'T** hardcode values that should be in stores or config

### Git Workflow
- **Branch naming:** `claude/claude-md-[session-id]`
- **Commit messages:** Clear, descriptive (e.g., "feat: Add resume upload component")
- **Push to:** Always push to designated Claude branch before creating PRs

---

## Questions or Issues?

If you encounter patterns not documented here:
1. Examine similar existing code in the codebase
2. Check shadcn/ui documentation for UI components
3. Review Zustand documentation for state management
4. Consult Tailwind CSS docs for styling

**Remember:** This codebase prioritizes rapid iteration and user value. When in doubt, follow existing patterns and keep code clean and maintainable.

---

**Document Version:** 1.0
**Generated:** 2025-11-14
**Next Review:** When major architectural changes occur
