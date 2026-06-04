# Agents Onboarding & Developer Guidelines

This document serves as a guide for AI agents and new developers onboarding onto the **Hisab Management** project. It outlines the core architecture patterns, tech stack details, directories, testing practices, and guidelines to ensure safety and consistency.

## Project Summary
**Hisab Management** is a personal/family finance manager and social ledger application. It enables users to track standard household expenses, manage personal loans/borrowings (Hisab), track social gifts/receipts (Vayvhar/Marriage records), and collaborate in real-time across shared workspaces (spaces).

## Tech Stack
*   **Framework**: Next.js (App Router, version 16.1)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS with Radix UI components (Shadcn UI structure) and Tailwind Animate
*   **Authentication**: NextAuth.js (v5 Beta) using Google Sign-In
*   **Database**: MongoDB (using native `mongodb` driver, no ORM/ODM like Mongoose)
*   **Libraries**: 
    *   `framer-motion` (animations)
    *   `recharts` (dashboard analytics and charts)
    *   `sonner` (toast notifications)
    *   `pdfkit` (PDF ledger exports)
    *   `xlsx` (Excel exports)
    *   `zod` (validation)
    *   `uuid` (unique ID generation)

## Important Commands
Always use **pnpm** as the package manager (do not use `npm` or `yarn` as `pnpm-lock.yaml` is the source of truth).

| Command | Action |
| :--- | :--- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Run the local Next.js development server |
| `pnpm build` | Build the application for production |
| `pnpm start` | Run the production build locally |
| `pnpm lint` | Run ESLint check |
| `pnpm type-check` | Run TypeScript compilation check (`tsc --noEmit`) |

## Folder Rules & Structure

```
hisab-management/
├── app/                  # Next.js App Router
│   ├── (protected)/      # Authenticated routes (dashboard, expenses, hisab, marriage, profile)
│   ├── api/              # API route handlers
│   ├── login/            # Login page (Google OAuth)
│   ├── globals.css       # Styling entrypoint & CSS variables
│   ├── layout.tsx        # Base layout, HTML shell, fonts, providers setup
│   └── page.tsx          # Index router (performs server-side redirection or renders LandingPage)
├── components/           # Reusable React components
│   ├── ui/               # Lower-level Shadcn UI primitives (Alert, Dialog, Select, etc.)
│   ├── expense/          # Expense tracker specific components (entry boxes, list cards)
│   ├── settings/         # Settings specific components (backup, deletion UI)
│   └── ...               # Navigations, wrapper layouts, etc.
├── hooks/                # Custom React Hooks
├── lib/                  # Shared utility methods, DB connections, and helpers
├── models/               # Helper schemas and DB schema validation wrappers
├── public/               # Static assets (images, PWA manifest, service workers)
├── types/                # Core TypeScript interfaces
└── auth.ts               # Root NextAuth configuration
```

## Coding Rules

1.  **State & Data Boundaries**: Keep server logic on the server. Next.js server components should fetch data directly using functions in [lib/data-fetching.ts](file:///e:/Home/hisab-management/lib/data-fetching.ts). Interactive sub-components should be Client Components (`'use client'`) and make calls via [lib/api-utils.ts](file:///e:/Home/hisab-management/lib/api-utils.ts#L15)'s `secureFetch`.
2.  **No Mongoose**: The project interacts with MongoDB using the raw driver. Execute database operations using `getDb()` from [lib/db.ts](file:///e:/Home/hisab-management/lib/db.ts#L17) on specific collection names (`expenses`, `hisab`, `marriage_hisab`, `users`, `collaboration_requests`, `settings`).
3.  **Space-Level Isolation**: Almost all records are scoped by `space_id` (not just `user_id`). Collaboration lets multiple users share a `space_id`. When querying or writing database records, you **MUST** constrain the query by the user's current `space_id` to prevent data leakages between spaces.
4.  **Timezone Consistency**: Standardize dates to the `Asia/Kolkata` timezone. Use the helper `getTodayKolkata()` in [lib/data-fetching.ts](file:///e:/Home/hisab-management/lib/data-fetching.ts#L203) for today's date calculations. Expense dates must be stored as "YYYY-MM-DD" string format.
5.  **Multi-line Parsing Pattern**: Expenses can be bulk-added via a raw text field. Ensure any updates to expense parsing logic are modified in [lib/expense-parser.ts](file:///e:/Home/hisab-management/lib/expense-parser.ts) and conform to `ParseResult` interfaces.

## Testing & Verification Rules
*   **Manual Testing Checklists**: Validate all forms, CRUD endpoints, and integrations. Focus testing on boundary amounts (e.g., negative values, decimals, limits).
*   **No Auto Tests**: There are no automated testing pipelines in this repository. All validation must be manually tested using interactive mock workflows or manual HTTP requests, followed by TypeScript lint checks (`pnpm type-check` and `pnpm lint`).
*   **Hydration Error Mitigation**: Always verify code builds locally with `pnpm build` to check for Server/Client rendering mismatch hydration warnings.

## Safety & Security Rules
*   **Database Writes**: Do not update records without checking the session. Authenticated route controllers **must** use the `requireAuth` wrapper or retrieve the user profile using `getAuthenticatedUser()` in [lib/auth.ts](file:///e:/Home/hisab-management/lib/auth.ts#L11).
*   **No Secrets Exposure**: Never check in credentials or display raw `.env.local` values in logs, alerts, or text layouts. Use environment variables defined on the host platform.
*   **Prevent Cascade Deletes**: When deleting users or leaving workspaces, check the ownership dependencies before executing data modifications.

## Files to Read First
1.  [package.json](file:///e:/Home/hisab-management/package.json) - Review dependency ranges and commands.
2.  [types/index.ts](file:///e:/Home/hisab-management/types/index.ts) - View all core domain data interfaces.
3.  [lib/auth.ts](file:///e:/Home/hisab-management/lib/auth.ts) - Understand auth checks.
4.  [lib/db.ts](file:///e:/Home/hisab-management/lib/db.ts) - Understand MongoDB client fetching.
5.  [lib/data-fetching.ts](file:///e:/Home/hisab-management/lib/data-fetching.ts) - See query structures.

## Things Not to Change Without Reason
*   **Timezone & String Format**: Expense record `date` format: `"YYYY-MM-DD"` timezone: `Asia/Kolkata`.
*   **NextAuth Google Callback Handler**: Altering this will break sign-in flows and automatic `user_id` generation logic in `events.createUser`.
*   **Collection Scoping Fields**: `space_id` and `user_id` must remain separated to keep the collaboration model functional.
