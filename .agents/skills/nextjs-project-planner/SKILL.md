---
name: nextjs-project-planner
description: Use before coding any Next.js feature, page, dashboard, redesign, API flow, or client requirement. This skill plans the App Router structure, server/client boundaries, affected files, data flow, risks, and implementation order before code is written.
---

# Next.js Project Planner

## Purpose

Plan a Next.js feature before implementation.

This skill prevents random coding, messy files, wrong server/client choices, poor routing, weak data flow, and future refactor problems.

Use this skill to decide:

- App Router structure
- Route groups
- Page and layout placement
- Server Component vs Client Component boundaries
- API route needs
- Server Action needs
- Data fetching strategy
- Caching strategy
- Auth checks
- Validation points
- Affected files
- Implementation order
- Risks before coding

## When to use

Use this skill before:

- Creating a new page
- Creating a dashboard
- Adding a new feature
- Building a form flow
- Building CRUD functionality
- Adding API routes
- Adding Server Actions
- Redesigning a large section
- Connecting frontend with backend
- Adding authentication checks
- Adding MongoDB data flow
- Refactoring App Router structure
- Starting client requirement implementation

Do not use this skill for:

- Small text changes
- CSS-only micro changes
- One-line bug fixes
- Simple dependency updates
- Already-planned tasks

## Process

### 1. Understand the requirement

First identify:

- Main user goal
- User type
- Business purpose
- Required pages
- Required actions
- Required data
- Required permissions
- Expected success state
- Expected failure states

If the requirement is unclear, ask only the most important missing questions.

Ask only when the answer changes structure or security.

Do not ask cosmetic questions before planning.

### 2. Identify app area

Decide where the feature belongs:

- Public route
- Auth route
- Dashboard route
- Admin route
- API route
- Shared component
- Feature-specific component
- Server utility
- Client hook
- Database model
- Validation schema

Prefer feature-based organization.

Avoid dumping everything inside generic folders.

### 3. Choose App Router structure

Plan route structure using:

- `app/(public)`
- `app/(auth)`
- `app/(dashboard)`
- `app/api`
- `app/[dynamic-route]`
- `layout.tsx`
- `page.tsx`
- `loading.tsx`
- `error.tsx`
- `not-found.tsx`

Use route groups when they improve clarity.

Do not create route groups without a reason.

Do not mix unrelated pages under one group.

### 4. Decide Server Component boundaries

Default to Server Components.

Use Server Components for:

- Data fetching
- Reading cookies
- Reading headers
- Auth checks
- Database queries
- Static content
- SEO content
- Initial page rendering
- Secure server-only logic

Server Components must not use:

- `useState`
- `useEffect`
- Browser APIs
- DOM APIs
- Event handlers
- Client-only libraries

### 5. Decide Client Component boundaries

Use Client Components only when needed.

Use Client Components for:

- Form interactions
- Button clicks
- Modals
- Tabs
- Dropdowns
- Search filters
- Live UI state
- Animations
- Map interactions
- Toasts
- Browser storage
- WebSocket or SSE listeners
- Real-time UI updates

Keep Client Components small.

Do not mark full pages as `"use client"` unless unavoidable.

Move only the interactive part into a Client Component.

### 6. Decide data fetching strategy

Choose one:

- Server Component fetch
- Direct database query on server
- Route Handler API
- Server Action
- Client fetch
- SWR / React Query
- SSE for live updates
- WebSocket only when two-way real-time is required

Rules:

- Use Server Component fetching for initial page data.
- Use Server Actions for trusted form mutations.
- Use Route Handlers for external clients or mobile apps.
- Use client fetch only for browser-triggered updates.
- Use SSE for one-way live updates.
- Avoid unnecessary polling.
- Do not expose secrets to client code.

### 7. Decide mutation strategy

For data changes, choose:

- Server Action
- API route
- External backend endpoint

Use Server Actions for:

