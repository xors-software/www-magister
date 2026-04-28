# Scenario 2: Code Generation with Claude Code

## The Scenario

You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution.

**Primary domains:** Claude Code Configuration & Workflows (D3), Context Management & Reliability (D5).

---

## What's actually being tested

This scenario tests your ability to design and maintain a scalable, team-based Claude Code workflow. The exam will ask you to diagnose configuration errors, choose the right tool for the job, understand the hierarchy of CLAUDE.md organization, and make tactical decisions about when to explore vs. plan vs. code.

### Domain 3: Claude Code Configuration & Workflows

**Task 3.1 - CLAUDE.md hierarchy and modular organization**
- Diagnose why a new teammate is missing a rule (it lives at user level, not project level).
- Choose between @import, `.claude/rules/` glob patterns, and subdirectory CLAUDE.md.
- Use `/memory` to verify which instructions are loaded.

**Task 3.2 - Custom slash commands and skills**
- Distinguish project-scoped commands (`.claude/commands/`, versioned) from personal commands (`~/.claude/commands/`, local).
- Understand skill frontmatter: `context: fork`, `allowed-tools`, `argument-hint`.
- Recognize when a skill is on-demand vs. when CLAUDE.md is needed (always-loaded standards).

**Task 3.3 - Path-specific rules**
- Use `.claude/rules/` with YAML frontmatter `paths` glob patterns for conditional rules.
- Choose glob rules over subdirectory CLAUDE.md when conventions span multiple directories.

**Task 3.4 - Plan mode vs direct execution**
- Plan mode for large-scale, multi-file, architectural decisions with multiple valid approaches.
- Direct execution for clear-scope, single-file, or well-understood changes.
- Explore subagent isolates verbose discovery, returns summaries.

**Task 3.5 - Iterative refinement**
- Concrete input/output examples beat prose when interpretation varies.
- Test-driven iteration: share test failures to refine behavior.
- Interview pattern: have Claude ask clarifying questions before implementing.
- Single message for interacting problems; sequential for independent ones.

**Task 3.6 - Claude Code in CI/CD**
- `-p` / `--print` flag for non-interactive mode (prevents hangs).
- Self-review limitation: same session that generated code is less effective.

### Domain 5: Context Management & Reliability

**Task 5.1 - Long-conversation context preservation**
- Extract facts into persistent case blocks to survive summarization.
- Trim verbose tool outputs before they accumulate.

**Task 5.4 - Large-codebase exploration context**
- Spawn subagents for specific verbose tasks.
- Scratchpad files persist findings across context boundaries.
- `/compact` reduces context during extended sessions.
- Summarize phase findings; inject into next phase initial context.

---

## Reference architecture: how to set up Claude Code for a team

### The CLAUDE.md hierarchy

Claude Code loads instructions from three levels, with more-specific scopes layering on top of broader ones (directory rules apply within their directory, project rules apply across the repo, user rules apply across all projects):

1. **User-level** (`~/.claude/CLAUDE.md`): Personal preferences, apply to all projects, never shared via VCS.
2. **Project-level** (`.claude/CLAUDE.md` or `CLAUDE.md` in repo root): Team standards, checked into VCS, shared with all developers.
3. **Directory-level** (subdirectory `CLAUDE.md`): Scope rules to a specific folder, loaded when editing files in that directory.

**Key principle:** User-level instructions are NOT version-controlled. If your team relies on a rule that lives only in `~/.claude/CLAUDE.md`, new teammates will not get it. Store all team standards in `.claude/CLAUDE.md` or project root `CLAUDE.md`.

### @import for modular CLAUDE.md

Instead of writing a monolithic CLAUDE.md, use `@import` to reference external files:

```markdown
# Project

This is a Node.js monorepo with TypeScript.

# Code Conventions

@import ./conventions/typescript.md
@import ./conventions/testing.md
@import ./conventions/api.md

# Commands

- Dev: `npm run dev`
- Test: `npm run test`
```

Store imported files in `.claude/conventions/` or similar. This keeps CLAUDE.md readable and makes updates atomic to specific domains.

### .claude/rules/ with YAML frontmatter

For path-conditional rules, use `.claude/rules/` with YAML frontmatter instead of subdirectory CLAUDE.md. This approach is superior when conventions apply to files scattered across the codebase.

**Example: `.claude/rules/testing.md`**

```yaml
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/__tests__/**"
---

# Testing Conventions

- Use Vitest for unit tests
- Prefer `describe` blocks for grouping
- Mock external APIs with MSW
```

The `paths` glob patterns determine when this rule loads. Unlike subdirectory CLAUDE.md (which requires matching directory structure), glob rules work anywhere in the codebase. This is critical for test files that exist in `src/__tests__/`, `tests/unit/`, `tests/integration/`, etc.

**When to use glob rules instead of subdirectory CLAUDE.md:**
- Conventions apply across multiple unrelated directories (tests, config files, API routes).
- Subdirectories already serve a functional purpose and shouldn't be polluted with CLAUDE.md files.

### .claude/commands/ for project slash commands

Custom slash commands in `.claude/commands/` are shared with the team via VCS.

**File structure:**

```
.claude/
  commands/
    review.md
    scaffold.md
    deploy.md
```

**Example: `.claude/commands/review.md`**

```markdown
# Review all changes in this session

Review the files I've modified. Look for:
- Logic errors
- Edge case handling
- Performance issues
- Adherence to our code style

For each finding, explain the issue and suggest a fix.
```

Running `/review` in Claude Code will execute this command. The filename becomes the command name.

