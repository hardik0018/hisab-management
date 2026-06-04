---
name: nextjs-rendering-strategy-advisor
description: Use before choosing SSR, SSG, ISR, dynamic rendering, streaming, or mixed rendering in a Next.js App Router project. Use for landing pages, blogs, dashboards, product pages, auth pages, user-specific pages, data-heavy routes, and mixed static/dynamic pages.
---

# Next.js Rendering Strategy Advisor

## Purpose

Choose the correct rendering strategy for a Next.js route.

The goal is to:

- Avoid unnecessary SSR
- Keep static pages static
- Use ISR when data changes sometimes
- Use dynamic rendering only when required
- Use streaming for slow sections
- Keep data fetching server-side
- Reduce client JavaScript
- Improve page speed
- Prevent cache and privacy mistakes

## When to use

Use this skill before building or changing:

- Landing pages
- Blog pages
- Product pages
- Category pages
- Dashboard pages
- Admin pages
- Auth pages
- Profile pages
- Search pages
- Tracker pages
- Report pages
- User-specific pages
- Pages with slow data fetching
- Pages with mixed public and private data

Use this skill when the task mentions:

- SSR
- SSG
- ISR
- Static rendering
- Dynamic rendering
- Revalidate
- Streaming
- Suspense
- Server Components
- Client Components
- Cache
- SEO
- Performance
- Dashboard loading

## Process

### 1. Identify the route type

Classify the page first.

Use this table:

| Page type | Default rendering |
|---|---|
| Static marketing page | SSG |
| Blog page | SSG or ISR |
| Product listing | ISR |
| Product details | ISR |
| Public docs | SSG or ISR |
| Dashboard | Dynamic rendering |
| Auth page | Dynamic rendering |
| User profile | Dynamic rendering |
| Admin page | Dynamic rendering |
| Search page | Dynamic rendering |
| Tracker/live page | Static shell + dynamic data |
| Mixed public/private page | Static shell + dynamic sections |

Do not choose SSR by default.

SSR is only valid when request-time data is required.

### 2. Check data freshness

Ask this internally:

- Does this data change rarely?
- Does this data change every few minutes?
- Does this data depend on the logged-in user?
- Does this data depend on cookies?
- Does this data depend on headers?
- Does this data need real-time updates?
- Can stale data be accepted briefly?

Decision:

- Content never changes often → SSG
- Content changes sometimes → ISR
- Content changes after admin update → ISR + on-demand revalidation
- Content changes per user → Dynamic rendering
- Content changes live → Static shell + SSE/WebSocket/client polling
- Content is slow but not user-specific → Server Component + streaming

### 3. Check personalization

If the page uses these, treat it as dynamic:

- `cookies()`
- `headers()`
- Session lookup
- JWT user lookup
- Role-based data
- User-specific database query
- Private dashboard data
- Cart data
- Account data
- Admin permissions

Never cache private user data as static output.

### 4. Choose the rendering mode

Use this rule:

