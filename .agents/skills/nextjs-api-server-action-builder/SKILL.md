---
name: nextjs-api-server-action-builder
description: Use this skill when building backend logic inside Next.js. Use for route handlers, server actions, form submits, CRUD APIs, upload APIs, auth actions, database writes, validation, error handling, and secure backend execution. Do not use this skill for normal UI work.
---

# Next.js API Server Action Builder

## Purpose

Build production-ready backend logic inside Next.js.

This skill handles:

- Route handlers
- Server actions
- Form submit logic
- CRUD APIs
- Upload APIs
- Auth actions
- Database writes
- Input validation
- Error handling
- Secure backend logic

This skill must stay separate from UI implementation.

## When to use

Use this skill when the task includes:

- Creating `app/api/**/route.ts`
- Creating server actions with `"use server"`
- Writing database create, update, delete logic
- Handling form submissions
- Handling file uploads
- Building auth login/register/logout actions
- Validating request body, params, query, or form data
- Returning API responses
- Connecting Next.js with MongoDB/Mongoose
- Protecting backend logic from unsafe input
- Fixing backend errors inside Next.js

Do not use this skill for:

- Page UI
- Component styling
- Tailwind layout
- Animation
- Client-only state
- Normal React components

## Process

### 1. Understand the backend job

Before writing code, identify:

- What action/API is needed
- Who can access it
- What input is required
- What output is expected
- Which database model is affected
- What can fail
- What must be protected

Never start coding without knowing the backend responsibility.

### 2. Choose the correct Next.js backend method

Use route handlers when:

- Frontend or external client calls an HTTP endpoint
- Android app calls the backend
- API needs REST behavior
- File upload needs endpoint handling
- SSE/webhook/external integrations are needed

Use server actions when:

- A Next.js form submits directly
- Logic is used only inside the Next.js app
- No external client needs the endpoint
- You want simpler mutation logic

Do not use server actions for Android/mobile APIs.

### 3. Define request contract

For every backend action, define:

- Method: `GET`, `POST`, `PATCH`, `DELETE`
- Input source:
  - `params`
  - `searchParams`
  - `json body`
  - `formData`
  - `headers`
- Required fields
- Optional fields
- Validation rules
- Success response
- Error response

No unclear request shape.

### 4. Validate input first

Always validate before database work.

Use schema validation where possible:

- Zod preferred
- Manual validation only for simple cases

Validate:

- Required fields
- String length
- Number range
- MongoDB ObjectId
- Enum values
- Email format
- File size
- File type
- Date format
- Auth token presence

Never trust frontend input.

### 5. Authenticate and authorize

Before database writes, check:

- Is the user logged in?
- Is token valid?
- Is the user allowed?
- Is this user's own record?
- Is role permission required?
- Is public access safe?

Authentication answers: “Who are you?”

Authorization answers: “Can you do this?”

Do not mix them.

### 6. Connect database safely

For MongoDB/Mongoose:

- Reuse one DB connection helper
- Avoid reconnecting per request
- Import models safely
- Handle model overwrite issues
- Use indexes for frequent queries
- Use lean queries for read-only data
- Avoid fetching unused fields

Never put DB connection logic randomly inside route files.

### 7. Execute business logic

Keep route/action logic clean:

- Validate input
- Check auth
- Connect DB
- Run business logic
- Return response

Move complex logic into service/helper functions.

Do not place large business rules directly inside route handlers.

### 8. Handle errors properly

Use clear error classes or helper responses.

Handle:

- Validation errors
- Auth errors
- Permission errors
- Not found errors
- Duplicate data errors
- Database errors
- Upload errors
- Unknown errors

Never expose raw server errors to users.

### 9. Return consistent responses

For API routes, return:

```ts
return NextResponse.json(
  {
    success: true,
    data,
    message: "Action completed",
  },
  { status: 200 }
);
````

For errors:

```ts
return NextResponse.json(
  {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details,
    },
  },
  { status: 400 }
);
```

Use correct status codes:

* `200` success
* `201` created
* `400` invalid input
* `401` unauthenticated
* `403` forbidden
* `404` not found
* `409` conflict
* `413` file too large
* `429` rate limited
* `500` server error

### 10. Prevent caching mistakes

For dynamic backend routes:

```ts
export const dynamic = "force-dynamic";
```

Use this when:

* Auth is involved
* User-specific data is returned
* Real-time/latest data is required
* Database values change often

Do not accidentally cache private or live data.

### 11. Add security controls

Check for:

* Input validation
* Auth verification
* Authorization
* Rate limit if needed
* File upload restrictions
* No secrets in response
* No raw stack traces
* No unsafe redirects
* No public write endpoints
* No MongoDB injection
* No mass assignment

### 12. Add test cases

For every backend function, define tests for:

* Success case
* Missing input
* Invalid input
* Unauthorized request
* Forbidden request
* Not found
* Duplicate/conflict
* Database failure
* Edge case

At minimum, provide manual API test cases if automated tests are not requested.

## Rules

### Route handler rules

* Use `NextRequest` and `NextResponse`
* Validate request data before use
* Use correct HTTP method
* Use clear response shape
* Use correct status code
* Keep route file small
* Move reusable logic to helpers/services
* Never trust request body
* Never expose raw error details
* Never return sensitive fields

### Server action rules

* Add `"use server"`
* Validate form data
* Check auth inside the action
* Do not trust hidden fields
* Revalidate only needed paths
* Redirect only after successful mutation
* Return safe error messages
* Do not place client-only logic inside server actions

### Database write rules

* Validate all fields
* Check ownership before update/delete
* Use atomic operations where needed
* Avoid overwriting full documents accidentally
* Prevent duplicate records
* Use timestamps
* Return only needed fields
* Never allow user-controlled protected fields

### Upload API rules

* Validate file exists
* Validate file size
* Validate MIME type
* Validate extension if needed
* Rename uploaded files safely
* Never trust original filename
* Store only safe metadata
* Reject executable files
* Return clean upload result

### Auth action rules

* Hash passwords
* Never store plain passwords
* Never return password hash
* Use secure cookies when needed
* Use HTTP-only cookies
* Set sameSite correctly
* Use token expiry
* Handle invalid credentials generically
* Prevent user enumeration

## Checklist

Before final answer, verify:

* Correct backend method selected
* Route handler/server action separated from UI
* Input contract is clear
* Validation exists
* Auth check exists if needed
* Authorization check exists if needed
* Database connection is safe
* Query is efficient
* Error handling is consistent
* Status codes are correct
* Response shape is consistent
* Sensitive data is not returned
* Caching behavior is correct
* Edge cases are covered
* Test cases are included
* Code is copy-paste ready

## Output format

When using this skill, respond in this order:

### 1. Backend decision

State:

* Route handler or server action
* Why this method is correct
* Files affected

### 2. Request contract

Include:

* Method
* URL/action name
* Input
* Output
* Error cases

### 3. Implementation

Provide complete code.

Use this structure when relevant:

```txt
lib/db.ts
lib/validators/[name].ts
models/[model].ts
app/api/[resource]/route.ts
actions/[name].ts
```

### 4. Security notes

List only real risks for this task.

### 5. Test cases

Provide manual or automated test cases.

### 6. Common failure checks

Mention likely breakpoints.

## Common mistakes to prevent

Prevent these mistakes:

* Mixing UI logic with backend logic
* Using server actions for mobile APIs
* Writing database logic directly in UI components
* No request validation
* Trusting frontend input
* Missing auth checks
* Missing ownership checks
* Returning password or secret fields
* Using wrong status codes
* Returning inconsistent API shapes
* Overwriting full MongoDB documents accidentally
* Not checking ObjectId validity
* Not handling duplicate records
* Not handling upload size/type
* Exposing raw server errors
* Accidentally caching private API responses
* Reconnecting MongoDB on every request
* Making route handlers too large
* Skipping test cases

## Quality bar

The final backend code must be:

* Secure by default
* Validated before execution
* Clear in request and response shape
* Safe for production use
* Easy to test
* Easy to maintain
* Separate from UI code
* Consistent with Next.js App Router
* Safe for MongoDB/Mongoose
* Ready for real client projects

No junior-level shortcuts.
No unclear backend behavior.
No unsafe write logic.