### Personal slash commands

For personal workflows (unique to one developer), use `~/.claude/commands/`. These are not shared.

```
~/.claude/
  commands/
    quick-test.md
    my-debug-pattern.md
```

### .claude/skills/ with SKILL.md frontmatter

Skills are on-demand reusable workflows. Store them in `.claude/skills/`. Each skill is a directory with a `SKILL.md` file.

**Example: `.claude/skills/refactor-tests/SKILL.md`**

```yaml
---
name: "Refactor Tests to Vitest"
description: "Convert Jest test files to Vitest with modern syntax"
context: fork
allowed-tools:
  - "Read"
  - "Edit"
  - "Grep"
---

You are a testing refactoring specialist. Convert the test file to Vitest syntax:
- Replace `jest.mock()` with `vi.mock()`
- Replace `jest.spyOn()` with `vi.spyOn()`
- Verify assertions still work

Preserve test logic and coverage.
```

**Frontmatter fields:**
- `name`: Display name in skill selection UI.
- `description`: How Claude determines when to invoke the skill.
- `context: fork`: Skill runs in an isolated sub-agent context. Output doesn't pollute main session context. Use for verbose discovery tasks or brainstorming alternatives.
- `allowed-tools`: List tools the skill can use. Restricts access (e.g., read-only for a reviewer skill).
- `argument-hint`: Suggests parameters (e.g., "file path or directory").

