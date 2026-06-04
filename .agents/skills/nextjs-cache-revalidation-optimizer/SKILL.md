---
name: nextjs-cache-revalidation-optimizer
description: Use when handling caching, revalidation, cache tags, fetch cache, Cache Components, use cache, dashboards, CMS pages, ecommerce pages, tracker pages, admin panels, and mutation-driven UI updates in Next.js App Router.
---
# Next.js Cache Revalidation Optimizer

## Purpose

Handle caching and revalidation correctly in modern Next.js.

The goal is to:

* Avoid stale UI bugs
* Avoid over-fetching
* Avoid slow uncached pages
* Use cache tags correctly
* Use revalidation correctly
* Separate public cache from private data
* Keep dashboards fast
* Keep CMS and ecommerce pages fresh
* Prevent production cache bugs

## When to use

Use this skill when building or changing:

* CMS pages
* Blog pages
* Product pages
* Ecommerce category pages
* Dashboards
* Admin panels
* Tracker pages
* Report pages
* Search pages
* User profile pages
* Server Actions
* Route Handlers
* Data mutation flows
* MongoDB-backed pages
* API-backed pages

Use this skill when task mentions:

* Cache
* Revalidate
* Stale data
* `revalidatePath`
* `revalidateTag`
* `updateTag`
* `cacheTag`
* `cacheLife`
* `"use cache"`
* `fetch`
* `no-store`
* `force-cache`
* ISR
* Dashboard refresh
* Admin update
* CMS update
* Product update
* Tracker update

## Process

### 1. Classify the data

First classify every data source.

Use this table:

| Data type                | Cache strategy         |
| ------------------------ | ---------------------- |
| Static marketing content | Long cache             |
| Blog content             | Cache + revalidate     |
| Product catalog          | Cache + tags           |
| Product inventory        | Short cache or dynamic |
| User dashboard           | No static cache        |
| Admin data               | Dynamic or short cache |
| Auth/session data        | No cache               |
| Cart data                | No cache               |
| Payment data             | No cache               |
| Live tracker location    | No static cache        |
| Tracker history          | Short cache or dynamic |
| Public reports           | Cache + revalidate     |
| Search results           | Usually dynamic        |

Do not cache blindly.

### 2. Identify freshness requirement

Ask internally:

* Can stale data be shown?
* For how long?
* Is the data public?
* Is the data private?
* Is the data user-specific?
* Does mutation happen from Server Action?
* Does mutation happen from Route Handler?
* Does the UI need instant freshness?
* Can background refresh be accepted?

Decision:

```txt
Public and rarely changes      → Cache
Public and changes sometimes   → Cache + revalidate
Public and mutation-driven     → Cache tags + revalidateTag
User-specific                  → no-store / dynamic
Needs immediate fresh UI       → updateTag or no-store
Live data                      → no-store + SSE/WebSocket/client transport
```

### 3. Choose cache mechanism

For normal server fetch:

```ts
await fetch(url, {
  next: { revalidate: 3600 },
});
```

For tagged fetch:

```ts
await fetch(url, {
  next: {
    tags: ["products"],
    revalidate: 3600,
  },
});
```

For private request-time data:

```ts
await fetch(url, {
  cache: "no-store",
});
```

For fully cached fetch:

```ts
await fetch(url, {
  cache: "force-cache",
});
```

For route-level revalidation:

```ts
export const revalidate = 3600;
```

Use route-level revalidation only when it matches the whole route.

Prefer fetch-level control when different data has different freshness needs.

### 4. Use Cache Components only when useful

Use Cache Components when the project uses:

```ts
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

Use `"use cache"` for expensive reusable server work.

Example:

```ts
export async function getProducts() {
  "use cache";

  cacheTag("products");
  cacheLife("hours");

  return db.product.findMany();
}
```

Use Cache Components for:

* Expensive database reads
* CMS content
* Product catalog data
* Public report data
* Shared layout data
* Reused server computations

Do not use `"use cache"` for:

* Session data
* User dashboard data
* Cart data
* Payment data
* Admin permission checks
* Live location data
* Request-specific data

### 5. Choose revalidation method

Use `revalidatePath` when one route must refresh.

Example:

```ts
"use server";

