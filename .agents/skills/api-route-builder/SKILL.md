---
name: api-route-builder
description: Use when creating or modifying REST API routes in Express.js or Next.js. This skill handles request validation, auth checks, CRUD logic, search/filter logic, upload APIs, error handling, response shape, and correct HTTP status codes.
---
# API Route Builder

## Purpose

Create production-ready REST API routes.

This skill prevents weak APIs, missing validation, wrong status codes, raw error leaks, messy controller logic, and unstable frontend/backend contracts.

Use this skill whenever an API route is created, changed, reviewed, or connected to frontend code.

## When to use

Use this skill for:

* Express routes
* Next.js API routes
* Next.js App Router route handlers
* CRUD APIs
* Search APIs
* Filter APIs
* Pagination APIs
* Upload APIs
* Auth-protected APIs
* Admin APIs
* Public APIs
* Webhook APIs
* Frontend-to-backend API contracts

Do not use this skill for:

* Static UI-only changes
* Database schema design alone
* Auth system design alone
* Deployment-only tasks
* Non-HTTP utility functions

## Process

### 1. Understand the API goal

Identify:

* What the route must do
* Who can call it
* What data it receives
* What data it returns
* What database models it touches
* What can fail
* What frontend expects

Never write a route before the contract is clear.

### 2. Choose route type

Decide the correct API style:

* Express route
* Next.js `pages/api`
* Next.js App Router `route.ts`
* Server action only if API route is not needed

Prefer REST API route when:

* Mobile app needs access
* External client needs access
* Frontend fetches data manually
* Uploads are required
* Auth token is used
* API must be tested independently

### 3. Define endpoint contract

Define:

* Method
* Path
* Auth requirement
* Request body
* Query params
* URL params
* File fields
* Success response
* Error response
* Status codes

Example:

```txt
POST /api/records

Auth:
Bearer token required

Body:
{
  "amount": number,
  "category": string,
  "note": string optional,
  "date": string ISO
}

Success:
201 Created

Error:
400 validation error
401 missing token
403 forbidden
500 server error
```

### 4. Validate input first

Validate before business logic.

Validate:

* Required fields
* Field types
* String length
* Number range
* Enum values
* Date format
* ObjectId format
* Array limits
* File type
* File size
* Query params
* Pagination params
* Search params

Do not trust frontend validation.

Frontend validation is only UX.

Backend validation is mandatory.

### 5. Check auth and permission

Before data access, check:

* Is token required?
* Is user logged in?
* Is user active?
* Is role required?
* Does user own this resource?
* Is admin permission needed?
* Is token expired?
* Is API public or private?

Never depend only on hidden frontend buttons.

### 6. Handle request body safely

For JSON APIs:

* Parse body safely
* Reject invalid JSON
* Reject unknown dangerous fields
* Use allowlisted fields
* Normalize strings
* Trim text fields
* Convert dates carefully
* Convert numbers safely

For upload APIs:

* Validate file exists
* Validate MIME type
* Validate extension
* Validate file size
* Generate safe file name
* Never trust original filename
* Store only needed metadata
* Clean failed uploads if needed

### 7. Execute business logic

Keep route logic clean.

Preferred flow:

1. Validate input
2. Check auth
3. Check permission
4. Check existing records
5. Run database operation
6. Format response
7. Return correct status

Do not mix large business logic directly inside route files.

Move complex logic into service/helper files.

### 8. Use correct status codes

Use these common status codes:

```txt
200 OK
Successful GET, PATCH, DELETE with response body

201 Created
New resource created

204 No Content
Successful delete with no response body

400 Bad Request
Invalid input, invalid query, invalid params

401 Unauthorized
Missing or invalid authentication

403 Forbidden
Authenticated but not allowed

404 Not Found
Resource does not exist or user cannot access it

409 Conflict
Duplicate data or state conflict

413 Payload Too Large
Uploaded file or request body too large

415 Unsupported Media Type
Invalid upload/content type

422 Unprocessable Entity
Valid JSON but business validation failed

429 Too Many Requests
Rate limit exceeded

500 Internal Server Error
Unexpected server failure
```

Do not return `200` for failed requests.

Do not return `500` for user mistakes.

### 9. Return consistent response shape

Use one response format across the project.

Success response:

```ts
{
  success: true,
  message: "Record created successfully",
  data: {}
}
```

List response:

```ts
{
  success: true,
  message: "Records fetched successfully",
  data: [],
  meta: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

Error response:

```ts
{
  success: false,
  message: "Validation failed",
  errors: [
    {
      field: "amount",
      message: "Amount is required"
    }
  ]
}
```

Do not return raw database objects if they expose private fields.

### 10. Handle errors properly

Expected errors:

* Validation error
* Auth error
* Permission error
* Not found error
* Duplicate error
* File upload error
* External API error

Unexpected errors:

* Database crash
* Runtime error
* Network failure
* Unknown exception

Rules:

* Catch known errors
* Return safe messages
* Log server errors
* Do not leak stack traces
* Do not expose database internals
* Do not expose token details
* Do not expose environment variables

### 11. Add search, filter, sort, pagination safely

For search/filter APIs:

Validate:

* `page`
* `limit`
* `search`
* `sortBy`
* `sortOrder`
* date range
* category/status filters

Rules:

* Set maximum `limit`
* Use indexed fields
* Escape search input if needed
* Allowlist sortable fields
* Never pass raw query directly to MongoDB
* Avoid unlimited queries
* Return pagination metadata

### 12. Protect database queries

For MongoDB/Mongoose:

* Validate ObjectId
* Use `.lean()` for read-only list responses when suitable
* Select only required fields
* Avoid unbounded queries
* Add indexes for common filters
* Handle duplicate key errors
* Avoid N+1 queries
* Avoid saving unknown request fields

### 13. Test the route

Test:

* Valid request
* Missing body
* Invalid field type
* Missing auth
* Invalid auth
* Forbidden user
* Not found record
* Duplicate record
* Database error path
* Upload too large
* Invalid file type
* Empty result list
* Pagination edge case

### 14. Final review

Before finishing:

* Check route contract
* Check validation
* Check status codes
* Check error shape
* Check response shape
* Check auth
* Check ownership
* Check database query safety
* Check frontend compatibility
* Check production build

## Rules

* Never create an API without validation.
* Never trust frontend data.
* Never return raw server errors.
* Never expose passwords, tokens, secrets, or internal IDs unnecessarily.
* Never use `200` for failed requests.
* Never use `500` for validation errors.
* Never skip auth on private data.
* Never skip ownership checks.
* Never allow unlimited list queries.
* Never pass raw request body directly into database create/update.
* Never update protected fields from request body.
* Never accept unknown file uploads.
* Never expose stack traces in production.
* Never create duplicate response formats.
* Never mix huge business logic inside route handlers.
* Prefer small route handlers.
* Prefer service functions for complex logic.
* Prefer typed request/response contracts.
* Prefer allowlisted update fields.
* Prefer clear, boring, predictable APIs.

## Checklist

Before writing code:

* [ ] API goal is clear
* [ ] Method and path are clear
* [ ] Auth rule is clear
* [ ] Permission rule is clear
* [ ] Request body is defined
* [ ] Query params are defined
* [ ] URL params are defined
* [ ] Response shape is defined
* [ ] Status codes are defined
* [ ] Validation rules are defined
* [ ] Database model is known
* [ ] Error cases are listed

Before finishing code:

* [ ] Body validation added
* [ ] Query validation added
* [ ] Param validation added
* [ ] Auth check added
* [ ] Ownership check added
* [ ] Database query is safe
* [ ] Protected fields cannot be changed
* [ ] Correct status codes used
* [ ] Consistent success response used
* [ ] Consistent error response used
* [ ] Server errors are logged
* [ ] Stack trace is hidden
* [ ] Pagination is limited
* [ ] Uploads are validated
* [ ] Route is manually tested
* [ ] Build/typecheck passes

## Output format

When using this skill, return:

````md
# API Route Plan: [Route Name]

## 1. Goal

- [What this API does]

## 2. Route Contract

Method:
Path:
Auth:
Permission:
Content-Type:

## 3. Request

### Params

```ts
{}
````

### Query

```ts
{}
```

### Body

```ts
{}
```

### Files

```ts
{}
```

## 4. Validation Rules

* [Field] — [Rule]
* [Field] — [Rule]

## 5. Success Response

Status:

```ts
{
  success: true,
  message: "",
  data: {}
}
```

## 6. Error Responses

| Case              | Status | Message                    |
| ----------------- | -----: | -------------------------- |
| Missing auth      |    401 | Authentication required    |
| Forbidden         |    403 | You do not have permission |
| Not found         |    404 | Resource not found         |
| Validation failed |    400 | Validation failed          |
| Server error      |    500 | Something went wrong       |

## 7. Database Operations

* Model:
* Query:
* Create/update fields:
* Fields excluded:
* Index needed:

## 8. Security Checks

* [ ] Auth checked
* [ ] Ownership checked
* [ ] Input allowlisted
* [ ] Private fields excluded
* [ ] Rate limit considered
* [ ] Upload checked if needed

## 9. Implementation Steps

1. [Step]
2. [Step]
3. [Step]

## 10. Test Cases

* [ ] Valid request
* [ ] Invalid body
* [ ] Missing auth
* [ ] Forbidden user
* [ ] Not found
* [ ] Duplicate/conflict
* [ ] Server error

````

If code is requested, return code after the plan:

```md
# Implementation

## Files Changed

- `path/file.ts` — [reason]

## Code

[Code here]

## Manual Test Commands

[Postman/curl/fetch examples]
````

## Common mistakes to prevent

* Writing route before defining contract
* No backend validation
* Only frontend validation
* Wrong status codes
* Returning `200` for errors
* Returning raw MongoDB errors
* Returning full user object with password/token
* Updating fields directly from `req.body`
* Missing ownership check
* Missing ObjectId validation
* Unlimited list APIs
* Unsafe search/filter query
* No pagination metadata
* Upload route accepts any file
* No file size limit
* No error response consistency
* Business logic too large inside route
* Duplicate API response shapes
* Missing manual API tests
* Breaking frontend contract silently

## Quality bar

A production-ready API route must be:

* Clear
* Typed
* Validated
* Auth-safe
* Permission-safe
* Database-safe
* Predictable
* Easy to test
* Easy to connect with frontend
* Consistent with project response format
* Free from raw error leaks
* Free from unnecessary complexity

If the API route does not pass validation, auth, error handling, and status-code checks, it is not production-ready.