**Key distinction: Skills vs CLAUDE.md**
- **CLAUDE.md:** Always-loaded project standards. Use for coding conventions, project architecture, command references, testing frameworks, code style.
- **Skills:** On-demand task-specific expertise. Use for workflows that trigger less frequently or where `context: fork` is valuable (don't pollute main context).

Example: Store "always use 2-space indentation" in CLAUDE.md. Store "refactor from Jest to Vitest" as a skill.

### Plan mode vs direct execution

**Plan mode** is Claude Code's "Explore then Plan" phase. Claude enters a special mode where it can read files but not edit them. It gathers information, asks clarifying questions, and proposes a plan. You review and approve before code execution.

**Use plan mode when:**
- Task involves multiple files (refactor across 45+ files, monolith to microservices).
- Multiple valid architectural approaches exist; you want to compare trade-offs.
- Scope is unclear; you need Claude to propose structure before committing changes.
- Breaking changes that could cascade (database schema migration, API contract changes).

**Use direct execution when:**
- Single file, clear-scope change (add validation to one function).
- Problem is well-defined with clear stack trace (fix a specific bug).
- Quick iteration cycles (small fixes, copy-paste examples).

**Workflow:**
1. Enter plan mode in Claude Code.
2. Submit prompt: "Figure out how to add OAuth. Where are auth handlers? What changes are needed?"
3. Claude reads files, explores the codebase, returns a plan.
4. Review the plan, ask for revisions if needed.
5. Approve. Claude executes the plan with code execution enabled.

### Explore subagent for verbose discovery

When you need codebase discovery but don't want the exploration work cluttering your main session context, spawn a subagent.

**Benefit:** The subagent's tool calls, file reads, and reasoning stay in its isolated context. Only the summary returns to you.

**Example:**
- Main prompt: "How do we handle user authentication?"
- Delegation: Spawn subagent to: map all auth-related files, understand the current flow, identify gaps.
- Result: 2-3 paragraph summary in your main context, not 200KB of exploration logs.

To delegate discovery work, spawn a subagent with restricted permissions:
- `description`: "Discover architecture and patterns without editing files."
- `allowed-tools`: Read, Grep, Glob (no file writes).

### Iterative refinement: common patterns

#### 1. Concrete input/output examples (for transformation tasks)

When prose instructions are ambiguous, provide 2-3 concrete examples:

```markdown
Transform API responses. Example:

Input: { "user_id": 123, "name": "Alice", "created": "2025-01-15T10:30:00Z" }
Output: { "id": 123, "fullName": "Alice", "joinDate": "Jan 15, 2025" }

Input: { "user_id": 456, "name": "Bob Jones", "created": "2024-12-20T14:45:00Z" }
Output: { "id": 456, "fullName": "Bob Jones", "joinDate": "Dec 20, 2024" }
```

Much more effective than "Reformat user objects with better field names and dates."

#### 2. Test-driven iteration

Write tests first, then iterate on implementation based on test failures:

```markdown
Here are the tests:
[paste test file with assertions]

Implement the function to pass all tests. If you get stuck,
ask me for hints on specific test cases.
```

Share test output showing which assertions fail. Claude uses that feedback to refine the implementation.

#### 3. Interview pattern

Have Claude ask clarifying questions before implementing:

```markdown
Before you refactor the authentication flow, ask me:
1. Do we need to support multiple concurrent login sessions?
2. What's our timeout window for re-authentication?
3. Should the system auto-refresh tokens or prompt the user?
4. Any constraints on password reset flow?
```

Claude asks, you answer, then it implements with full context.

#### 4. Single message for interacting problems; sequential for independent

**Interacting:** "Fix the caching bug AND the race condition in the worker queue" → One message, both fixed together with awareness of interactions.

**Independent:** "Add logging to module A" then "Refactor module B" → Sequential messages; each stands alone.

---

## The exam-relevant patterns (must internalize)

### 1. Hierarchy diagnostics (Task 3.1)

**Principle:** New teammate joins, runs `/init`, but doesn't see your team's testing conventions.

**Right way:** Test conventions in `.claude/CLAUDE.md` (project-level, VCS-checked).

```markdown
# .claude/CLAUDE.md (project root)

# Testing Standards
- Use Vitest
- Place tests in __tests__/
- Mock with MSW
```

**Wrong way:** Store conventions in `~/.claude/CLAUDE.md` (user-level, not shared).

New teammate has a blank `~/.claude/CLAUDE.md`; they never see your standards.

### 2. @import for modularity (Task 3.1)

**Principle:** Monolithic CLAUDE.md is hard to maintain. Use @import for topic files.

**Right way:**
```markdown
# .claude/CLAUDE.md (main)
@import ./rules/typescript.md
@import ./rules/testing.md
```

**Wrong way:**
```markdown
# .claude/CLAUDE.md (all 300 lines)
[entire project architecture, all code style, all testing rules, all deployment info]
```

The monolithic version is hard to review, merge, and understand at a glance.

### 3. .claude/rules/ glob patterns vs subdirectory CLAUDE.md (Task 3.3)

**Principle:** Glob-based path rules work across the entire codebase, regardless of structure.

**Right way:** Tests exist in multiple places (`src/__tests__/`, `tests/unit/`, `app/api/__tests__/`).
```yaml
# .claude/rules/testing.md
---
paths:
  - "**/*.test.ts"
  - "**/__tests__/**"
---
# Use Vitest, not Jest
```

**Wrong way:** Create `tests/CLAUDE.md` and `src/__tests__/CLAUDE.md` separately.
```markdown
# tests/CLAUDE.md
Use Vitest...

# src/__tests__/CLAUDE.md
Use Vitest...
```

The glob approach is DRY and deterministic. Subdirectory CLAUDE.md files require mirroring the directory structure.

### 4. Project commands (.claude/commands/) vs personal commands (~/.claude/commands/) (Task 3.2)

**Principle:** Team workflows are shared; personal workflows are private.

**Right way:** `/review` command in `.claude/commands/review.md` (checked in).
```markdown
# .claude/commands/review.md
Review the changes in this session...
```

Team runs `/review` and gets consistent behavior.

**Wrong way:** Put the review command in `~/.claude/commands/my-review.md` and expect teammates to use it.

They won't have it. Only you do.

### 5. Skills (on-demand) vs CLAUDE.md (always-loaded) (Task 3.2)

**Principle:** Load everything universal into CLAUDE.md. Put on-demand tasks in skills.

**Right way:**
- CLAUDE.md: "Use 2-space indentation, TypeScript strict mode, prefer named exports"
- Skill: "Migrate from CommonJS to ESM (with context: fork)"

Every session loads the universal standards. The migration skill runs only when you ask for it.

**Wrong way:**
- Skill: "Use 2-space indentation" (wastes skill discovery, should always apply)
- CLAUDE.md: "Migrate from CommonJS to ESM" (clutters every session, rarely used)

### 6. context: fork isolates verbose output (Task 3.2)

**Principle:** Some tasks (codebase mapping, exploratory analysis) generate lots of tool calls and intermediate reasoning. Fork them to avoid polluting main context.

**Right way:** Exploration skill with `context: fork`
```yaml
---
name: "Map Architecture"
description: "Discover all service boundaries and communication patterns"
context: fork
---
Explore the codebase...
```

When you run this skill, its exploration stays in a sub-agent. Main context gets only the summary.

**Wrong way:** All skills in main context.

One 50-step exploration skill bloats your main session context for the rest of the feature work.

### 7. Plan mode for architectural decisions (Task 3.4)

**Principle:** Before making large changes, have Claude understand the landscape.

**Right way:** Library upgrade spanning 30 files and API changes.
```
[In plan mode]
"We're upgrading from React 18 to 19. How many components use the old hooks API?
What breaking changes do we need to handle? Design a migration plan."

Claude reads files, reports findings, proposes approach.
Review plan, approve or iterate.
Execute.
```

**Wrong way:** Direct execution on 30-file migration.

Claude might miss cascading changes, refactor part of the codebase, hit conflicts, require multiple rounds of fixes.

### 8. Direct execution for clear-scope changes (Task 3.4)

**Principle:** When scope is defined, stack trace is clear, fix is straightforward, go direct.

**Right way:** "The pagination validator is rejecting valid page numbers. Here's the error: [stack trace]. Fix it."

Claude reads the file, makes the fix, you test. Done in one round.

**Wrong way:** Plan mode for a one-line fix.

Adds unnecessary delay.

### 9. Concrete I/O examples for format transformation (Task 3.5)

**Principle:** When transformation rules are ambiguous, show examples, not prose.

**Right way:**
```
Transform the user object. Examples:
Input: { "user_id": 123, "name": "Alice", "verified": true }
Output: { "id": 123, "name": "Alice", "status": "verified" }

Input: { "user_id": 456, "name": "Bob", "verified": false }
Output: { "id": 456, "name": "Bob", "status": "unverified" }
```

**Wrong way:**
```
Change field names and use a status field instead of a boolean.
```

Claude might map `verified: true` to status `"active"` instead of `"verified"`. Examples force alignment.

### 10. Test-driven iteration for behavior refinement (Task 3.5)

**Principle:** When behavior is unclear, write tests first, iterate on failures.

**Right way:**
```
Here's the test suite:
[test file]

Implement the function. If any test fails, I'll help refine it.
```

Claude implements. Tests fail on edge case (null input). Claude asks. You clarify ("treat null as empty array"). Claude refines.

**Wrong way:** Describe behavior in prose, iterate via feedback.

"The function should handle edge cases..." Claude guesses. You correct. Repeat 5 times.

### 11. Interview pattern for complex workflows (Task 3.5)

**Principle:** Before refactoring a complex system, have Claude ask clarifying questions.

**Right way:**
```
Before refactoring the session management:
1. Do we need multi-device sessions or single per user?
2. What's the token expiry policy?
3. Should logout be immediate or gradual?
4. Do we track logout reason (user vs timeout)?
```

Claude asks. You answer. It refactors with full context.

**Wrong way:** Describe requirements, Claude guesses implementation.

Produces a session manager that doesn't match your needs.

### 12. Single message for interacting problems (Task 3.5)

**Principle:** When two issues interact (e.g., race condition in cache invalidation), handle in one turn.

**Right way:** "Fix both the caching bug (item stays stale after update) and the race condition (concurrent updates conflict). They're related - cache invalidation must be atomic with the update."

Claude understands the interaction, fixes both atomically.

**Wrong way:** Two separate messages. "Fix the cache bug." Then "Fix the race condition."

Second fix might re-introduce the first problem because it doesn't see the interaction.

### 13. /compact for context bloat during exploration (Task 5.4)

**Principle:** Extended codebase exploration generates tool results. Use `/compact` to summarize and free context.

**Right way:**
```
[Explore files, run Grep, read 20 files]
/compact
[summarize findings, continue with next phase]
```

Freed context for the actual implementation phase.

**Wrong way:** 100 tool results accumulate; context fills up; Claude becomes inconsistent.

### 14. Scratchpad files for cross-boundary persistence (Task 5.4)

**Principle:** When context resets (session end, `--resume`, crash recovery), findings persist in scratchpad files.

**Right way:**
```
[During exploration]
Create: scratch/auth-findings.md
- AuthController at /src/controllers/auth.ts
- Uses JWT tokens, 1-hour expiry
- Session store is Redis-backed
- Missing: password reset flow

[Resume next session]
Read scratch/auth-findings.md
[continue implementation with findings]
```

**Wrong way:** Rely on prior session context only.

Context resets or you lose findings. You re-explore.

### 15. Summarize phase findings before next phase (Task 5.4)

**Principle:** Between phases (exploration → design → implementation), inject a summary into the next phase initial context.

**Right way:**
```
[End exploration phase]
Summary: Found 12 API endpoints, 3 middleware, JWT auth, no tests.
High-impact areas: auth, error handling.

[Start implementation phase]
Initial prompt: "Here's what I discovered: [summary]. Now implement fixes..."
```

**Wrong way:** Rely on prior messages in conversation history.

Lost-in-the-middle: Claude recalls beginning of exploration, forgets middle, misses details.

### 16. --resume for stateful sessions vs new + summary for fresh context (Task 1.7, Task 5.4)

**Principle:** Resume when prior context is still valid. Start fresh with summary when tool results are stale.

**Right way:** Resume after lunch.
```
claude --resume my-feature-session
```
Prior findings still valid, tool results still fresh.

**Right way:** Files changed since last session.
```
[New session]
Initial prompt: "Files changed. Here's the prior context: [structured summary].
Re-examine X and Y, report changes."
```

Previous tool results are stale. Fresh tools + summary is safer.

**Wrong way:** Resume with 50 stale tool results after significant codebase changes.

Prior findings are outdated. Claude doesn't notice discrepancies.

### 17. Self-review limitation (Task 3.6, Task 4.6)

**Principle:** Same session that generated code is less effective at reviewing it (model retains generation reasoning, less likely to question).

**Right way:** Before pushing, spawn a subagent code reviewer.
```
/subagent code-review
[separate context, fresh eyes, catches more issues]
```

**Wrong way:** "Review the code you just wrote."

Claude retains "I wrote this correctly" reasoning. Misses bugs.

---

## Gotchas and anti-patterns

### 1. Putting team-wide command in ~/.claude/commands/

A team standard slash command (e.g., `/review`) in your personal `~/.claude/commands/` directory. Teammates don't have it.

**Fix:** Place it in `.claude/commands/review.md` (project-level, version-controlled).

### 2. Monolithic CLAUDE.md instead of @import

All project standards crammed into one 300-line CLAUDE.md. Hard to review, merge, maintain.

**Fix:** Use `@import` to reference `.claude/rules/` or `.claude/conventions/` files.

### 3. Subdirectory CLAUDE.md for conventions that span multiple directories

Test files exist in `tests/`, `src/__tests__/`, and `app/api/__tests__/`. You create three separate CLAUDE.md files repeating the same testing rules.

**Fix:** Use `.claude/rules/testing.md` with glob patterns `**/*.test.ts`, `**/__tests__/**`.

### 4. Skills treated as universal standards

"Use 2-space indentation" as a skill. Every session requires you to invoke it.

**Fix:** Put universal standards in CLAUDE.md, always loaded.

### 5. Direct execution on multi-file architectural changes

Refactor a library used in 50 files. Jump straight to code without exploring dependencies.

**Result:** Missed cascade refactors, partial migrations, unresolved imports.

**Fix:** Use plan mode to explore, design, review approach before executing.

### 6. Skipping plan mode, hitting rework late

"This should be simple." Start coding. Discover mid-way that you need to refactor 3 other modules. Rework.

**Fix:** Spend 5 minutes in plan mode for any change spanning 3+ files or with architectural implications.

### 7. Confidence-based filtering instead of explicit criteria

"Skip low-confidence findings" without defining what "low confidence" means or what findings to report.

**Result:** Inconsistent output, missed issues.

**Fix:** Explicit criteria. "Report only when: code contradicts comment AND the discrepancy affects behavior."

### 8. Self-review in the same session that generated code

"Now review the code you just wrote."

**Result:** Misses issues because the model retains generation context.

**Fix:** Use `/subagent code-review` for independent review with fresh context.

### 9. Resuming with stale tool results after files changed

Changed authentication logic since last session. Resume, ask for refactoring. Claude relies on old tool results (the prior auth flow).

**Result:** Recommendations based on outdated code.

**Fix:** New session + structured summary. Instruct Claude to re-examine specific files.

### 10. Monolithic skills without context: fork

A 200-line codebase discovery skill runs in main context. 50 tool calls clutter your main session.

**Fix:** Set `context: fork` so exploration stays isolated.

### 11. Iterating via text feedback instead of concrete examples

"The output doesn't look right." Claude guesses what's wrong. Wrong again. Repeat.

**Fix:** Show 2-3 concrete input/output examples showing what "right" looks like.

### 12. Describing behavior instead of showing tests

"Implement a function that handles user input validation." Claude guesses. Edge cases fail.

**Fix:** Provide test cases. Claude implements to pass tests.

### 13. Not using glob paths in .claude/rules/

Lint conventions apply to all `.ts` files but you create a `src/CLAUDE.md` with the rules.

**Result:** Files in `tests/`, `scripts/` don't follow rules.

**Fix:** Use `.claude/rules/linting.md` with `paths: ["**/*.ts"]`.

### 14. Allowing all tools in a reviewer skill

A code-review skill with full tool access (Read, Write, Edit, Bash). Reviewer makes unauthorized changes.

**Fix:** Restrict to read-only: `allowed-tools: ["Read", "Grep", "Glob"]`.

---

## What a good answer accounts for

### Decision framework for question patterns

#### Where does this config go?

- **Scope = team-wide, must be shared** → `.claude/CLAUDE.md` or `.claude/commands/` or `.claude/rules/`
- **Scope = personal only** → `~/.claude/CLAUDE.md` or `~/.claude/commands/`

#### What kind of rule/instruction is it?

- **Universal, always-on** → CLAUDE.md (main instructions)
- **Path-conditional** → `.claude/rules/` with glob patterns
- **On-demand workflow** → Skill
- **Re-runnable command** → Slash command in `.claude/commands/`

#### Plan vs direct execution?

- **Large-scale changes, multiple files (3+), unknown approach, architectural** → Plan mode
- **Single file, clear stack trace, scoped well** → Direct execution
- **Need to map and understand first** → Plan mode (Explore subagent optional)

#### Iterative refinement approach?

- **Transformation with ambiguous rules** → Concrete I/O examples
- **Behavior correctness unclear** → Test-driven (write tests, iterate on failures)
- **Complex workflow, many unknowns** → Interview pattern (Claude asks questions)
- **Issues interact** → Single message for both
- **Issues independent** → Sequential messages

#### Context bloat?

- **Verbose tool output accumulating** → `/compact` or trim tool results before they accumulate
- **Exploration work cluttering main session** → Explore subagent with `context: fork`
- **Prior tool results stale** → New session + structured summary (don't resume)

---

## Practice questions

### Q1: Hierarchy diagnostic

**Stem:** Your team just onboarded Alice. You ask Claude to generate a new component, and it doesn't follow your team's API conventions (use server actions, not API routes). Alice ran `/init`, CLAUDE.md was created, but it's missing this rule. Where should you check first?

A) Alice's `~/.claude/CLAUDE.md` - her personal overrides might be interfering.
B) The project `.claude/CLAUDE.md` - team-wide standards should be here.
C) `.claude/rules/api-conventions.md` - path-specific rules for all files.
D) Create a new skill to teach the convention on-demand.