import { revalidatePath } from "next/cache";

export async function updatePost() {
  await db.post.update(...);

  revalidatePath("/blog");
}
```

Use `revalidateTag` when many routes share the same data.

Example:

```ts
import { revalidateTag } from "next/cache";

export async function POST() {
  await db.product.update(...);

  revalidateTag("products");
}
```

Use `updateTag` inside Server Actions when the user must see fresh data immediately.

Example:

```ts
"use server";

import { updateTag } from "next/cache";

export async function updateProduct() {
  await db.product.update(...);

  updateTag("products");
}
```

Rule:

```txt
One page changed              → revalidatePath
Shared data changed           → revalidateTag
Server Action needs fresh UI  → updateTag
Private data                  → no-store
Live data                     → no static cache
```

### 6. Design cache tags

Use stable and predictable tags.

Good tags:

```txt
products
product:123
categories
category:shoes
posts
post:abc
dashboard:summary
tracker:history:user-123
```

Bad tags:

```txt
data
page
all
test
random-id
new-cache
```

Tag rules:

* Use plural tag for list data.
* Use entity ID tag for detail data.
* Use user-specific tag only when safe.
* Never share private tags across users.
* Never use broad tags for unrelated data.
* Keep tag names consistent.

### 7. Handle mutation correctly

For every mutation, define:

* What data changed?
* Which page uses that data?
* Which cache tag stores that data?
* Should UI update immediately?
* Should stale data be accepted briefly?
* Is user-specific data involved?

Mutation output must include:

```txt
Mutation:
- create/update/delete

Affected cache:
- paths:
- tags:

Revalidation:
- revalidatePath / revalidateTag / updateTag / no-store