- Internal forms
- Simple authenticated mutations
- Dashboard actions
- Admin actions

Use API routes for:

- Android app requests
- Webhook requests
- Public API access
- Third-party integrations
- REST API flows
- Mobile app sync
- Token-based requests

Every mutation must include:

- Auth check
- Input validation
- Permission check
- Error handling
- Success response
- Revalidation strategy if needed

### 8. Plan validation

Identify validation location:

- Client-side basic validation
- Server-side trusted validation
- API route validation
- Server Action validation
- MongoDB schema validation

Rules:

- Never trust client validation only.
- Validate all request bodies.
- Validate params and query strings.
- Validate IDs before database queries.
- Validate file uploads before processing.
- Return clear field errors where needed.

Use a schema validator when possible.

### 9. Plan auth and security

Identify:

- Public access
- Auth-only access
- Role-based access
- Token-based access
- Admin-only access
- Ownership checks

Security checks:

- Is this route protected?
- Can user access this record?
- Are secrets server-only?
- Are cookies secure?
- Are API tokens validated?
- Are rate limits needed?
- Is CSRF relevant?
- Are unsafe redirects avoided?
- Are uploaded files restricted?
- Are external URLs validated?

Never place secret logic in Client Components.

Never expose private environment variables with `NEXT_PUBLIC_`.

### 10. Plan database impact

If MongoDB is involved, identify:

- Existing models affected
- New model required
- Indexes required
- Unique constraints
- Required fields
- Optional fields
- Data ownership
- Query patterns
- Pagination needs
- History/audit needs
- Soft delete needs

Avoid schema changes without checking existing queries.

Avoid storing duplicate data unless justified.

Avoid unbounded arrays inside documents.

### 11. Plan UI component structure

Divide UI into:

- Page component
- Server wrapper
- Client interaction component
- Form component
- List/table component
- Empty state
- Loading state
- Error state
- Shared UI component

Rules:

- Keep page files thin.
- Keep business logic outside JSX.
- Keep reusable UI clean.
- Keep feature-specific UI inside feature folders.
- Avoid over-abstracting too early.

### 12. Plan loading and error states

Every planned feature must include:

- Loading state
- Empty state
- Error state
- Unauthorized state
- Validation error state
- Success state

For App Router, consider:

- `loading.tsx`
- `error.tsx`
- `not-found.tsx`
- Suspense boundaries
- Skeleton UI

### 13. Plan caching and revalidation

Decide:

- Static or dynamic route
- Cached or uncached fetch
- Revalidation needed or not
- `revalidatePath`
- `revalidateTag`
- No-store behavior
- User-specific data rules

Rules:

- Do not cache private user data incorrectly.
- Do not make everything dynamic without reason.
- Do not revalidate large routes unnecessarily.
- Use tags for reusable data groups.
- Use path revalidation for page-level changes.

### 14. Plan performance

Check:

- Can this stay server-rendered?
- Can JS be reduced?
- Are large libraries needed?
- Are images optimized?
- Is pagination required?
- Is infinite scroll justified?
- Are database indexes needed?
- Is streaming useful?
- Are dynamic imports useful?
- Is the component too client-heavy?

Do not add heavy client libraries for small UI needs.

### 15. Find affected files

Before coding, list all likely files:

- Routes
- Pages
- Layouts
- Components
- API routes
- Server actions
- Models
- Validation schemas
- Lib utilities
- Hooks
- Types
- Constants
- Tests
- Environment files
- Config files

Do not create files randomly during implementation.

### 16. Define implementation order

Use this order:

1. Confirm requirement
2. Check existing structure
3. Plan route structure
4. Plan data model
5. Plan validation
6. Plan auth/security
7. Plan server logic
8. Plan UI components
9. Plan loading/error states
10. Plan tests
11. Implement backend/server logic
12. Implement UI
13. Connect data flow
14. Test success cases
15. Test failure cases
16. Review security and performance