**Correct:** B

**Why:** Team standards must live in the project-level `.claude/CLAUDE.md` (or referenced files). The user-level `~/.claude/CLAUDE.md` is personal and not shared. The rule is missing because it was never added to the project CLAUDE.md. Alice will see it once it's checked in.

**Why others wrong:**
- A: User-level CLAUDE.md is for personal preferences, not team standards. Alice's would be empty.
- C: Path-specific rules work, but aren't the right place for universal API conventions that apply everywhere. Rules in `.claude/rules/` have glob patterns for conditional application. API conventions should be always-on in CLAUDE.md.
- D: Skills are for on-demand tasks, not universal always-on standards.

---

### Q2: Where to put a slash command

**Stem:** Your team has a `/pre-commit` command that runs linting, type-checking, and formatting before you commit. You want all teammates to use it. Where should you create it?

A) `.claude/commands/pre-commit.md` in the project repository.
B) `~/.claude/commands/pre-commit.md` in your home directory.
C) In the project CLAUDE.md under a "Commands" section.
D) As a skill in `.claude/skills/pre-commit/SKILL.md`.

**Correct:** A

**Why:** Slash commands that the team shares go in `.claude/commands/` inside the project (version-controlled). The filename becomes the command name. All teammates cloning the repo get it automatically.

