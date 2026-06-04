---
name: nextjs-app-router-builder
description: Use when building or changing Next.js App Router routes, layouts, route groups, dynamic routes, dashboard pages, loading states, error states, not-found pages, or route handlers. This skill prevents Pages Router confusion and keeps the /app structure clean.
---

# Next.js App Router Builder

## Purpose

Build clean Next.js routes using the App Router.

This skill helps decide:

* Correct `/app` route placement
* Correct `page.tsx` usage
* Correct `layout.tsx` usage
* Correct route groups
* Correct nested layouts
* Correct dynamic routes
* Correct `loading.tsx`
* Correct `error.tsx`
* Correct `not-found.tsx`
* Correct route handler placement
* Clean folder structure

Main goal:

Avoid messy routing and Pages Router confusion.

## When to use

Use this skill for:

* New `/app` routes
* Dashboard pages
* Public pages
* Auth pages
* Nested layouts
* Route groups
* Dynamic routes
* Detail pages
* Loading states
* Error states
* Not-found states
* API route handlers inside `/app/api`
* Large route refactors

Do not use this skill for:

* Pure CSS changes
* Small component-only changes
* Backend-only API logic
* Database schema design
* Deployment checks
* Performance review

Use other skills for those tasks.

## Process

### 1. Confirm route goal

Identify:

* Route URL
* Page purpose
* User type
* Public/private access
* Parent layout
* Shared UI
* Dynamic params
* Loading needs
* Error needs
* Not-found needs

Do not create route files before this is clear.

### 2. Decide route location

Use `/app` only.

Never use `/pages` for new routes.

Common examples:

```txt
app/
  page.tsx
```

```txt
app/
  about/
    page.tsx
```

```txt
app/
  dashboard/
    page.tsx
```

```txt
app/
  tracker/
    [sessionId]/
      page.tsx
```

Rules:

* Folder name becomes URL segment.
* `page.tsx` makes the route public.
* `layout.tsx` wraps child routes.
* `loading.tsx` handles route loading UI.
* `error.tsx` handles runtime UI errors.
* `not-found.tsx` handles missing route data.
* `route.ts` is for Route Handlers, not UI pages.

### 3. Choose route groups

Use route groups only for organization.

Example:

```txt
app/
  (public)/
    page.tsx
    about/
      page.tsx
  (dashboard)/
    dashboard/
      page.tsx
```

Rules:

* Parentheses do not affect URL.
* `(dashboard)/dashboard/page.tsx` becomes `/dashboard`.
* Use route groups for different layouts.
* Use route groups for public/auth/dashboard separation.
* Do not create route groups without a clear reason.
* Do not hide confusing structure behind route groups.

Good route groups:

```txt
(public)
(auth)
(dashboard)
(marketing)
```

Bad route groups:

```txt
(folder)
(group1)
(misc)
(new)
```

### 4. Choose layout structure

Use `layout.tsx` when multiple child routes share UI.

Use layout for:

* Navbar
* Sidebar
* Dashboard shell
* Auth shell
* Marketing shell
* Shared page wrapper
* Common metadata structure

Example:

```txt
app/
  (dashboard)/
    dashboard/
      layout.tsx
      page.tsx
      settings/
        page.tsx
```

Rules:

* Do not duplicate navbar/sidebar in every page.
* Put shared UI in the nearest layout.
* Do not make root layout too large.
* Do not put route-specific UI in root layout.
* Keep layouts stable.
* Avoid loading route data in layout unless shared.

### 5. Choose page structure

Every visible route needs `page.tsx`.

Example:

```txt
app/
  dashboard/
    page.tsx
```

Rules:

* Keep `page.tsx` thin.
* Use page for route-level composition.
* Move complex UI into components.
* Fetch initial server data in page when needed.
* Do not put large client logic directly in page.
* Do not use `"use client"` in page unless unavoidable.

### 6. Choose dynamic routes

Use dynamic segments when URL depends on data.

Example:

```txt
app/
  products/
    [productId]/
      page.tsx
```

URL:

```txt
/products/123
```

Use dynamic routes for:

* Detail pages
* User profiles
* Orders
* Sessions
* Products
* Blog slugs
* Tracker sessions

Rules:

* Use `[id]` for database IDs.
* Use `[slug]` for readable slugs.
* Validate params before querying.
* Use `notFound()` when record is missing.
* Do not use dynamic routes when fixed routes are enough.

### 7. Choose nested routes

Use nested folders for parent-child pages.

Example:

```txt
app/
  dashboard/
    page.tsx
    users/
      page.tsx
      [userId]/
        page.tsx
```

