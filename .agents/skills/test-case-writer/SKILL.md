---
name: test-case-writer
description: Use after a feature, API, form, auth flow, upload flow, or bug fix is built. Creates manual test checklists, API test cases, success/failure cases, and edge-case coverage before production release.
---

# Test Case Writer

## Purpose

Create practical test cases before shipping code.

This skill prevents hidden bugs by testing:
- Happy paths
- Failure paths
- Validation errors
- Auth errors
- Database edge cases
- API response correctness
- UI form behavior
- Upload behavior
- Role/permission issues
- Production-risk scenarios

## When to use

Use this skill after:
- A feature is completed
- An API route is built
- A form is connected
- Auth logic is added
- File upload is added
- A bug is fixed
- A deployment is planned
- Postman testing is needed
- Manual QA checklist is needed

Use before:
- Client delivery
- Production deployment
- Pull request approval
- Final handoff

## Process

1. Understand the feature

Check:
- What the feature does
- Who uses it
- Which API routes are involved
- Which database collections are affected
- Which frontend forms or pages are involved
- Which auth rules apply
- Which files/uploads are involved

2. Identify user flows

Cover:
- Normal user flow
- Invalid user flow
- Empty input flow
- Unauthorized flow
- Expired session flow
- Slow network flow
- Duplicate request flow
- Database failure flow

3. Create manual test checklist

Include:
- UI behavior
- Form validation
- Loading state
- Error state
- Success state
- Empty state
- Mobile layout
- Refresh behavior
- Back button behavior
- Session behavior

4. Create API test cases

For every API route, define:
- Method
- Endpoint
- Request body
- Required headers
- Expected status code
- Expected response body
- Database change
- Failure case

5. Create edge cases

Check:
- Missing fields
- Wrong data types
- Invalid ObjectId
- Duplicate data
- Very long input
- Special characters
- Empty arrays
- Large payloads
- Invalid file type
- Large file size
- Expired JWT
- Missing token
- Wrong user access

6. Define pass/fail rules

Each test must have:
- Clear expected result
- Clear failure condition
- No vague wording
- No “works fine” statements

7. Give Postman-ready cases

For APIs, include:
- Request method
- URL
- Headers
- Body JSON
- Expected response
- Expected database result

## Rules

- Do not only test happy paths.
- Every API must include failure tests.
- Every form must include validation tests.
- Every auth route must test missing and invalid token.
- Every database write must test duplicate and invalid data.
- Every upload must test file size and file type.
- Every test must have expected output.
- Do not write vague checklist items.
- Do not ignore mobile testing.
- Do not ignore loading and error states.
- Do not assume frontend validation is enough.
- Backend validation must be tested separately.

## Checklist

### Feature checklist

- [ ] Main feature works correctly
- [ ] Empty state works
- [ ] Loading state works
- [ ] Success message works
- [ ] Error message works
- [ ] Page refresh does not break state
- [ ] Mobile layout works
- [ ] User cannot access restricted data
- [ ] Duplicate action is handled
- [ ] Wrong input is rejected
- [ ] Database stores correct data
- [ ] API returns correct status codes

### API checklist

- [ ] Correct method used
- [ ] Correct endpoint used
- [ ] Required headers checked
- [ ] Request body validated
- [ ] Missing fields rejected
- [ ] Wrong data types rejected
- [ ] Invalid IDs rejected
- [ ] Unauthorized request rejected
- [ ] Forbidden request rejected
- [ ] Success response is correct
- [ ] Error response is consistent
- [ ] Database changes are correct
- [ ] No sensitive data leaks

### Auth checklist

- [ ] Login works with valid credentials
- [ ] Login fails with wrong credentials
- [ ] Protected route blocks missing token
- [ ] Protected route blocks invalid token
- [ ] Protected route blocks expired token
- [ ] User cannot access another user's data
- [ ] Logout/session expiry works
- [ ] Password/token is never returned in response

### Upload checklist

- [ ] Valid file uploads correctly
- [ ] Missing file is rejected
- [ ] Wrong file type is rejected
- [ ] Large file is rejected
- [ ] Corrupt file is handled
- [ ] Upload failure shows error
- [ ] File URL/path is saved correctly
- [ ] Old file cleanup is handled if needed

## Output format

Use this format:

```md
# Test Plan: [Feature Name]

## Feature summary

- Feature:
- User role:
- Pages involved:
- APIs involved:
- Database collections:
- Auth required:

## Manual test checklist

| # | Test case | Steps | Expected result | Status |
|---|----------|-------|-----------------|--------|
| 1 |          |       |                 | Pending |

## API test cases

### API: [METHOD] [ENDPOINT]

#### Success case

- Method:
- URL:
- Headers:
- Body:

```json
{}
````

Expected status:

```txt
200
```

Expected response:

```json
{}
```

Expected database result:

*

#### Failure cases

| # | Case          | Request change              | Expected status | Expected result  |
| - | ------------- | --------------------------- | --------------- | ---------------- |
| 1 | Missing token | Remove Authorization header | 401             | Request rejected |
| 2 | Invalid body  | Send wrong data type        | 400             | Validation error |

## Edge cases

## Security tests

## Regression tests


## Final pass criteria

Feature is ready only if:

* [ ] All success cases pass
* [ ] All failure cases pass
* [ ] All auth tests pass
* [ ] All validation tests pass
* [ ] No sensitive data leaks
* [ ] No unhandled server errors
* [ ] Database state is correct

## Common mistakes to prevent

- Testing only the success case
- Ignoring invalid request bodies
- Ignoring missing JWT token
- Ignoring expired JWT token
- Returning wrong status codes
- Forgetting database verification
- Ignoring duplicate submissions
- Ignoring file upload limits
- Ignoring mobile UI testing
- Ignoring refresh/back-button behavior
- Ignoring user permission boundaries
- Saying “tested” without written cases
- Shipping without failure-case testing

## Quality bar

A test plan is acceptable only if:

- Every API has success and failure cases
- Every test has expected result
- Every auth rule is tested
- Every validation rule is tested
- Every database write is verified
- Every risky edge case is covered
- A junior developer can run the test plan without asking questions
- The feature cannot be shipped until critical tests pass

Example trigger prompt:

Use test-case-writer.

Feature is built:
[describe feature]

Create:
- Manual test checklist
- API test cases
- Postman cases
- Success cases
- Failure cases
- Edge cases
- Security tests
- Final pass criteria

Mistakes this skill prevents:

* Shipping APIs without failure testing
* Missing auth/security test cases
* Forgetting validation testing
* Ignoring database side effects
* Testing only from frontend
* Skipping Postman/API tests
* Missing upload edge cases
* Letting junior-level bugs reach production