**Why others wrong:**
- B: Personal commands go in `~/.claude/commands/`. Only you have it; teammates won't.
- C: CLAUDE.md is for instructions and context, not executable command definitions. Commands are defined as separate markdown files in `.claude/commands/`.
- D: Skills are for on-demand task expertise (with optional `context: fork` for isolation), not team-wide command-line shortcuts.

---

### Q3: .claude/rules/ glob patterns vs subdirectory CLAUDE.md

**Stem:** Your codebase has test files in five different locations: `tests/`, `src/__tests__/`, `app/__tests__/`, `packages/utils/__tests__/`, and `e2e/`. You need to enforce consistent test conventions (use Vitest, structure with describe blocks, mock with MSW). Which approach is best?

A) Create `.claude/rules/testing.md` with glob patterns `["**/__tests__/**", "**/*.test.ts"]`.
B) Create five separate CLAUDE.md files in each directory (tests/CLAUDE.md, src/__tests__/CLAUDE.md, etc.).
C) Add all testing rules to the main project CLAUDE.md.
D) Create a skill `.claude/skills/test-conventions/SKILL.md` that developers invoke when writing tests.

**Correct:** A

**Why:** Glob-based path rules in `.claude/rules/` work across the entire codebase without requiring directory structure alignment. The patterns load rules only when editing matching test files. This is DRY, maintainable, and deterministic.