URLs:

```txt
/dashboard
/dashboard/users
/dashboard/users/123
```

Rules:

* Nest only when URL relationship is real.
* Do not deeply nest without need.
* Keep dashboard structure readable.
* Avoid fake nesting only for file grouping.

### 8. Add loading state

Use `loading.tsx` when route data may take time.

Example:

```txt
app/
  dashboard/
    loading.tsx
    page.tsx
```

Use for:

* Dashboard pages
* Tables
* Detail pages
* Search pages
* Slow server data
* Suspense boundaries

Rules:

* Loading UI must match final layout size.
* Use skeletons for real content areas.
* Do not show random spinners everywhere.
* Keep loading UI simple.
* Avoid layout shift.

### 9. Add error state

Use `error.tsx` for route-level UI errors.

Example:

```txt
app/
  dashboard/
    error.tsx
```

Rules:

* `error.tsx` must be a Client Component.
* Add reset action when useful.
* Show clear recovery action.
* Do not expose stack traces.
* Do not show raw database errors.
* Keep error text user-safe.

Basic shape:

```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 10. Add not-found state

Use `not-found.tsx` when data can be missing.

Example:

```txt
app/
  products/
    [productId]/
      not-found.tsx
      page.tsx
```

Use for:

* Detail pages
* Slug pages
* User pages
* Session pages
* Product pages
* Blog pages

Rules:

* Use `notFound()` after missing data check.
* Do not show empty broken detail pages.
* Do not return fake data.
* Add useful navigation back.

Example:

```tsx
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}
```

### 11. Add route handlers only when needed

Use `route.ts` for API endpoints.

Example:

```txt
app/
  api/
    tracker/
      location/
        route.ts
```

Rules:

* `route.ts` is not a page.
* Do not place `page.tsx` and `route.ts` at the same route level.
* Use API routes for mobile apps.
* Use API routes for webhooks.
* Use API routes for external clients.
* Use Server Actions for internal form mutations when better.

Common handlers:

```tsx
export async function GET() {}

export async function POST(request: Request) {}

export async function PATCH(request: Request) {}

export async function DELETE(request: Request) {}
```

### 12. Check navigation

Use App Router navigation patterns.

Rules:

* Use `Link` for normal navigation.
* Use `redirect()` on server when needed.
* Use `useRouter()` only in Client Components.
* Do not use Pages Router APIs.
* Do not use `next/router`.
* Use `next/navigation` in App Router.

Correct:

```tsx
import Link from "next/link";
```

Correct client navigation:

```tsx
"use client";

import { useRouter } from "next/navigation";
```

Wrong:

```tsx
import { useRouter } from "next/router";
```

### 13. Check metadata placement

Use metadata on pages/layouts when needed.

Rules:

* Use static metadata for static pages.
* Use generated metadata for dynamic pages.
* Keep SEO metadata close to the route.
* Do not put every page title in root layout.

Example:

```tsx
export const metadata = {
  title: "Dashboard",
  description: "User dashboard",
};
```

### 14. Check final structure

Before coding, output the final route tree.

Example:

```txt
app/
  (dashboard)/
    dashboard/
      layout.tsx
      loading.tsx
      error.tsx
      page.tsx
      tracker/
        [sessionId]/
          loading.tsx
          not-found.tsx
          page.tsx