Reason:
- explanation
```

### 8. Handle dashboards correctly

Dashboards usually contain mixed data.

Split dashboard data:

| Section           | Strategy                |
| ----------------- | ----------------------- |
| User profile      | no-store                |
| Stats cards       | short cache if safe     |
| Recent activity   | no-store or short cache |
| Public config     | cache                   |
| Charts            | short cache             |
| Admin permissions | no-store                |
| Notifications     | no-store                |

Do not cache the full dashboard blindly.

Use small server components per section.

Use Suspense for slow sections.

### 9. Handle ecommerce correctly

Use this strategy:

| Data            | Strategy               |
| --------------- | ---------------------- |
| Product listing | cache + tags           |
| Product detail  | cache + product tag    |
| Category pages  | cache + category tag   |
| Price           | short cache or dynamic |
| Inventory       | short cache or dynamic |
| Cart            | no-store               |
| Checkout        | no-store               |
| Payment         | no-store               |
| User orders     | no-store               |

Never cache checkout or payment data.

### 10. Handle tracker pages correctly

For personal safety tracker apps:

| Data                   | Strategy                       |
| ---------------------- | ------------------------------ |
| Latest location        | no-store                       |
| Live marker            | SSE/WebSocket/client transport |
| Route history          | short cache or dynamic         |
| Session status         | no-store                       |
| Battery/network status | no-store                       |
| Public static shell    | cache                          |
| Map UI assets          | cache                          |

Do not use ISR for live location.

Use static shell + live dynamic data.

### 11. Prevent stale UI bugs

Before finishing, verify:

* Mutation revalidates affected pages.
* Mutation revalidates affected tags.
* Dynamic data is not cached.
* Private data does not use shared tags.
* Static shell does not include private data.
* Dashboard sections have separate cache rules.
* Client refresh is not used as a lazy fix.
* `router.refresh()` is not replacing proper revalidation.

## Rules

### Core rules

* Do not cache private data.
* Do not use `no-store` everywhere.
* Do not use one cache rule for the whole app.
* Do not use broad tags for unrelated data.
* Do not forget revalidation after mutation.
* Do not rely only on client refresh.
* Do not cache live tracker data.
* Do not cache auth/session/cart/payment data.
* Use path revalidation for page-specific updates.
* Use tag revalidation for shared data updates.
* Use immediate expiration only when needed.
* Keep cache tags predictable.
* Keep cache logic close to data ownership.

### Fetch rules

* Use `force-cache` only for stable public data.
* Use `revalidate` for mostly stable public data.
* Use `no-store` for private or live data.
* Use tags for data used by multiple routes.
* Do not mix public and private data in one cached fetch.
* Do not hide dynamic data inside cached helpers.

### Cache Components rules

* Use `"use cache"` only for reusable server work.
* Add cache tags inside cached functions.
* Add cache lifetime intentionally.
* Do not cache request-specific values.
* Do not read cookies or headers inside cached work.
* Do not cache permission checks.
* Do not cache session-based queries.

### Revalidation rules

* Use `revalidatePath` for route-level refresh.
* Use `revalidateTag` for shared cache refresh.
* Use `updateTag` only inside Server Actions.
* Use `updateTag` when immediate fresh data matters.
* Use `revalidateTag` when stale-while-refresh is acceptable.
* Revalidate after successful database mutation only.
* Do not revalidate before mutation completes.

### Security rules

Never cache:

* JWT payloads
* Sessions
* User roles
* Admin permissions
* Cart data
* Payment data
* Address data
* Private location data
* User documents
* User dashboard data

## Checklist

Before implementation:

* [ ] Data type is classified.
* [ ] Public data is separated from private data.
* [ ] Freshness requirement is known.
* [ ] Cache strategy is selected.
* [ ] Revalidation method is selected.
* [ ] Cache tags are defined.
* [ ] Mutation impact is mapped.
* [ ] Dashboard sections are separated.
* [ ] Live data is not statically cached.
* [ ] Auth data is not cached.
* [ ] Cart/payment data is not cached.
* [ ] `no-store` is used only where needed.
* [ ] `revalidatePath` is used for page-specific refresh.
* [ ] `revalidateTag` is used for shared cached data.
* [ ] `updateTag` is used only inside Server Actions.
* [ ] Cache Components are used only when beneficial.
* [ ] Stale UI risk is documented.
* [ ] Performance risk is documented.

## Output format

Return output in this format:

```txt
Cache Revalidation Decision

Route / feature:
- /example

Data sources:
- Public:
- Private:
- Live:
- Slow:
- Mutation-driven:

Recommended cache strategy:
- force-cache:
- revalidate:
- no-store:
- use cache:
- cacheLife:

Cache tags:
- tag 1:
- tag 2:

Revalidation plan:
- revalidatePath:
- revalidateTag:
- updateTag:
- Reason:

Mutation impact:
- Mutation:
- Affected pages:
- Affected tags:
- Freshness requirement:

Stale data risk:
- Risk 1
- Risk 2

Over-fetching risk:
- Risk 1
- Risk 2

Final implementation plan:
1. Step one
2. Step two
3. Step three
```

## Common mistakes to prevent

* Caching user-specific dashboard data.
* Using `no-store` for every request.
* Forgetting revalidation after admin update.
* Using `revalidatePath` when tags are better.
* Using one broad tag like `data`.
* Caching cart or checkout data.
* Caching live tracker location.
* Using ISR for real-time pages.
* Calling `updateTag` outside Server Actions.
* Using `router.refresh()` as the main cache strategy.
* Mixing public and private data in one cached function.
* Using `"use cache"` around session logic.
* Letting stale product data remain after admin edits.
* Over-fetching dashboard sections on every request.
* Making the whole page dynamic because one widget is dynamic.

## Quality bar

A good solution must:

* Be fast.
* Be safe.
* Avoid stale UI.
* Avoid over-fetching.
* Use cache only where useful.
* Use revalidation after mutations.
* Keep private data uncached.
* Use cache tags consistently.
* Separate public and private data.
* Explain freshness tradeoffs clearly.
* Prevent production cache bugs.
