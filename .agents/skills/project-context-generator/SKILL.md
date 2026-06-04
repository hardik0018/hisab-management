---

name: project-context-generator
description: Use when an existing project has missing or weak context files like AGENTS.md, PROJECT_CONTEXT.md, DESIGN_SYSTEM.md, API_CONTRACTS.md, or DATABASE_NOTES.md. This skill analyzes the current codebase and creates clear project context documents for AI agents and developers.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Project Context Generator

## Purpose

Create missing project context documents from the existing codebase.

This skill helps AI agents understand the project before making changes.

It prevents random coding, wrong assumptions, duplicated logic, and broken architecture.

## When to use

Use this skill when:

* Project has no `AGENTS.md`
* Project has no `PROJECT_CONTEXT.md`
* Project has no `DESIGN_SYSTEM.md`
* Project has no `API_CONTRACTS.md`
* Project has no `DATABASE_NOTES.md`
* Existing context files are outdated
* AI agent lacks project understanding
* New developer needs project onboarding
* Codebase exists but documentation is weak

Do not use this skill for:

* New empty projects
* Small one-file scripts
* Projects without readable source code
* Writing marketing documentation

## Process

### 1. Scan project structure

Check:

* Framework
* Main folders
* Routing system
* API routes
* Database models
* Auth flow
* UI system
* Environment variables
* Deployment setup
* State management
* External services

### 2. Identify project type

Detect if project is:

* Next.js app
* MERN app
* Express API
* Admin dashboard
* Client website
* SaaS app
* Tracker app
* Hisab/accounting app
* API-based web app

### 3. Read important files

Check:

* `package.json`
* `next.config.*`
* `tsconfig.json`
* `.env.example`
* `middleware.ts`
* `app/`
* `pages/`
* `src/`
* `components/`
* `lib/`
* `models/`
* `schemas/`
* `routes/`
* `controllers/`
* `services/`
* `utils/`
* `styles/`

### 4. Generate context files

Create these files:

* `AGENTS.md`
* `PROJECT_CONTEXT.md`
* `DESIGN_SYSTEM.md`
* `API_CONTRACTS.md`
* `DATABASE_NOTES.md`

### 5. Keep documents factual

Only document what exists in code.

Do not invent features.

If something is unclear, mark it as:

`Unknown from current code`

### 6. Add improvement notes

Add short notes for:

* Missing validation
* Weak auth
* Messy structure
* Duplicate logic
* Missing error handling
* Missing tests
* Missing deployment notes

## Rules

* Never guess business logic.
* Never invent API endpoints.
* Never invent database fields.
* Never rewrite code while documenting.
* Use simple English.
* Keep documents practical.
* Prefer tables for API and database notes.
* Mention unclear areas directly.
* Separate facts from recommendations.
* Use current code as source of truth.
* Do not include secrets from `.env`.
* Do not expose tokens, keys, passwords, or private URLs.

## Required files

### 1. AGENTS.md

Purpose:

Guide AI agents working on this project.

Must include:

* Project summary
* Tech stack
* Important commands
* Folder rules
* Coding rules
* Testing rules
* Safety rules
* Files agents must read first
* Things agents must not change without reason

### 2. PROJECT_CONTEXT.md

Purpose:

Explain what the app does.

Must include:

* App goal
* Main users
* Main features
* Current implementation status
* Important flows
* Known limitations
* Future work
* Development assumptions

### 3. DESIGN_SYSTEM.md

Purpose:

Document UI patterns.

Must include:

* Theme mode
* Fonts
* Colors
* Layout style
* Components
* Button styles
* Card styles
* Form styles
* Responsive rules
* Animation rules
* UI mistakes to avoid

If design system is unclear, document current patterns only.

### 4. API_CONTRACTS.md

Purpose:

Document backend API behavior.

Must include:

* API route
* Method
* Purpose
* Request body
* Response body
* Auth requirement
* Validation rules
* Error responses
* Side effects

Use this table format:

| Method | Route | Purpose | Auth | Request | Response | Notes |
| ------ | ----- | ------- | ---- | ------- | -------- | ----- |

### 5. DATABASE_NOTES.md

Purpose:

Document database structure.

Must include:

* Database type
* Connection file
* Models
* Collections
* Fields
* Indexes
* Relationships
* Validation
* Data lifecycle
* Risks

Use this table format:

| Model | Collection | Field | Type | Required | Notes |
| ----- | ---------- | ----- | ---- | -------- | ----- |

## Checklist

Before writing files:

* [ ] Checked `package.json`
* [ ] Checked routing structure
* [ ] Checked API routes
* [ ] Checked database models
* [ ] Checked auth logic
* [ ] Checked UI components
* [ ] Checked style files
* [ ] Checked config files
* [ ] Checked environment examples
* [ ] Checked deployment files

Before final output:

* [ ] No invented features
* [ ] No secrets included
* [ ] All unclear areas marked
* [ ] API routes documented
* [ ] Database models documented
* [ ] Design patterns documented
* [ ] Agent rules documented
* [ ] Recommendations separated from facts

## Output format

Return:

1. Files created
2. Important findings
3. Missing or weak areas
4. Recommended next fixes

Use this format:

```md
# Project Context Generation Result

## Files created

- AGENTS.md
- PROJECT_CONTEXT.md
- DESIGN_SYSTEM.md
- API_CONTRACTS.md
- DATABASE_NOTES.md

## Important findings

- ...

## Missing or weak areas

- ...

## Recommended next fixes

1. ...
2. ...
3. ...
```

## Common mistakes to prevent

* Agent starts coding without project context
* Agent changes wrong folders
* Agent invents API behavior
* Agent ignores database rules
* Agent duplicates existing logic
* Agent breaks design consistency
* Agent exposes environment secrets
* Agent misunderstands app purpose
* Agent mixes old and new architecture
* Agent creates files that conflict with current code

## Quality bar

The generated documents must be good enough that:

* A new developer understands the project quickly
* An AI coding agent can work safely
* API behavior is clear
* Database structure is clear
* UI rules are clear
* Current limitations are visible
* Future changes are less risky

Bad output:

* Generic documentation
* Marketing-style writing
* Invented features
* Missing API details
* Missing database notes
* No warnings
* No project-specific facts

Good output:

* Based on actual code
* Short and clear
* Easy to scan
* Useful for coding agents
* Honest about unknowns
* Prevents wrong implementation