```

If structure looks confusing, simplify before coding.

## Rules

### App Router rules

* Use `/app` for all new routes.
* Do not use `/pages` for new routes.
* Use `page.tsx` for route UI.
* Use `layout.tsx` for shared UI.
* Use `loading.tsx` for loading UI.
* Use `error.tsx` for route-level error UI.
* Use `not-found.tsx` for missing data UI.
* Use `route.ts` for Route Handlers.
* Do not mix Pages Router APIs.
* Do not import from `next/router`.

### Route structure rules

* Keep routes clear.
* Keep route groups meaningful.
* Avoid random folders.
* Avoid deep nesting without reason.
* Do not duplicate layouts.
* Do not put unrelated pages together.
* Do not create fake dynamic routes.
* Use readable route names.

### Layout rules

* Put shared UI in layout.
* Keep root layout minimal.
* Use nested layouts for dashboards.
* Do not fetch route-specific data in parent layout.
* Do not force unrelated pages into same layout.
* Avoid layout duplication.

### Loading rules

* Add loading UI for slow routes.
* Use skeletons when possible.
* Avoid layout shift.
* Do not use full-screen loading for small content.
* Keep loading close to route segment.

### Error rules

* Add error UI for risky route segments.
* Keep error messages safe.
* Add retry action when useful.
* Do not leak internal errors.
* Remember `error.tsx` needs `"use client"`.

### Not-found rules

* Add not-found UI for dynamic detail routes.
* Use `notFound()` when data is missing.
* Do not silently render empty pages.
* Add navigation back to a valid page.

### API route rules

* Put API handlers under `/app/api`.
* Use `route.ts`.
* Do not colocate `route.ts` with `page.tsx` at the same segment.
* Keep UI routes and API routes clearly separated.
* Validate request inside route handler.

## Checklist

Before building, confirm:

### Route

* [ ] Route URL is clear
* [ ] Route belongs inside `/app`
* [ ] No Pages Router usage
* [ ] Correct folder name selected
* [ ] Correct route group selected
* [ ] Dynamic segment needed or avoided
* [ ] Nested route is justified

### Layout

* [ ] Shared UI identified
* [ ] Correct layout level selected
* [ ] Root layout not overloaded
* [ ] Dashboard layout not duplicated
* [ ] Public/auth/dashboard layouts separated if needed

### Page

* [ ] `page.tsx` exists for visible route
* [ ] Page is thin
* [ ] Server Component is default
* [ ] Client logic moved lower
* [ ] Metadata planned if needed

### Loading

* [ ] `loading.tsx` added if route can be slow
* [ ] Skeleton matches final UI
* [ ] Layout shift avoided

### Error

* [ ] `error.tsx` added if route can fail
* [ ] Error file uses `"use client"`
* [ ] Retry/reset action included
* [ ] No stack trace leaked

### Not found

* [ ] `not-found.tsx` added for missing data route
* [ ] `notFound()` used after missing data check
* [ ] User has a way back

### Route handler

* [ ] API endpoint uses `route.ts`
* [ ] API route stays under `/app/api`
* [ ] No `page.tsx` conflict
* [ ] Method handlers planned
* [ ] Request validation planned

### Navigation

* [ ] `next/link` used for links
* [ ] `next/navigation` used for App Router hooks
* [ ] `next/router` avoided
* [ ] Redirects handled correctly

## Output format

When this skill is used, respond like this:

```txt
# App Router Build Plan

## 1. Route goal

- Build:
- URL:
- User:
- Access:

## 2. Final route tree

app/
  ...

## 3. Route group decision

- Route group:
- Reason:

## 4. Layout decision

- Layout file:
- Shared UI:
- Reason:

## 5. Page files

- File:
- Purpose:
- Server or client:

## 6. Dynamic route decision

- Dynamic segment:
- Param:
- Validation needed:
- Missing data behavior:

## 7. Loading state

- File:
- UI type:

## 8. Error state

- File:
- Recovery action:

## 9. Not-found state

- File:
- Trigger:

## 10. Route handlers

- API route:
- Method:
- Purpose:

## 11. Navigation rules

- Link usage:
- Redirect usage:
- Client router usage:

## 12. Files to create/change

app/...

## 13. Do not do

- Do not use /pages.
- Do not use next/router.
- Do not make full page client-side without reason.
```

## Common mistakes to prevent

* Using Pages Router for new routes
* Creating `/pages` route by mistake
* Importing from `next/router`
* Forgetting `page.tsx`
* Putting route UI in `layout.tsx`
* Overloading root layout
* Duplicating dashboard layout
* Creating useless route groups
* Creating confusing nested folders
* Using dynamic route when static route is enough
* Forgetting `loading.tsx`
* Forgetting `error.tsx`
* Forgetting `"use client"` in `error.tsx`
* Forgetting `not-found.tsx`
* Rendering broken empty detail pages
* Putting `route.ts` beside `page.tsx` at same segment
* Mixing API routes and UI routes badly
* Making every page a Client Component
* Placing `"use client"` too high
* Using browser hooks inside Server Components
* Not validating dynamic params

## Quality bar

A good App Router implementation:

* Uses `/app` correctly
* Has clean route tree
* Uses route groups only with reason
* Uses layouts at correct levels
* Keeps pages thin
* Adds loading where needed
* Adds error where needed
* Adds not-found where needed
* Uses dynamic routes correctly
* Keeps API handlers separate
* Avoids Pages Router APIs
* Is easy to understand later

A bad implementation:

* Has random folders
* Mixes `/pages` and `/app`
* Uses `next/router`
* Makes everything client-side
* Duplicates layouts
* Has no loading states
* Has no error states
* Has no not-found handling
* Has confusing route groups
* Creates routes without a structure plan
