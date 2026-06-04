---
name: project-planner
description: Use before coding any new feature, big refactor, API + UI flow, database change, or client requirement breakdown. This skill forces the agent to understand the feature, find affected files, plan frontend/backend/database work, identify risks, and avoid random implementation.
---

# Project Planner

## Purpose

Plan the work before writing code.

This skill prevents random implementation, missed files, weak backend planning, bad database changes, and unclear frontend/backend flow.

Use this skill to think like a senior developer before coding.

## When to use

Use this skill before:

- New feature implementation
- Big refactor
- API + UI flow
- Database schema change
- Auth or permission change
- Client requirement breakdown
- Multi-file change
- Bug fix with unknown root cause
- Production-impacting change

Do not use this skill for:

- Small text change
- Simple CSS tweak
- One-line typo fix
- Already-planned implementation

## Process

### 1. Understand the request

Read the user request carefully.

Identify:

- Main goal
- User role
- User flow
- Business rule
- Expected output
- Success condition
- Missing information

If critical information is missing, ask only the minimum questions.

Do not ask questions if a safe assumption is enough.

### 2. Inspect the existing project

Before planning code, find related files.

Check:

- Routes/pages
- Components
- API routes
- Controllers
- Services
- Models/schemas
- Validation files
- Middleware
- Auth logic
- Config files
- Environment variables
- Existing helper functions
- Existing UI patterns

Do not create new files before checking existing structure.

### 3. Find affected files

List files likely affected.

Group them by:

- Frontend
- Backend/API
- Database
- Auth/security
- Validation
- Testing
- Config/deployment

Mention whether each file is:

- Existing file to edit
- New file to create
- File to avoid changing

### 4. Plan frontend work

Define:

- Pages/screens affected
- Components needed
- State management
- Form fields
- Loading state
- Empty state
- Error state
- Success state
- API calls
- User permissions
- Mobile/responsive behavior

Avoid UI work without API/data understanding.

### 5. Plan backend/API work

Define:

- API endpoint
- HTTP method
- Request body
- Query params
- Response format
- Status codes
- Controller/service logic
- Validation
- Error handling
- Auth middleware
- Rate limit needs
- Logging needs

Never expose sensitive data.

Never trust frontend input.

### 6. Plan database work

Define:

- Collection/model affected
- Fields to add/change
- Required fields
- Optional fields
- Indexes
- Unique constraints
- Relations/references
- Migration/backfill needs
- Data validation rules
- Data retention concerns

Avoid schema changes without checking existing data impact.

### 7. Identify risks

Check for:

- Security risk
- Breaking existing flow
- Bad data shape
- Race condition
- Duplicate records
- Missing validation
- Permission bypass
- Performance issue
- Bad UX state
- Deployment issue
- Environment variable missing
- Third-party API limitation

### 8. Create implementation plan

Break the work into ordered steps.

Each step must be small and testable.

Correct order:

1. Understand current flow
2. Update schema/types
3. Add validation
4. Add backend logic
5. Add API route
6. Connect frontend
7. Add states/errors
8. Add tests/manual checks
9. Review security
10. Final cleanup

### 9. Define testing plan

Include:

- Unit checks
- API tests
- UI manual tests
- Database checks
- Auth/permission checks
- Error case checks
- Production build check

### 10. Define done criteria

Feature is done only when:

- Flow works end-to-end
- Validation works
- Errors are handled
- Data is saved correctly
- UI states are complete
- Existing features still work
- Security is checked
- Code is clean
- No random unused files exist

## Rules

- Do not start coding before planning.
- Do not guess file structure.
- Do not create duplicate logic.
- Do not skip validation.
- Do not skip error handling.
- Do not ignore existing patterns.
- Do not add unnecessary libraries.
- Do not change database schema casually.
- Do not expose secrets or tokens.
- Do not trust frontend data.
- Do not overbuild the first version.
- Keep the plan practical.
- Prefer simple architecture.
- Reuse existing project conventions.
- Ask questions only when blocking.
- Make assumptions explicit.

## Checklist

Before coding, confirm:

- [ ] Feature goal is clear
- [ ] User flow is clear
- [ ] Existing files are checked
- [ ] Affected files are listed
- [ ] Frontend plan is clear
- [ ] Backend/API plan is clear
- [ ] Database impact is clear
- [ ] Auth/security impact is clear
- [ ] Validation rules are clear
- [ ] Error handling is planned
- [ ] Edge cases are listed
- [ ] Testing plan exists
- [ ] Risks are identified
- [ ] Implementation steps are ordered
- [ ] Done criteria is defined

## Output format

Return the plan in this format:

```md
# Project Plan: [Feature Name]

## 1. Goal

- [Clear goal]

## 2. Current Understanding

- [What the feature must do]
- [Who uses it]
- [Expected result]

## 3. Assumptions

- [Assumption 1]
- [Assumption 2]

## 4. Questions

Only blocking questions:

- [Question 1]

If no blocking questions:

- No blocking questions.

## 5. Affected Files

### Frontend

- `path/file.tsx` — [edit/create/avoid] — [reason]

### Backend/API

- `path/file.ts` — [edit/create/avoid] — [reason]

### Database

- `path/model.ts` — [edit/create/avoid] — [reason]

### Config/Env

- `.env` — [edit/create/avoid] — [reason]

### Tests

- `path/test.ts` — [edit/create/avoid] — [reason]

## 6. Frontend Plan

- [Step]
- [State handling]
- [API connection]
- [Error/success handling]

## 7. Backend/API Plan

- Endpoint:
- Method:
- Request:
- Response:
- Auth:
- Validation:
- Error handling:

## 8. Database Plan

- Model:
- Fields:
- Indexes:
- Migration needed:
- Data risk:

## 9. Security Plan

- [Auth check]
- [Input validation]
- [Sensitive data protection]
- [Rate limit if needed]

## 10. Risks

| Risk | Impact | Prevention |
|---|---|---|
| [Risk] | [Impact] | [Fix] |

## 11. Implementation Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## 12. Testing Plan

- [Manual/API/UI test]
- [Auth test]
- [Error test]
- [Build test]

## 13. Done Criteria

- [ ] [Criteria]
- [ ] [Criteria]