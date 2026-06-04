---
name: bug-debugger
description: Use when something breaks in Next.js, Express, MongoDB, auth, CORS, deployment, API routes, frontend/backend integration, or production runtime. This skill reads error logs, finds root cause, avoids guessing, suggests the smallest safe fix, and prevents side effects.
---

# Bug Debugger

## Purpose

Find the real root cause before changing code.

This skill prevents random fixes, unnecessary rewrites, hidden side effects, and repeated bugs.

Use this skill when the app breaks, crashes, fails to build, fails to deploy, or behaves incorrectly.

## When to use

Use this skill for:

* Next.js errors
* React runtime errors
* Express crashes
* API route failures
* MongoDB connection issues
* Mongoose errors
* CORS errors
* JWT/auth bugs
* Cookie/session bugs
* Environment variable issues
* Deployment bugs
* Vercel errors
* Render/Railway errors
* Build errors
* TypeScript errors
* Package/version conflicts
* Frontend/backend integration bugs
* Upload bugs
* Slow or hanging requests

Do not use this skill for:

* New feature planning
* Normal API creation
* UI redesign
* Database schema design
* Code review without a known bug

## Process

### 1. Collect the facts

Before suggesting a fix, collect:

* Exact error message
* Full stack trace
* File path from error
* Line number from error
* Command that caused the error
* Page/API route affected
* Request payload if API bug
* Environment where bug happens
* Recent code change
* Expected behavior
* Actual behavior

Do not guess from one vague sentence.

If logs are missing, ask for the smallest missing detail.

### 2. Classify the bug

Classify the problem type:

* Syntax error
* TypeScript error
* Runtime error
* Build error
* API logic error
* Database connection error
* Schema/model error
* Validation error
* Auth/permission error
* CORS/config error
* Environment variable error
* Deployment platform error
* Dependency/version error
* Race condition
* Data mismatch
* Frontend state bug

This prevents fixing the wrong layer.

### 3. Identify where the bug starts

Find the first real failing point.

Check:

* First error line
* First project file in stack trace
* API route entry point
* Controller/service function
* Database query
* Middleware
* Environment config
* Frontend fetch call
* Deployment logs

Do not treat the last error line as root cause.

Stack traces often show symptoms first.

### 4. Reproduce the bug

Define the smallest reproduction path.

Examples:

```txt
Open /dashboard
Click Add Record
Submit empty amount
API returns 500
```

```txt
Run npm run build
Next.js fails at app/api/records/route.ts
```

```txt
POST /api/login
Valid credentials
JWT cookie not set in browser
```

If the bug cannot be reproduced, do not rewrite code.

### 5. Trace data flow

For API bugs, trace:

1. Frontend request
2. Request URL
3. Method
4. Headers
5. Body/query/params
6. Middleware
7. Validation
8. Controller/service
9. Database query
10. Response
11. Frontend handling

For auth bugs, trace:

1. Login response
2. Token creation
3. Cookie/header storage
4. Request auth header/cookie
5. Middleware verification
6. User lookup
7. Permission check

For MongoDB bugs, trace:

1. Connection string
2. DB connection timing
3. Model import
4. Schema field type
5. Query params
6. ObjectId validation
7. Duplicate key risk
8. Index/constraint issue

### 6. Separate symptom from root cause

Use this logic:

```txt
Symptom:
What the user sees.

Immediate error:
What crashed.

Root cause:
Why it crashed.

Fix:
Smallest change that removes root cause.

Prevention:
Validation, check, test, or structure change.
```

Example:

```txt
Symptom:
Login button shows "Something went wrong".

Immediate error:
Cannot read properties of undefined reading 'email'.

Root cause:
API returns error without data.user, but frontend assumes user exists.

Fix:
Check response.success before accessing response.data.user.

Prevention:
Use consistent API response type.
```

### 7. Suggest the smallest safe fix

Prefer:

* One-line fix if enough
* Small guard condition
* Correct import
* Correct env variable
* Correct API path
* Correct validation
* Correct status code
* Correct async/await usage
* Correct middleware order
* Correct dependency version
* Correct platform config

Avoid:

* Full rewrites
* New library
* Changing unrelated files
* Refactoring during debugging
* Editing schema without proof
* Changing auth flow blindly
* Disabling TypeScript
* Ignoring lint/build errors

### 8. Check side effects

Before final fix, check:

