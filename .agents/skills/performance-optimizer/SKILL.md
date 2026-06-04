---
name: performance-optimizer
description: Use after the app or feature works but feels slow. Optimizes APIs, MongoDB queries, indexes, pagination, frontend loading, images, tables, dashboards, and high-volume data screens.
---

# Performance Optimizer

## Purpose

Improve app speed after the feature is working.

This skill focuses on:
- Slow APIs
- Slow MongoDB queries
- Missing indexes
- Large table loading
- Tracker/history data
- Search API performance
- Image-heavy pages
- Frontend loading speed
- Over-fetching
- Bad pagination
- Unnecessary re-renders

## When to use

Use this skill after:
- Feature is functional
- Dashboard loads slowly
- API response is slow
- MongoDB query takes too long
- Table has many records
- Search feels delayed
- Tracker route grows large
- Page has many images
- Frontend bundle becomes heavy
- Client reports slow loading

Do not use this before the feature works.

First make it correct.
Then make it fast.

## Process

1. Identify the slow area

Check:
- Is the problem frontend?
- Is the problem backend?
- Is the problem database?
- Is the problem image/media loading?
- Is the problem network size?
- Is the problem too many requests?

Do not guess.

Find the real bottleneck.

2. Measure first

Check:
- API response time
- Database query time
- Payload size
- Number of requests
- Page load time
- Largest slow component
- Slowest MongoDB query
- Frontend bundle size
- Image size

3. Optimize APIs

Check:
- Return only required fields
- Avoid returning full documents
- Add pagination
- Add filters
- Add sorting safely
- Avoid unnecessary populate
- Avoid nested loops
- Avoid duplicate DB calls
- Avoid sending sensitive fields
- Use lean queries where suitable

4. Optimize MongoDB

Check:
- Query fields
- Sort fields
- Filter fields
- Index usage
- Compound index requirement
- Query explain plan
- Collection size
- Duplicate indexes
- Unbounded history reads

5. Optimize large data screens

For dashboards and tables:
- Use server-side pagination
- Use search debounce
- Use limit and skip carefully
- Prefer cursor pagination for large data
- Do not load all records
- Do not render thousands of rows
- Do not fetch hidden columns
- Do not refetch unchanged data

6. Optimize tracker data

For tracker/history features:
- Keep latest location separate
- Keep route history paginated
- Avoid loading full history by default
- Fetch recent points first
- Use time-range filters
- Use sessionId filters
- Use indexes on trackerId, sessionId, timestamp
- Use SSE for live latest updates
- Do not poll large history repeatedly

7. Optimize frontend loading

Check:
- Unused components
- Heavy client components
- Bad useEffect fetching
- Unnecessary re-renders
- Missing loading skeleton
- Missing dynamic imports
- Large images
- Unoptimized icons/charts/maps
- Too much client-side state

8. Optimize images

Check:
- Use next/image where suitable
- Use correct image size
- Avoid loading original large files
- Use lazy loading
- Use blur placeholder where useful
- Compress upload images
- Avoid rendering many images at once
- Use pagination or infinite loading

9. Verify after changes

After optimization:
- Compare before/after response time
- Compare payload size
- Confirm same output
- Confirm no broken filters
- Confirm no auth bypass
- Confirm pagination works
- Confirm indexes are used
- Confirm no new bugs

## Rules

- Do not optimize blindly.
- Measure before changing.
- Do not remove validation for speed.
- Do not bypass auth for speed.
- Do not return full MongoDB documents unless needed.
- Do not load all records for tables.
- Do not load full tracker history on initial page load.
- Do not use populate without checking payload size.
- Do not add random indexes.
- Add indexes based on real query patterns.
- Do not cache user-specific private data carelessly.
- Do not break correctness for speed.
- Do not hide slow APIs with only frontend loading spinners.

## Checklist

### API performance checklist

- [ ] API returns only required fields
- [ ] API has pagination
- [ ] API has safe sorting
- [ ] API has safe filters
- [ ] API avoids duplicate DB queries
- [ ] API avoids unnecessary populate
- [ ] API avoids large response payload
- [ ] API uses correct status codes
- [ ] API keeps auth and validation intact
- [ ] API response time is measured

### MongoDB checklist