**Why others wrong:**
- B: Subdirectory CLAUDE.md files require mirroring the directory structure. You'd have to maintain 5 separate files repeating the same rules. Not DRY.
- C: Pollutes the main CLAUDE.md with conventions that don't apply everywhere. Tests have special rules; other code doesn't need them loaded.
- D: Skills are on-demand, not deterministic. Developers might forget to invoke the skill. Testing conventions should always apply, loaded automatically based on file path.

---

### Q4: Skills with context: fork

**Stem:** You have a large monorepo. You want to create a skill that maps the entire codebase architecture (list all packages, services, dependencies, entry points). This exploration requires 50+ file reads and grep calls. Should the skill use `context: fork`?

A) Yes. The exploration work stays in a sub-agent, only the summary returns to main context.
B) No. The skill should run in the main context so you can see all its reasoning.
C) Only if you plan to use the skill more than twice.
D) Only if the skill takes longer than 5 minutes to run.

**Correct:** A

**Why:** Verbose exploratory work clutters the main context. `context: fork` isolates tool calls and reasoning in a sub-agent, returning only a summary. This preserves main context for feature work. You only need the answer (the architecture map), not the journey.

**Why others wrong:**
- B: Seeing all the reasoning is not important; you need the summary. Seeing 50 tool results and intermediate thoughts wastes context.
- C/D: Frequency and duration don't determine context: fork. The benefit is based on context pollution, not usage frequency or duration.

---

### Q5: Plan mode vs direct execution

**Stem:** You need to refactor a legacy monolithic API into a microservices architecture. This affects 45 files, introduces 3 new services, changes database layer, and API contracts. Multiple valid architectural approaches exist. Should you use plan mode?

A) Yes. Plan mode lets Claude explore, understand dependencies, design an approach, and get your approval before executing.
B) No. Direct execution is faster; start coding and iterate.
C) Use plan mode only if the codebase is larger than 50 files.
D) Use direct execution; plan mode is overkill for refactoring.

**Correct:** A

**Why:** Plan mode is designed for multi-file architectural decisions with multiple valid approaches. Claude explores dependencies, proposes a design, and you review before code execution. This prevents rework. Direct execution risks discovering mid-way that the approach is wrong, requiring major rework.

**Why others wrong:**
- B: Direct execution on large architectural changes is risky. You'll iterate multiple times.
- C: File count is not the criterion. The decision factor is scope (multi-file), architectural nature, and approach ambiguity.
- D: Plan mode is exactly for large refactorings. It's not overkill.

---

### Q6: Iterative refinement - concrete examples vs prose

**Stem:** You're asking Claude to implement a data transformation: convert a legacy user object format to a new schema. You explain the requirements in prose: "Map the old fields to new names, consolidate addresses into a single object, format dates as YYYY-MM-DD." Claude's output doesn't match your expectations on edge cases. What's the fastest fix?

A) Describe the edge cases in more prose: "Handle null addresses, treat empty strings as missing data..."
B) Provide 3-4 concrete input/output examples showing exactly how edge cases should be handled.
C) Ask Claude to review its own output for correctness.
D) Provide a test suite with failing tests for edge cases.

**Correct:** B

**Why:** Concrete examples eliminate ambiguity much faster than prose. Claude will align behavior to match all your examples. Prose leaves room for misinterpretation.

**Why others wrong:**
- A: More prose doesn't fix the ambiguity problem. Leads to more iterations.
- C: Self-review is ineffective (model retains generation reasoning). An independent reviewer or examples are better.
- D: Tests + iteration is valid (test-driven), but examples are faster for transformation rules. Tests are better for behavior correctness with multiple valid approaches.

---

### Q7: Interacting vs independent problems

**Stem:** You have two bugs: (1) the cache isn't being invalidated after updates, causing stale reads, and (2) concurrent updates are stepping on each other (race condition). What's the best approach?

A) One message: "Fix both bugs. They interact - cache invalidation must be atomic with the update to prevent races."
B) Two sequential messages: First, fix the cache bug. Then, fix the race condition.
C) Three messages: First understand the race condition, then understand the cache, then fix both.
D) Use plan mode to design both fixes simultaneously.

**Correct:** A

**Why:** The bugs interact. The race condition affects how cache invalidation must work. Fixing them in one message ensures Claude understands the interaction and fixes both atomically. Two sequential messages risk one fix re-introducing the other.

**Why others wrong:**
- B: Sequential approach ignores the interaction. Second fix might break the first.
- C: Over-complicated. No need to understand separately; fix together once.
- D: Plan mode for individual bugs isn't necessary. Single message is sufficient when the interaction is explained.

---

### Q8: Test-driven iteration

