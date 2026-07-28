---
name: git-commit-helper
description: Suggests a Git branch name and a Conventional Commits-style commit message based on the user's current code changes. Use this whenever the user asks "what should I name this branch", "write a commit message", "suggest a branch name", "help me commit this", or similar — even if they don't mention Git by name but are clearly asking about naming their changes before committing/pushing. Trigger this any time the user has uncommitted changes and wants naming/commit help, not just when they explicitly say "git".
---

# Git Commit Helper

Suggests a **branch name** and a **commit message** by looking at the user's actual code changes — not by guessing from a vague description.

## Conventions used (fixed, do not deviate)

- **Commit message format**: Conventional Commits — `type(scope): short summary`
  - Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `build`, `ci`
  - Scope is optional — include it only if one clear area of the code changed (e.g. `auth`, `api`, `ui`)
  - Summary: lowercase, imperative mood ("add" not "added"), no period at the end, under 72 characters
  - If the change is big or touches multiple things, add a short body below the summary as bullet points

- **Branch name format**: `type/short-description`
  - Same `type` values as above
  - Description: lowercase, words separated by hyphens, 2-5 words, no ticket numbers unless the user gives one
  - Example: `feature/login-rate-limit`, `fix/null-pointer-checkout`, `chore/update-deps`

  Note: use `feature/` (not `feat/`) as the branch prefix for new features — this is the one place branch and commit prefixes differ, matching common convention.

## Steps

1. **Find the actual changes.** Don't ask the user to describe their changes if you can check yourself:
   - Run `git status` to see which files changed
   - Run `git diff` (unstaged) and `git diff --staged` (staged) to see the actual content
   - If nothing is staged and nothing is unstaged, say so and ask what changed

2. **Classify the change.** Based on the diff, decide the single best-fit type:
   - New functionality → `feat`
   - Bug fix → `fix`
   - Dependency bumps, config, tooling, no behavior change → `chore`
   - Code restructuring with no behavior change → `refactor`
   - Docs/comments only → `docs`
   - Tests only → `test`
   - Formatting/whitespace only, no logic change → `style`
   - Build scripts, CI config → `build` or `ci`
   - If the diff mixes multiple unrelated things (e.g. a feature + an unrelated dependency bump), say so explicitly and recommend splitting into separate commits — don't just pick one type and hide the mix.

3. **Write the output** in this exact structure:

   ```
   Branch: type/short-description

   Commit message:
   type(scope): short summary

   - bullet point if needed
   - another bullet point if needed
   ```

4. **If the diff is empty, unclear, or spans unrelated changes**, don't force a single suggestion — tell the user directly what the problem is (e.g. "this diff mixes a bug fix and a refactor, I'd split it into two commits") rather than picking something plausible-sounding and moving on.

5. Give **one suggestion**, not three alternatives — this is meant to save a decision, not create one. If genuinely ambiguous (e.g. could be `fix` or `refactor`), pick the more likely one and note the other in one line.

## What not to do

- Don't invent a scope if the change touches many unrelated files
- Don't write vague summaries like "update code" or "fix bug" — name the actual thing that changed
- Don't skip reading the diff and guess from the user's description alone if the repo is accessible
- Don't pad the commit body with bullet points restating the summary — only add a body if there's real extra detail