```txt
Static content      → SSG
Mostly static data  → ISR / revalidate
User-specific data  → Dynamic rendering
Mixed page          → Static shell + dynamic sections
Slow data section   → Streaming with Suspense
Live data           → Static shell + live client connection
````

### 5. Decide Server vs Client Components

Keep the page as a Server Component by default.

Use Client Components only for:

* State
* Effects
* Browser APIs
* Event handlers
* Forms with client interaction
* Map UI
* Charts requiring browser APIs
* Live client updates
* Animations
* Drag/drop
* Local storage

Do not add `"use client"` to the whole page unless unavoidable.

Push `"use client"` down to the smallest component.

### 6. Decide caching

For static data:

```ts
await fetch(url, {
  cache: "force-cache",
});
```

For time-based ISR:

```ts
await fetch(url, {
  next: { revalidate: 3600 },
});
```

For request-time private data:

```ts
await fetch(url, {
  cache: "no-store",
});
```

For route-level revalidation:

```ts
export const revalidate = 3600;
```

For always-dynamic route:

```ts
export const dynamic = "force-dynamic";
```

Use dynamic mode only when required.

### 7. Decide streaming

Use streaming when:

* Page has slow data
* Above-the-fold UI can load first
* Dashboard cards load at different speeds
* Large tables load slowly
* Reports need time
* User should see skeletons early

Use:

* `loading.tsx` for route-level loading
* `Suspense` for component-level loading
* Server Components for async data
* Smaller sections instead of one blocking page

Do not stream tiny pages.

### 8. Decide revalidation strategy

Use time-based revalidation when:

* Data can be stale briefly
* Data changes on a known schedule
* Blog/product/category data updates sometimes

Use on-demand revalidation when:

* Admin updates content
* Product data changes after CMS update
* Blog is published
* Inventory changes
* Manual refresh is needed

Use no-store when:

* Data is private
* Data is request-specific
* Data must always be fresh
* Data depends on auth

### 9. Create rendering decision before coding

Before implementation, output:

* Route
* Page type
* Data type
* Rendering mode
* Cache strategy
* Revalidation strategy
* Server/client boundary
* Streaming plan
* Risks
* Final recommendation

Do not write code before this decision.

## Rules

### Core rules

* Server Component by default.
* Static by default when possible.
* Do not use SSR without request-time need.
* Do not use `"use client"` at page level by default.
* Do not fetch public data on the client if server fetch works.
* Do not cache private user data.
* Do not mix private data into static pages.
* Do not make a whole route dynamic for one small widget.
* Use static shell + dynamic section for mixed pages.
* Use streaming for slow server data.
* Use ISR for mostly static public data.
* Use dynamic rendering for user-specific data.
* Use live client transport for real-time data.

### Privacy rules

Never statically cache:

* User profile data
* JWT/session data
* Admin data
* Payment data
* Cart data
* Private dashboard data
* Location tracking data
* Role-based content

### Performance rules

* Avoid request-time rendering for SEO pages.
* Avoid client-side fetching for initial SEO content.
* Avoid large client components.
* Avoid loading all dashboard data in one blocking request.
* Avoid blocking the whole page for one slow section.
* Prefer parallel data fetching.
* Prefer Suspense boundaries for slow sections.
* Keep interactive islands small.

### App Router rules

* Use Server Components for data fetching.
* Use Client Components for interactivity only.
* Use `loading.tsx` for route loading.
* Use `error.tsx` for route errors.
* Use `not-found.tsx` when data is missing.
* Use route segment config only when needed.
* Keep layouts static when possible.
* Do not accidentally make parent layouts dynamic.

## Checklist

Before coding, verify:

* [ ] Route purpose is clear.
* [ ] SEO requirement is known.
* [ ] Data freshness requirement is known.
* [ ] User-specific data is identified.
* [ ] Public data is separated from private data.
* [ ] Rendering mode is selected.
* [ ] Cache strategy is selected.
* [ ] Revalidation strategy is selected.
* [ ] Server/client boundary is defined.
* [ ] `"use client"` is minimized.
* [ ] Streaming need is checked.
* [ ] Slow sections are isolated.
* [ ] Auth impact is checked.
* [ ] Cookie/header usage is checked.
* [ ] Static parent layout is protected.
* [ ] Real-time data strategy is separate.
* [ ] Failure and loading states are planned.

## Output format

Return output in this format:

```txt
Rendering Strategy Decision

Route:
- /example-route

Page type:
- Landing / Blog / Product / Dashboard / Auth / User-specific / Mixed

Data involved:
- Public:
- Private:
- Real-time:
- Slow:

Recommended rendering:
- SSG / ISR / Dynamic / Static shell + dynamic sections / Streaming

Why:
- Reason 1
- Reason 2
- Reason 3

Cache strategy:
- fetch cache:
- revalidate:
- no-store:
- tags/path revalidation:

Server/client boundary:
- Server Components:
- Client Components:
- Reason for client components:

Streaming plan:
- Use streaming: Yes/No
- Suspense boundaries:
- loading.tsx needed: Yes/No

Risks:
- Risk 1
- Risk 2

Final implementation plan:
1. Step one
2. Step two
3. Step three
```

## Common mistakes to prevent

* Using SSR for landing pages.
* Using dynamic rendering for blogs without reason.
* Fetching public SEO data on the client.
* Adding `"use client"` to the whole page.
* Making layouts dynamic by reading cookies.
* Caching user-specific data.
* Mixing admin data into static pages.
* Blocking full dashboard render on one slow query.
* Not using ISR for product pages.
* Not using streaming for slow dashboards.
* Using polling for everything.
* Forgetting loading and error states.
* Using `no-store` everywhere.
* Using revalidate on private data.
* Not separating public shell from private widgets.
* Overusing route-level dynamic config.

## Quality bar

A good rendering decision must:

* Be fast by default.
* Be safe for private data.
* Use SSR only when required.
* Keep public pages cacheable.
* Keep layouts static where possible.
* Keep interactivity isolated.
* Keep client bundle small.
* Use streaming only where useful.
* Explain tradeoffs clearly.
* Prevent accidental dynamic rendering.
* Prevent stale private data bugs.