**Stem:** You want Claude to implement a state machine for order processing (draft → confirmed → shipped → delivered, with rollback from confirmed). You're not sure Claude will handle state transitions correctly. Best approach?

A) Describe the state machine in prose and iterate on Claude's output.
B) Provide a test suite with test cases for valid transitions, invalid transitions, and rollbacks. Have Claude implement to pass tests.
C) Ask Claude to design the state machine first, then implement it.
D) Use a skill to define state machine conventions and invoke it.

**Correct:** B

**Why:** Test-driven iteration is most effective for behavior correctness. Tests define the ground truth. Claude implements to pass all tests. Failures are concrete; fixes are targeted. Much faster than prose iteration.

**Why others wrong:**
- A: Prose iteration on behavior is slow and error-prone (multiple rounds of feedback).
- C: Design first, then implement is waterfall. Test-driven tightens the loop.
- D: A skill teaches conventions, not state machine logic. Tests are the right tool.

---

### Q9: Subagent review vs self-review

**Stem:** You've just finished implementing an authentication module. Before you commit, you ask Claude, "Review the code I just wrote for security issues, edge cases, and correctness." Claude reviews and approves. Is this effective?

A) Yes. Claude just wrote the code, so it understands the intent and context.
B) No. The same session that generated the code is less effective at reviewing it. Use a subagent reviewer for independent eyes.
C) Neutral. It depends on the complexity of the code.
D) Yes, if you prepend the review request with "Pretend you didn't write this code."

**Correct:** B

**Why:** Same-session self-review is unreliable. The model retains generation reasoning ("I implemented this correctly") and is less likely to question it. An independent subagent has fresh context and catches more issues. This is a documented pattern in the exam guide.

**Why others wrong:**
- A: Understanding intent is a disadvantage here. Bias toward generated code leads to missed bugs.
- C: Not neutral. Independent review is consistently better. This is exam-testable.
- D: Prepending a statement doesn't override model behavior. Independent context is required.

---

### Q10: Context bloat during exploration

**Stem:** You're exploring a large monorepo to understand authentication flow. You run Grep to find all auth handlers (50 matches), Read 20 key files, run 15 more queries. Your context is now 60% full, and you haven't started implementation. Best next step?

A) Continue exploring; you'll need this context for implementation.
B) Run `/compact` to summarize exploration findings and free context.
C) Run `/clear` to start fresh and avoid confusion.
D) Spawn a subagent to continue exploration in isolated context.

**Correct:** B

**Why:** `/compact` summarizes exploration, keeps key findings, frees context for implementation. This preserves your discoveries while freeing space for the implementation phase.

**Why others wrong:**
- A: Continuing with 60% full context risks inconsistency and lost-in-the-middle effects.
- C: `/clear` discards all findings. You'd re-explore. Wrong.
- D: While subagents can handle exploration, the direct answer for immediate context relief is `/compact`. Subagents are better for delegating future work, not for recovering from current bloat.

---

### Q11: @import for modularity

**Stem:** Your project CLAUDE.md has grown to 250 lines covering API conventions, database rules, testing standards, deployment procedures, and code style. It's hard to maintain and review. Best refactor?

A) Split into separate files in `.claude/rules/` with glob patterns and use `@import` in the main CLAUDE.md.
B) Create separate CLAUDE.md files in each subdirectory.
C) Create skills for each topic.
D) Leave it as is; 250 lines is manageable.

**Correct:** A

**Why:** `@import` allows you to modularize CLAUDE.md while keeping it version-controlled. Create `.claude/rules/api.md`, `.claude/rules/testing.md`, etc., then reference them with `@import ./rules/api.md`. Easier to review, merge, and maintain.

**Why others wrong:**
- B: Subdirectory CLAUDE.md files require directory structure alignment. Not ideal for scattered conventions.
- C: Skills are for on-demand tasks, not universal standards.
- D: 250 lines is already hard to review and maintain.

---

### Q12: Resume vs new session with summary

**Stem:** You spent a session exploring a codebase and identified 12 API endpoints, 3 middleware, current auth flow, and missing tests. You ended the session. Next day, you need to implement a new authentication feature. Should you use `claude --resume` or start a new session?

A) Use `--resume`. Your prior exploration is still relevant.
B) Start a new session. Files may have changed; include a structured summary of your prior findings.
C) Use `--resume` but ask Claude to re-verify the exploration findings.
D) Start fresh with no context; re-explore to be safe.

**Correct:** B (or A + verification if time permits)

**Why:** Files might have changed overnight. Your prior tool results (file reads) could be stale. A new session with a structured summary of key findings is safer. If you resume, you risk relying on stale information.

**Why others wrong:**
- A: Without verification, stale findings could mislead implementation.
- C: If you resume + verify, that's extra work. New + summary is cleaner.
- D: Re-exploring wastes time when you have documented findings.

**Note:** Q12 is intentionally close between B and A to test understanding of context freshness.

---

### Q13: Allowed-tools in a reviewer skill

**Stem:** You create a code-review subagent skill with the description "Review all changes for bugs, style violations, and performance issues." What should `allowed-tools` be?

A) All tools: Read, Write, Edit, Grep, Glob, Bash.
B) Read, Grep, Glob (read-only).
C) Only Read.
D) No restriction; let the agent choose.

**Correct:** B

**Why:** A reviewer should not edit files. Restrict to read-only tools. Grep and Glob are needed to explore the code and understand context.

**Why others wrong:**
- A: Granting write access to a reviewer creates risk. It should flag issues, not fix them.
- C: Too restrictive. Grep and Glob are needed to find related code patterns.
- D: Unrestricted access is a security risk.

