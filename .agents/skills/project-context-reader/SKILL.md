---
name: project-context-reader
description: Read AGENTS.md, PROJECT_CONTEXT.md, DESIGN_SYSTEM.md, API_CONTRACTS.md, DATABASE_NOTES.md before any task.
---

# Project Context Reader

## Purpose
Read and comprehend core project documentation (AGENTS.md, PROJECT_CONTEXT.md, DESIGN_SYSTEM.md, API_CONTRACTS.md, DATABASE_NOTES.md) before starting any task to ensure alignment with the existing project state.

## When to Use
- At the beginning of any new task or session.
- Before proposing any architectural or structural changes.
- Before adding new features, APIs, or UI components.
- When unsure about the current project conventions or rules.

## Required Files to Read
Check for the existence and read the following files if present:
- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- `DESIGN_SYSTEM.md`
- `API_CONTRACTS.md`
- `DATABASE_NOTES.md`

## Step-by-Step Process
1. **Locate Files:** Check if the required context files exist in the project root or docs directory.
2. **Read Content:** Read the contents of the existing context files carefully.
3. **Synthesize Context:** Identify the tech stack, rules, constraints, and patterns applicable to the current task.
4. **Cross-Check Request:** Evaluate the user's request against the documented project rules.
5. **Identify Conflicts:** If the request conflicts with the context (e.g., uses a different library, breaks a pattern), note it immediately.

## Strict Rules
- Never assume this is a fresh project.
- Never rewrite full project unless asked.
- Always inspect current files first.
- Always preserve existing behavior.
- Always follow existing style.
- Do not add libraries without approval.
- Do not change schema without approval.
- Do not redesign unrelated UI.
- Do not delete working code silently.
- Return risks clearly.

## Checklist
- [ ] Checked for all 5 context files.
- [ ] Read the content of all found context files.
- [ ] Identified project-specific rules and patterns.
- [ ] Verified the current task does not violate existing context.
- [ ] Highlighted any risks or conflicts to the user before coding.

## Output Format
Provide a short summary to the user indicating you have read the context:
```markdown
### Context Read
- **Found:** [List of files found and read]
- **Key Takeaways:** [Brief bullet points of relevant constraints]
- **Risks/Conflicts:** [Any mismatch between the task and the context]
```

## Common Mistakes to Prevent
- **Skipping the step:** Jumping straight into coding without reading the context.
- **Assuming defaults:** Using standard framework defaults instead of project-specific rules defined in the context.
- **Ignoring conflicts:** Failing to warn the user if their request breaks a rule in `DESIGN_SYSTEM.md` or `API_CONTRACTS.md`.

## Quality Bar
- The agent must demonstrate knowledge of the project's specific constraints in subsequent actions.
- No code should be written that violates the explicitly stated rules in the context files.