* Does this break another route?
* Does this change response shape?
* Does this change database data?
* Does this weaken auth?
* Does this expose private data?
* Does this hide the real error?
* Does this only work locally?
* Does this fail on deployment?
* Does this affect old records?
* Does this affect mobile/API clients?

### 9. Add prevention

After fixing root cause, add prevention:

* Input validation
* Null checks
* Better error message
* Typed response
* Environment variable check
* API test
* Build test
* Auth test
* DB connection guard
* CORS config check
* Deployment checklist item

Do not stop at “it works now.”

### 10. Verify the fix

Verify with:

* Same command that failed
* Same page action
* Same API request
* Same deployment flow
* Same environment if possible

Also test one nearby edge case.

## Rules

* Do not guess.
* Do not rewrite before diagnosis.
* Do not fix symptoms only.
* Do not change unrelated files.
* Do not add packages unless required.
* Do not silence errors without understanding them.
* Do not use `any` to escape TypeScript errors.
* Do not remove validation to make a request work.
* Do not disable auth to fix API bugs.
* Do not expose stack traces to users.
* Do not delete lock files randomly.
* Do not change deployment settings without checking logs.
* Do not assume local and production environments are same.
* Do not return vague answers like “check your config.”
* Always point to the likely file and line.
* Always explain root cause in simple words.
* Always suggest the smallest safe fix first.
* Always include verification steps.

## Checklist

Before fixing:

* [ ] Exact error message is known
* [ ] Stack trace is checked
* [ ] First project file is identified
* [ ] Bug type is classified
* [ ] Reproduction path is clear
* [ ] Expected behavior is known
* [ ] Actual behavior is known
* [ ] Recent changes are considered
* [ ] Environment is known
* [ ] Root cause is separated from symptom

Before final answer:

* [ ] Minimal fix is suggested
* [ ] Affected files are listed
* [ ] Side effects are considered
* [ ] Security impact is checked
* [ ] Database impact is checked
* [ ] Verification steps are included
* [ ] Prevention step is included
* [ ] No unrelated rewrite is suggested

## Output format

When using this skill, respond in this format:

````md
# Bug Debug Report: [Short Bug Name]

## 1. Error Summary

- Error:
- Where it happens:
- Environment:
- Command/action that triggers it:

## 2. Bug Type

- [Next.js / Express / MongoDB / Auth / CORS / Deployment / TypeScript / Runtime]

## 3. Most Likely Root Cause

- [Clear root cause]

## 4. Evidence

- Log line:
- File:
- Line:
- Why this points to the root cause:

## 5. Affected Files

- `path/file.ts` — [why affected]
- `path/file.tsx` — [why affected]

## 6. Minimal Fix

```ts
// show only the changed part when possible
````

## 7. Why This Fix Works

* [Simple explanation]

## 8. Side Effects To Check

* [Possible risk]
* [Possible risk]

## 9. Verification Steps

1. Run:

   ```bash
   npm run build
   ```

2. Test:

   ```bash
   curl -X POST http://localhost:3000/api/example
   ```

3. Confirm:

   * [Expected result]

## 10. Prevention

* [Validation/test/config/check to prevent repeat]

````

If logs are missing, respond in this format:

```md
# Debug Info Needed

Send only these details:

1. Full error message
2. Full stack trace
3. File name shown in the error
4. Command or action that triggered it
5. Recent file you changed
6. Local or deployment environment

Do not send screenshots if text logs are available.
Copy-paste logs are better.
````

## Common mistakes to prevent

* Guessing based on error title only
* Fixing the frontend when backend failed
* Fixing backend when request body is wrong
* Ignoring the first stack trace line
* Treating deployment error like local error
* Clearing cache blindly
* Reinstalling packages blindly
* Deleting `node_modules` as first solution
* Disabling ESLint or TypeScript
* Adding `any` everywhere
* Returning `null` to hide crashes
* Catching errors without logging
* Removing auth middleware to make API work
* Opening CORS to `*` with credentials
* Using wrong MongoDB URI
* Creating multiple DB connections in Next.js
* Forgetting environment variables in Vercel/Render/Railway
* Ignoring Node.js version mismatch
* Changing schema without checking existing data
* Fixing one route but breaking response contract

## Quality bar

A good debug answer must:

* Identify the root cause
* Show evidence from logs/code
* Suggest the smallest safe fix
* Avoid unrelated changes
* Explain side effects
* Include verification steps
* Include prevention
* Keep security intact
* Keep database safe
* Keep production behavior in mind

If the root cause is not proven, say so clearly and request the minimum missing logs.