- [ ] Query pattern is identified
- [ ] Filter fields are known
- [ ] Sort fields are known
- [ ] Required indexes are added
- [ ] Compound indexes are considered
- [ ] Duplicate indexes are avoided
- [ ] Query explain plan is checked
- [ ] Large collection reads are paginated
- [ ] History data is not loaded fully
- [ ] Sensitive fields are excluded

### Frontend checklist

- [ ] Page does not fetch unnecessary data
- [ ] Page has loading state
- [ ] Heavy components are lazy-loaded
- [ ] Images are optimized
- [ ] Large tables are paginated
- [ ] Search input is debounced
- [ ] Re-renders are reduced
- [ ] Client components are minimized
- [ ] Bundle size is checked
- [ ] Mobile performance is checked

### Tracker checklist

- [ ] Latest location is fetched separately
- [ ] Route history is paginated
- [ ] sessionId filter is used
- [ ] timestamp filter is used
- [ ] trackerId index exists
- [ ] sessionId + timestamp index exists
- [ ] Old history is not loaded by default
- [ ] SSE only sends latest useful updates
- [ ] Map does not redraw full route unnecessarily

### Image-heavy page checklist

- [ ] Images use optimized size
- [ ] Images lazy-load
- [ ] Large uploads are compressed
- [ ] Image list is paginated
- [ ] Hidden images are not loaded
- [ ] Correct width and height are used
- [ ] Layout shift is reduced

## Output format

Use this format:

# Performance Optimization Plan: [Feature/Page/API]

## Current problem

- Slow area:
- User-facing issue:
- Suspected bottleneck:
- Confirmed bottleneck:
- Risk level:

## Measurements before optimization

| Area | Current result | Problem |
|---|---:|---|
| API response time |  |  |
| DB query time |  |  |
| Payload size |  |  |
| Page load time |  |  |
| Number of requests |  |  |

## Backend optimization

### API changes

### Query changes


### Required indexes

```js
// Example
schema.index({ userId: 1, createdAt: -1 });
schema.index({ trackerId: 1, sessionId: 1, timestamp: -1 });
````

### Response shape improvement

Before:

```json
{}
```
After:

```json
{}
```

## Frontend optimization

*
*
*

## Pagination plan

* Pagination type:
* Default limit:
* Maximum limit:
* Sort field:
* Cursor field:
* Empty state:
* Next page behavior:

## Security checks

* Auth still enforced:
* User access still scoped:
* Sensitive fields removed:
* Validation still active:

## Measurements after optimization

| Area              | Before | After | Result |
| ----------------- | -----: | ----: | ------ |
| API response time |        |       |        |
| DB query time     |        |       |        |
| Payload size      |        |       |        |
| Page load time    |        |       |        |

## Final pass criteria

* [ ] API response is faster
* [ ] Payload is smaller
* [ ] Query uses indexes
* [ ] Pagination works
* [ ] No full collection load
* [ ] No auth/security regression
* [ ] Frontend loading feels better
* [ ] Same feature behavior preserved

```

## Common mistakes to prevent

- Optimizing before measuring
- Adding random indexes
- Loading full MongoDB collections
- Returning full documents from APIs
- Using populate everywhere
- Fetching all tracker history every time
- Rendering huge tables in browser
- Missing pagination
- Missing search debounce
- Loading original-size images
- Moving all logic to frontend
- Breaking auth while improving speed
- Using cache without user isolation
- Hiding slow APIs behind spinners
- Ignoring mobile performance

## Quality bar

Performance work is acceptable only if:

- Bottleneck is identified
- Before/after numbers are shown
- API payload is reduced where possible
- MongoDB indexes match real queries
- Large data uses pagination
- Tracker history is not loaded fully
- Frontend avoids unnecessary loading
- Security and validation remain intact
- Feature behavior stays the same
```

Example trigger prompt:

```txt
Use performance-optimizer.

This feature works but is slow:
[describe page/API/feature]

Analyze:
- Slow APIs
- MongoDB queries
- Required indexes
- Pagination
- Over-fetching
- Frontend loading
- Image optimization
- Before/after improvement plan
```

Mistakes this skill prevents:

* Slow dashboards
* Heavy API responses
* Missing MongoDB indexes
* Bad large-table loading
* Tracker history overload
* Search API lag
* Image-heavy page slowdown
* Frontend over-fetching
* Random optimization without measurement

This fits your senior MERN/backend skill system and follows your required task-based structure. 