Do not start UI before data flow is understood.

Do not start backend before validation and auth are planned.

## Rules

### Architecture rules

- Use App Router for new features.
- Prefer Server Components by default.
- Use Client Components only for interactivity.
- Keep `"use client"` as low as possible.
- Do not put business logic inside UI components.
- Do not put database logic inside Client Components.
- Do not create unnecessary global state.
- Do not create random folders.
- Do not mix feature logic with unrelated shared logic.
- Do not over-engineer small features.

### Routing rules

- Use route groups for organization only.
- Use dynamic routes only when needed.
- Use nested layouts when UI is shared.
- Add `loading.tsx` for slow pages.
- Add `error.tsx` for risky pages.
- Add `not-found.tsx` for detail pages.
- Keep API routes under `app/api`.

### Server/client rules

- Server-only logic stays server-only.
- Client Components must not import server utilities.
- Server Components must not use browser APIs.
- Client Components receive safe props only.
- Do not pass secrets to Client Components.
- Do not fetch private data from client when server fetch is better.

### API rules

- Use Route Handlers for external/mobile/API access.
- Validate method, body, params, and query.
- Return proper status codes.
- Return predictable response shapes.
- Do not leak stack traces.
- Do not expose database errors directly.
- Add rate limits for sensitive endpoints.
- Add token validation where required.

### Database rules

- Plan schema before UI.
- Add indexes for frequent queries.
- Avoid large unbounded document arrays.
- Use references when data grows.
- Use embedded data only when bounded.
- Store ownership fields.
- Validate ObjectIds.
- Handle missing records.
- Handle duplicate records.
- Handle race conditions where needed.

### Security rules

- Check authentication on server.
- Check authorization near data access.
- Never trust client state.
- Never trust hidden form fields.
- Never expose private env variables.
- Never put secrets in `NEXT_PUBLIC_`.
- Validate uploads.
- Validate external URLs.
- Protect admin routes.
- Protect mutation routes.
- Avoid unsafe redirects.

### Testing rules

- Plan tests before coding.
- Cover success cases.
- Cover validation failure.
- Cover unauthorized access.
- Cover not-found records.
- Cover database failure.
- Cover empty state.
- Cover loading state where useful.

## Checklist

Before coding, confirm:

### Requirement

- [ ] Main goal is clear
- [ ] User type is clear
- [ ] Required pages are clear
- [ ] Required actions are clear
- [ ] Required data is clear
- [ ] Success state is clear
- [ ] Failure states are clear

### App Router

- [ ] Correct route group selected
- [ ] Correct page path selected
- [ ] Layout impact checked
- [ ] Dynamic route need checked
- [ ] Loading UI planned
- [ ] Error UI planned
- [ ] Not-found UI planned

### Server/client boundary

- [ ] Server Components used by default
- [ ] Client Components limited
- [ ] `"use client"` is not placed too high
- [ ] Browser APIs isolated
- [ ] Server-only logic protected
- [ ] Secrets not passed to client

### Data flow

- [ ] Data source identified
- [ ] Fetching method selected
- [ ] Mutation method selected
- [ ] Revalidation planned
- [ ] Caching behavior planned
- [ ] Real-time strategy selected if needed

### API/backend

- [ ] API route needed or avoided
- [ ] Server Action needed or avoided
- [ ] Request validation planned
- [ ] Response shape planned
- [ ] Status codes planned
- [ ] Error handling planned

### Auth/security

- [ ] Auth requirement clear
- [ ] Permission checks planned
- [ ] Ownership checks planned
- [ ] Token/cookie handling planned
- [ ] Env variable safety checked
- [ ] Rate limit need checked
- [ ] Upload/security risks checked

### Database

- [ ] Existing model checked
- [ ] New model need confirmed
- [ ] Schema fields planned
- [ ] Indexes planned
- [ ] Query pattern checked
- [ ] Pagination need checked
- [ ] Data growth risk checked

