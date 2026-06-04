---
name: code-reviewer
description: Use after coding, before deployment, before client delivery, or when reviewing pull requests. Reviews changed code for bugs, bad structure, security issues, missing edge cases, weak validation, performance problems, and maintainability risks.
---

# Code Reviewer

## Purpose

Review changed code like a senior backend/MERN developer before it reaches production.

This skill checks:
- Bugs
- Bad structure
- Security risks
- Missing validation
- Missing edge cases
- Weak error handling
- Performance problems
- Database mistakes
- Frontend-backend mismatch
- Deployment-breaking issues

## When to use

Use this skill when:
- Code was newly written
- Existing code was changed
- A pull request needs review
- Code is going to production
- Code is going to a client
- API, auth, database, or payment logic changed
- Bug fix needs verification
- Refactor needs risk checking

Use especially for:
- Next.js API routes
- Express routes
- MongoDB/Mongoose models
- Auth and JWT logic
- File upload logic
- Admin dashboards
- Client-facing projects
- Production deployment checks

## Process

### 1. Understand the change

First identify:
- What files changed
- What feature was added or changed
- What user flow is affected
- What API routes are affected
- What database models are affected
- What security-sensitive logic changed

Do not review blindly.

### 2. Check correctness

Verify:
- Code does what the task requires
- No broken imports
- No wrong function names
- No missing return statements
- No unreachable code
- No accidental async mistakes
- No incorrect status codes
- No incorrect query logic
- No wrong field names
- No frontend/backend contract mismatch

### 3. Check validation

Review all external input:
- Request body
- Query params
- Route params
- Headers
- Cookies
- FormData
- File uploads

Check:
- Required fields
- Empty values
- Invalid types
- Invalid IDs
- Large payloads
- Unexpected fields
- Invalid enum values
- Date format issues
- Number range issues

Reject bad input before database logic.

### 4. Check security

Look for:
- Missing authentication
- Missing authorization
- User can access other user data
- JWT not verified correctly
- Trusting client-provided userId
- Password returned in response
- Sensitive data logged
- Unsafe CORS setup
- Unsafe file upload
- No rate limiting on sensitive routes
- MongoDB injection risk
- Weak cookie settings
- Exposed environment variables
- Missing ownership checks

Security issues must be marked as high priority.

### 5. Check database logic

Review:
- Schema fields
- Required indexes
- Unique constraints
- References
- Population usage
- Query filters
- Update operations
- Delete behavior
- Soft delete logic
- Transaction need
- Race condition risk

Check Mongoose usage:
- `findByIdAndUpdate` validates properly
- `runValidators: true` used where needed
- `new: true` used when updated data is needed
- ObjectId validation exists
- No uncontrolled `$set` from request body
- No large unbounded queries

### 6. Check error handling

Verify:
- Errors are caught
- Client gets safe messages
- Server logs useful details
- No stack trace sent to client
- Correct HTTP status codes
- Consistent response format
- Known errors are handled separately
- Unknown errors return 500 safely

### 7. Check edge cases

Actively test failure paths:
- Empty database
- Missing user
- Invalid token
- Expired token
- Duplicate record
- Deleted record
- Network failure
- Database failure
- File too large
- Invalid file type
- Permission denied
- Concurrent requests
- Mobile/offline sync duplicates

Do not only review happy path.

### 8. Check performance

Look for:
- N+1 queries
- Unbounded database queries
- Missing pagination
- Missing indexes
- Large response payloads
- Repeated expensive calculations
- Excessive re-renders
- Bad polling loops
- Blocking server work
- Inefficient aggregation
- Missing caching where useful

### 9. Check maintainability

Review:
- Clear naming
- Small functions
- No duplicated logic
- No mixed frontend/backend concerns
- No business logic inside UI components
- No route files becoming too large
- Reusable validation
- Reusable error helpers
- Clean folder boundaries
- Consistent response structure

### 10. Give review result

Return only useful findings.