---

### Q14: Slash command in CI/CD

**Stem:** Your CI/CD pipeline uses Claude Code to auto-generate PR descriptions. You're running it with the `claude` command non-interactively. It hangs. Why, and what's the fix?

A) Use `-p` / `--print` flag for non-interactive mode, preventing prompts and hangs.
B) Set the `CLAUDE_CI_MODE=true` environment variable.
C) Redirect stdin to `/dev/null`.
D) Use the `-y` flag to auto-approve all prompts.

**Correct:** A

**Why:** The `-p` (print) flag tells Claude Code to run non-interactively without prompts, preventing hangs in CI/CD.

**Why others wrong:**
- B: No such environment variable.
- C: Redirecting stdin doesn't prevent interactive prompts.
- D: No `-y` flag exists. `-p` is the right answer.

---

### Q15: Path-scoped rules with glob patterns

**Stem:** Your codebase has deployment scripts in `scripts/deploy/`, `ci/deploy/`, and `helm/`. They use different languages (bash, Python, YAML) but all follow a "always log the deployment step" convention. Where should you put this rule?

A) In three separate `deploy/CLAUDE.md` files (one in each directory).
B) In `.claude/rules/deployment.md` with `paths: ["scripts/deploy/**", "ci/deploy/**", "helm/**"]`.
C) In the main project CLAUDE.md.
D) As a skill that developers invoke before editing deployment scripts.

**Correct:** B

**Why:** Glob paths in `.claude/rules/` efficiently target scattered files without creating redundant CLAUDE.md files. This rule is path-scoped but not directory-scoped.

**Why others wrong:**
- A: Creates three duplicate files. Not DRY.
- C: Pollutes main CLAUDE.md with rules that only apply to deployment files.
- D: Skills are on-demand. This should always apply when editing deployment scripts.

---

### Q16: Long-conversation context preservation (D5.1)

**Stem:** You've spent 200 messages refactoring authentication across 15 files. You're now on a related feature and need Claude to understand the refactoring decisions you made (JWT token structure, session timeout values, password reset constraints). Your context is 80% full. How do you preserve these critical facts for the next phase?

A) Rely on earlier messages in conversation history; Claude will recall the facts when needed.
B) Extract transaction facts (token expiry: 1 hour, session timeout: 30 min, reset window: 24 hours) into a persistent case facts block in your next prompt, outside summarized history.
C) Use `/compact` to preserve the exact details from prior messages.
D) Start a new session with `--resume` to maintain full conversation history.

**Correct:** B

**Why:** Progressive summarization loses specific numbers and dates. A persistent "case facts block" with key transaction data (amounts, timeouts, windows, constraints) survives context boundaries and is reliably recalled. This is D5.1 best practice: extract facts into persistent blocks included in each prompt.

**Why others wrong:**
- A: "Lost in the middle" effect means Claude reliably processes only conversation beginnings/ends. Critical facts buried in history get lost or misremembered.
- C: `/compact` summarizes but doesn't solve the fundamental problem of numeric facts getting vaguely paraphrased (e.g., "around one hour" vs "exactly 3600 seconds").
- D: Resuming preserves history but doesn't address the problem that critical facts need extraction into a dedicated persistent block for reliability.

---

## Quick-reference cheat sheet

1. **Hierarchy:** User (`~/.claude/CLAUDE.md`) < Project (`.claude/CLAUDE.md`) < Directory. New teammates don't see user-level rules.

2. **@import:** Use `@import ./rules/topic.md` for modularity. Keeps CLAUDE.md readable.

3. **.claude/rules/ with glob:** `paths: ["**/*.test.ts"]` beats subdirectory CLAUDE.md for scattered conventions.

4. **.claude/commands/:** Project-scoped slash commands, version-controlled.

5. **~/.claude/commands/:** Personal commands, not shared.

6. **CLAUDE.md:** Always-loaded universal standards (code style, architecture, conventions).

7. **Skills:** On-demand task-specific workflows. Frontmatter: `name`, `description`, `context: fork`, `allowed-tools`, `argument-hint`.

8. **context: fork:** Isolates skill execution context. Output doesn't pollute main session.

9. **allowed-tools:** Restrict tool access in skills. E.g., read-only for reviewers.

10. **Plan mode:** Explore → Plan → Code → Commit. Use for multi-file architectural decisions.

11. **Direct execution:** Single file, clear scope, known approach.

12. **Subagent for discovery:** Isolates verbose exploration in isolated context, returns summary to main session. Preserves main context for implementation.

13. **Concrete I/O examples:** Most effective for transformation tasks. 2-3 examples beat prose.

14. **Test-driven iteration:** Write tests first, iterate on failures. Best for behavior correctness.

15. **Interview pattern:** Have Claude ask clarifying questions before implementing. Best for complex workflows.

16. **Single message for interacting problems.** Sequential for independent.

17. **/compact:** Summarize long exploration sessions, free context for implementation.

18. **Scratchpad files:** Persist findings across context boundaries (`.claude/scratch/findings.md`).

19. **Summarize phases:** Between exploration and implementation, inject phase summary into next phase initial context.

20. **--resume:** Use when prior context still valid. Risky if files changed.

21. **New + summary:** Safer when tool results might be stale.

22. **Self-review limitation:** Same session that generated code is less effective. Use subagent for independent review.

23. **-p flag:** Non-interactive mode for CI/CD (prevents hangs).

24. **/memory:** Check which CLAUDE.md files are loaded.

25. **Scoped tools in subagents:** Restrict tool access for safety and focus.