### UI

- [ ] Components identified
- [ ] Server components identified
- [ ] Client components identified
- [ ] Form state planned
- [ ] Empty state planned
- [ ] Loading state planned
- [ ] Error state planned

### Performance

- [ ] JS bundle risk checked
- [ ] Large libraries avoided
- [ ] Image strategy checked
- [ ] Pagination checked
- [ ] Streaming checked
- [ ] Database index risk checked

### Testing

- [ ] Manual test cases planned
- [ ] API test cases planned
- [ ] Validation tests planned
- [ ] Auth tests planned
- [ ] Error cases planned

## Output format

When this skill is used, respond in this format:

```txt
# Next.js Project Plan

## 1. Goal

- What we are building:
- Who uses it:
- Main result:

## 2. Assumptions

- Assumption 1:
- Assumption 2:
- Assumption 3:

## 3. Clarification needed

- Question 1:
- Question 2:

If no clarification is needed:

- No blocking clarification needed.

## 4. App Router structure

```txt
app/
  (group)/
    route/
      page.tsx
      loading.tsx
      error.tsx
````

## 5. Server/client boundary

### Server Components

* Component:

  * Reason:

### Client Components

* Component:

  * Reason:

## 6. Data flow

* Initial data:
* Mutation:
* Revalidation:
* Caching:
* Real-time need:

## 7. API / Server Action plan

### API routes

* Method:
* Path:
* Purpose:
* Auth:
* Validation:
* Response:

### Server Actions

* Action:
* Purpose:
* Validation:
* Revalidation:

## 8. Database impact

* Existing model:
* New model:
* Fields:
* Indexes:
* Query pattern:
* Growth risk:

## 9. Auth and security

* Protected routes:
* Permission checks:
* Ownership checks:
* Env risks:
* Rate limit need:
* Other risks:

## 10. UI component plan

* Page:
* Server wrapper:
* Client components:
* Shared components:
* Empty state:
* Loading state:
* Error state:

## 11. Affected files

```txt
app/...
components/...
lib/...
models/...
schemas/...
types/...
```

## 12. Implementation order

1. Step one
2. Step two
3. Step three

## 13. Test checklist

* [ ] Success case
* [ ] Validation error
* [ ] Unauthorized access
* [ ] Not found
* [ ] Empty state
* [ ] Loading state
* [ ] Database failure

## 14. Risks

* Risk:

  * Prevention:

## 15. Do not do

* Do not:
* Do not:
* Do not:

```

## Common mistakes to prevent

- Starting code without route planning
- Creating random folders
- Making full pages Client Components
- Using `"use client"` too high
- Fetching private data from client unnecessarily
- Putting database logic in components
- Skipping validation
- Skipping auth checks
- Skipping ownership checks
- Exposing secrets to browser
- Using API routes when Server Actions are better
- Using Server Actions when API routes are required
- Polling when SSE is better
- Using WebSocket when one-way updates are enough
- Caching private user data incorrectly
- Forgetting loading states
- Forgetting error states
- Forgetting empty states
- Forgetting not-found states
- Creating models without indexes
- Creating schemas without query planning
- Adding large client libraries without need
- Ignoring deployment impact
- Ignoring env variables
- Ignoring test cases

## Quality bar

A good plan must:

- Explain the feature clearly
- Choose the correct route structure
- Keep Server Components as default
- Use Client Components only where needed
- Define data flow before UI
- Define mutation strategy clearly
- Include validation
- Include auth and security
- Include database impact
- Include affected files
- Include implementation order
- Include test cases
- Identify risks
- Prevent messy code

A bad plan:

- Starts coding too early
- Says “create component” without structure
- Makes everything client-side
- Ignores validation
- Ignores auth
- Ignores database design
- Ignores loading/error states
- Creates files without reason
- Gives generic advice
- Does not prevent mistakes