Do not rewrite full code unless needed.

Give:
- Critical issues first
- Exact file/function location
- Why it is a problem
- Minimal fix
- Risk if ignored

## Rules

- Do not approve code with security gaps.
- Do not ignore missing validation.
- Do not assume frontend sends correct data.
- Do not trust client-provided IDs.
- Do not expose passwords, tokens, or secrets.
- Do not suggest large refactors unless required.
- Prefer minimal safe fixes.
- Mark production blockers clearly.
- Separate actual bugs from suggestions.
- Mention uncertainty when code context is incomplete.
- Do not invent files or logic not shown.
- Review changed code, but flag affected nearby risks.
- Always check auth, validation, database, and errors.

## Checklist

### Correctness

- [ ] Feature matches requirement
- [ ] Code compiles
- [ ] Imports are correct
- [ ] Async/await handled properly
- [ ] Return paths are complete
- [ ] Response format is consistent
- [ ] Frontend and backend contract matches

### API

- [ ] Correct HTTP method
- [ ] Correct status codes
- [ ] Request body validated
- [ ] Query params validated
- [ ] Route params validated
- [ ] Error response is safe
- [ ] Success response is minimal

### Auth and security

- [ ] Auth required where needed
- [ ] Authorization checked
- [ ] Ownership checked
- [ ] JWT verified safely
- [ ] Passwords never returned
- [ ] Secrets not exposed
- [ ] Sensitive routes protected
- [ ] File uploads restricted
- [ ] Logs do not leak private data

### MongoDB/Mongoose

- [ ] ObjectId validated
- [ ] Schema fields are correct
- [ ] Required indexes considered
- [ ] Queries are scoped by user/owner
- [ ] Updates are controlled
- [ ] Validation runs on updates
- [ ] Pagination exists for lists
- [ ] No unbounded expensive queries

### Error handling

- [ ] Known errors handled
- [ ] Unknown errors handled
- [ ] No stack trace sent
- [ ] Useful server logs exist
- [ ] Client message is safe
- [ ] Error format is consistent

### Edge cases

- [ ] Empty input
- [ ] Invalid input
- [ ] Missing records
- [ ] Duplicate records
- [ ] Unauthorized access
- [ ] Concurrent requests
- [ ] Database failure
- [ ] Mobile/offline sync issues if relevant

### Performance

- [ ] No unnecessary queries
- [ ] No N+1 query issue
- [ ] Pagination used
- [ ] Indexes considered
- [ ] Response size controlled
- [ ] No bad polling pattern
- [ ] No unnecessary re-renders

### Maintainability

- [ ] Code is readable
- [ ] Logic is not duplicated
- [ ] Functions are focused
- [ ] Structure is clean
- [ ] Naming is clear
- [ ] Business logic is separated
- [ ] No quick hack left behind

## Output format

Return review in this format:

```md
# Code Review Result

## Verdict

Choose one:
- Approved
- Approved with small fixes
- Needs changes
- Blocked for production

## Critical Issues

### 1. Issue title
- File:
- Problem:
- Risk:
- Fix:

## Bugs

### 1. Issue title
- File:
- Problem:
- Risk:
- Fix:

## Security Issues

### 1. Issue title
- File:
- Problem:
- Risk:
- Fix:

## Validation Issues

### 1. Issue title
- File:
- Problem:
- Risk:
- Fix:

## Database Issues

### 1. Issue title
- File:
- Problem:
- Risk:
- Fix:

## Edge Cases Missing

- Case:
- Current behavior:
- Expected behavior:
- Fix:

## Performance Issues

- Problem:
- Risk:
- Fix:

## Structure / Maintainability Issues

- Problem:
- Why it hurts:
- Fix:

## Required Fixes Before Merge

- [ ] Fix 1
- [ ] Fix 2
- [ ] Fix 3

## Optional Improvements

- Improvement 1
- Improvement 2

## Final Recommendation

Clear final decision.