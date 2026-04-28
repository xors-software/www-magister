# Scenario 4: Developer Productivity with Claude

## The Scenario

You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate code, and automate repetitive tasks. It uses the built-in tools (Read, Write, Edit, Bash, Grep, Glob) and integrates with Model Context Protocol (MCP) servers.

**Primary domains:**
- Domain 2: Tool Design & MCP Integration
- Domain 3: Claude Code Configuration & Workflows
- Domain 1: Agentic Architecture & Orchestration

---

## What's Actually Being Tested

This scenario tests your ability to architect an agentic system for codebase exploration and automated development tasks. The exam focuses on:

### Tool Selection and Built-In Tool Mastery (Task 2.5)
- **Grep** searches for content (function names, error messages, imports, patterns).
- **Glob** finds files by path patterns (e.g., `**/*.test.tsx`, `src/**/types.ts`).
- **Read/Write** handle full-file operations; **Edit** targets specific changes via unique text anchoring.
- When Edit anchor text isn't unique across the file, fall back to Read + Write.
- Building understanding incrementally (Grep entry point → Read imports) rather than upfront bulk reads.

### MCP Server Integration (Task 2.4)
- **Project-level** (`.mcp.json`) for shared team tooling, committed to VCS.
- **User-level** (`~/.claude.json`) for personal or experimental servers.
- Environment variable expansion (`${GITHUB_TOKEN}`, `${JIRA_API_KEY}`) keeps secrets out of VCS.
- All configured MCP servers' tools are simultaneously available.
- **MCP resources** expose catalogs (issue lists, doc hierarchies, schema summaries) to reduce exploratory tool calls.
- **Community MCP servers** (Jira, GitHub) preferable to custom for standard integrations.
- **Custom MCP servers** only for genuinely team-specific workflows.

### Tool Description Quality (Task 2.1)
- Tool descriptions are the primary signal LLMs use for tool selection.
- Weak descriptions cause misrouting (e.g., agent picks Grep over a richer MCP tool).
- High-quality descriptions differentiate: input formats, when-to-use, boundaries, alternatives.

### Task Decomposition and Session Management (Tasks 1.6, 1.7)
- **Adaptive decomposition** based on intermediate findings (vs fixed pipelines).
- **Explore subagent** for verbose discovery; main agent stays high-level.
- **Scratchpad files** persist findings across context boundaries.
- **`/compact`** reduces context bloat during long exploration.
- **Named sessions** (`--resume <name>`) for cross-day continuity.
- **`fork_session`** for divergent approach exploration from a shared baseline.
- When files change, inform resumed agent; don't force full re-exploration.

### Context Degradation Prevention (Task 5.4)
- Extended sessions degrade: references become vague ("typical patterns" instead of specific classes).
- Mitigation: subagent delegation, scratchpad files, `/compact`, structured state exports.
- Summarize phase findings and inject into next phase.

---

## Reference Architecture: How to Build This

### 1. Built-In Tools: When to Use Which

#### Grep for Content Search
**Use Grep when:** searching for code patterns across the codebase (function names, imports, error handlers, constants).

**Example:** Find all callers of a function `validateUser`:
```
grep -r "validateUser" --include="*.ts" --include="*.tsx"
```

**Why:** Grep is content-agnostic, blazingly fast over large codebases, returns context lines.

#### Glob for Path Patterns
**Use Glob when:** discovering files by naming convention or directory structure.

**Example:** Find all test files:
```
**/*.test.{ts,tsx,js}
```

**Example:** Find all migration files:
```
migrations/**/*.{js,ts}
```

**Why:** Glob is pattern-based; Grep on file paths is indirect and slow.

#### Read for Full-File Understanding
**Use Read when:** you need the complete file to understand context (imports, type defs, overall structure).

**Anti-pattern:** Read all files upfront. Instead, Grep for entry points, then Read strategically.

#### Edit for Targeted Modifications
**Use Edit when:** you have unique anchor text that appears exactly once in the file.

**Example:** Unique anchor:
```
// Feature flag for beta UI
const ENABLE_BETA_UI = false;
```

Change it:
```
old_string: "const ENABLE_BETA_UI = false;"
new_string: "const ENABLE_BETA_UI = true;"
```

**Fallback to Read + Write when:** the anchor text is not unique (e.g., multiple `const X = false;` lines in the file).

**Why Read + Write is safer:** Edit silently applies to the wrong location if anchor isn't unique. Read + Write forces you to handle ambiguity.

#### Write for New Files
**Use Write when:** creating new files from scratch.

#### Bash for Commands
**Use Bash when:** running build tools, package managers, linters, or exploring codebase structure (e.g., `find`, `ls`, `git log`).

### 2. Codebase Exploration Strategy

#### Incremental Discovery (Preferred)
1. **Entry point identification:** Grep for known symbols (main function, exports, imports of key modules).
2. **Read the entry point:** Understand the structure and identify import chains.
3. **Follow imports:** Grep for usages of functions/classes discovered in step 2.
4. **Read targeted files:** Only Read files essential to understanding the data flow.

**Example workflow:**
- Q: "Where is the authentication logic?"
- Grep: `grep -r "authenticate\|login\|auth" --include="*.ts" src/`
- Read: `src/auth/index.ts`
- Identify exported functions and types
- Grep each exported function to find usage sites
- Read only the files calling those functions

#### Bulk Read (Avoid)
Reading all files upfront before understanding architecture wastes context and time.

### 3. MCP Server Scoping

#### Project-Level Configuration (.mcp.json)
**Place:** Repository root, committed to VCS.

**When:** All team members need the same servers (Jira, GitHub, internal tools).

**Example `.mcp.json`:**
```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["jira-mcp"],
      "env": {
        "JIRA_INSTANCE": "company.atlassian.net",
        "JIRA_API_TOKEN": "${JIRA_API_KEY}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["github-mcp"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Key pattern:** Use `${ENV_VAR}` for secrets. Developers set `export JIRA_API_KEY=...` in their shell; the config expands it at runtime.

#### User-Level Configuration (~/.claude.json)
**Place:** User's home directory (`~/.claude.json` or via Claude Code settings).

**When:** Personal/experimental servers, private integrations, local dev tools.

**Example:** A developer experimenting with a custom internal search server before team adoption.

### 4. MCP Resources vs MCP Tools

#### MCP Resources (Read-Only Data Catalogs)
**Purpose:** Expose catalogs so the agent doesn't need exploratory tool calls.

**Example:** Jira MCP resource `list_issues`:
```
Endpoint: /jira/issues?project=DEV&status=OPEN
Returns: [{ id: "DEV-123", title: "..." }, ...]
```

Instead of the agent calling `search_issues` (a tool), it reads the resource upfront, saving a tool call.

**When to use resources:**
- Static or semi-static catalogs (list of documents, schemas, environments).
- Information the agent needs visibility of without taking action.

#### MCP Tools (Action-Oriented)
**Purpose:** Perform actions or fetch dynamic data.

**Example:** `create_jira_issue`, `update_github_pr`, `fetch_latest_data`.

**When to use tools:**
- Operations with side effects (create, update, delete).
- Queries dependent on prior results (search with filters).

### 5. Tool Description Quality for Correct Routing

#### Problem: Weak Tool Description
Weak MCP tool description:
```
Name: search_issues
Description: "Search for issues"
```

Result: Agent picks Grep to search code instead, missing richer Jira semantics.

#### Solution: Rich, Differentiated Description
```
Name: search_jira_issues
Description: "Search Jira issues by project, assignee, status, or label. Returns issue metadata
(ID, summary, priority, status, assignee, created date). Use this when you need Jira-specific
context (priority, workflow status, links to other issues). Do NOT use Grep for issue lookups
 - Grep only finds source code mentions."
```

#### Pattern for Tool Descriptions
Include:
- **What it does:** precise, functional description.
- **Input formats:** accepted parameters, required vs optional, enums.
- **Output format:** what data is returned, structure.
- **When to use vs alternatives:** explicitly contrast with Grep, Read, other tools.
- **Example query:** "Search issues assigned to me in the INFRA project with status=IN_PROGRESS."

### 6. Session Management for Long Exploration

#### Scratchpad Files
During exploration, save findings to a file (e.g., `exploration_notes.md`):
```markdown
## Phase 1: Authentication Flow
- Entry: src/auth/index.ts exports `authenticate(credentials)`
- Key functions:
  - validateCredentials: validates format
  - hashPassword: bcrypt wrapper
  - generateJWT: creates tokens
- Called by: src/api/login.ts, src/middleware/auth.ts
```

**Why:** Scratchpad survives `/compact` and preserves findings across context resets.

#### /compact for Long Sessions
After each major discovery phase, run `/compact` to summarize and free context space.

**Before compact:**
- Full tool call history, verbose Grep results, all Read outputs.

**After compact:**
- Summary of findings, key file paths, architecture diagram.

#### Named Sessions for Cross-Day Work
```bash
claude --resume migration-analysis
```

**Use when:** analyzing a multi-day migration, refactoring, or codebase audit.

**Avoid when:** stale tool results (file contents changed) - start fresh with a summary instead.

#### fork_session for Divergent Approaches
```
fork_session: "refactoring-comparison"
```

**Use when:** testing two testing strategies, two refactoring approaches, two architectural designs.

**Pattern:**
1. Main agent analyzes codebase, builds shared understanding.
2. Main agent spawns two subagents (or two fork sessions) with: "Strategy A: ..., Strategy B: ..."
3. Each fork implements and tests its strategy independently.
4. Main agent compares results, picks the winner.

### 7. Plan Mode vs Direct Execution

#### Plan Mode (For Codebase Exploration and Complex Changes)
**Use when:**
- Large-scale changes (10+ files).
- Unknown architecture (must explore before deciding approach).
- Multiple valid approaches exist; need a decision point.
- Multi-phase tasks (understand → design → implement → test).

**Example:** "Add comprehensive tests to this legacy codebase."
1. **Mapping phase:** Glob for test files, Grep for test patterns, identify entry points, understand file structure and dependencies. Build a mental map of what's already tested vs what's untested.
2. **Prioritization phase:** Identify high-impact areas (frequently-called functions, error handlers, validation logic). Prioritize tests by impact and complexity.
3. **Approval point:** Review the map and strategy, adjust scope based on findings.
4. **Implementation phase:** Implement per-file test additions, adapting as dependencies emerge. Test high-impact areas first.
5. **Validation phase:** Run the test suite, ensure comprehensive coverage.

#### Direct Execution (For Well-Scoped Changes)
**Use when:**
- Single-file bug fix with clear stack trace.
- Simple, unambiguous change (e.g., "update environment variable name").
- Change is straightforward, low risk.

**Example:** "Fix the off-by-one error in the pagination logic (line 42 of index.ts)."

### 8. Subagents for Isolated Discovery

#### Explore Subagent
**Purpose:** Verbose codebase exploration without cluttering main agent context.

**Pattern:**
```
Main agent (high-level task):
  -> Spawns "Explore" subagent: "Find all test utilities in this codebase.
     List files, exported names, and patterns."
  <- Subagent returns: Summary of test utilities (files, names, patterns)
Main agent continues with clean context.
```

**Benefits:**
- Main agent context stays focused on the current work.
- Exploration verbosity (Grep results, file reads) doesn't accumulate.
- Subagent can use `/compact` without affecting main session.

#### Coordinator + Specialized Subagents
**Pattern for multi-phase work:**
```
Coordinator (main agent):
  1. Spawns "Analyzer" subagent: "Analyze the codebase structure"
  2. Spawns "Finder" subagent: "Find all instances of deprecated API calls"
  3. Spawns "Planner" subagent: "Design a migration strategy"
  3. Synthesizes results into a unified plan
```

**Key rule:** Subagents have isolated context. Pass all needed context explicitly in the prompt.

---

## The Exam-Relevant Patterns (Must Internalize)

1. **Grep vs Glob distinction:** Grep searches file contents; Glob searches file paths by pattern. Never conflate.

2. **Edit anchor uniqueness:** Edit silently edits wrong location if anchor text isn't unique. Always Read the file first to verify uniqueness, or fall back to Read + Write.

3. **Incremental discovery:** Grep entry point → Read imports → Grep each exported name → Read only necessary files. Do NOT upfront bulk-read.

4. **Project vs user MCP config:** `.mcp.json` (VCS-committed) for shared team servers; `~/.claude.json` (personal) for experimental or personal servers.

5. **Env var expansion in .mcp.json:** Use `${TOKEN_NAME}`, not hardcoded secrets. Developers set `export TOKEN_NAME=...` in shell.

6. **All MCP servers simultaneous:** Once configured, all tools from all servers are available at once. No explicit "activation" needed.

7. **MCP resources expose catalogs:** Resources pre-load data (issue list, schema summary) so the agent doesn't need exploratory tool calls.

8. **Tool descriptions are the primary lever:** Weak descriptions cause misrouting to Grep/Read. Rich descriptions (with "when-to-use") guide correct tool selection.

9. **Community MCP servers preferred:** Use GitHub, Jira, etc. official/community servers. Reserve custom MCP for genuinely team-specific workflows.

10. **Long codebase exploration context degradation:** Extended sessions lose specificity. Mitigation: subagents for discovery (separate context), scratchpad files (persist findings), `/compact` (summarize), new session with summary (vs stale resume).

11. **Plan mode for architectural; direct for clear-scope:** Plan mode enables exploration + approval before code. Direct execution for straightforward, low-risk changes.

12. **Subagent context is isolated:** Subagents do not inherit main agent history. Pass findings, context, instructions explicitly in the prompt.

13. **Named sessions for continuity:** Use `--resume <name>` for cross-day work. But if files changed, inform the resumed agent so it re-analyzes; starting fresh with a summary is more reliable.

14. **fork_session for divergent approach exploration:** Compare two strategies from a shared codebase analysis baseline.

15. **Scratchpad files survive context resets:** Persist key findings to a file during long exploration; /compact and /clear don't erase files.

16. **Explicit tool selection over vague instructions:** "Grep for login-related functions" is better than "find where logins happen" (which might cause unnecessary Reads).

---

## Gotchas and Anti-Patterns

### Anti-Pattern 1: Bulk File Reading
**Mistake:** Starting exploration by reading `/src` directory's top-level files, then reading all subdirectories.

**Why it fails:** Context explosion, slow, misses actual codebase structure.

**Fix:** Grep for entry points (exports, main function) → Read one entry point file → Grep for usages → Read only necessary files.

### Anti-Pattern 2: Edit with Non-Unique Anchor
**Mistake:** Using `"const X = false;"` as anchor in a file with 5 occurrences of that pattern.

**Why it fails:** Edit silently applies to first match (or first non-match), causing wrong file state.

**Fix:** Always Read the file first to verify anchor uniqueness. Fallback: Read + Write.

### Anti-Pattern 3: Putting Experimental MCP in Project Config
**Mistake:** Committing a custom MCP server to `.mcp.json` before it's team-ready.

**Why it fails:** All teammates are forced to use it; breaks their setups if server is unstable.

**Fix:** Use `~/.claude.json` for experimental servers. Move to `.mcp.json` only after team validation.

### Anti-Pattern 4: Hardcoding Secrets in .mcp.json
**Mistake:** `"JIRA_TOKEN": "jira_token_abc123..."` in `.mcp.json`.

**Why it fails:** Tokens committed to VCS; every clone/branch has exposed secrets.

**Fix:** Use `${ENV_VAR}` expansion. Developers set `export JIRA_TOKEN=...` in shell.

### Anti-Pattern 5: Building Custom MCP for Standard Integration
**Mistake:** Writing a custom MCP server for Jira instead of using the official/community one.

**Why it fails:** Maintenance burden, reinventing; community server already handles 95% of use cases.

**Fix:** Use community MCP (e.g., `jira-mcp` on npm). Customize tool descriptions if routing is off.

### Anti-Pattern 6: Weak Tool Descriptions Causing Misrouting
**Mistake:** MCP tool with description "Search for issues" but agent always picks Grep instead.

**Why it fails:** LLM can't distinguish when to use MCP tool vs Grep; defaults to simpler Grep.

**Fix:** Expand description: include input format, output structure, explicit "Use this, not Grep, because..."

### Anti-Pattern 7: Resuming with Stale Tool Results
**Mistake:** Using `--resume migration-analysis` after files were heavily modified.

**Why it fails:** Agent's prior analysis (e.g., "this function is called 3 times") is now wrong.

**Fix:** Either start fresh with a summary of prior analysis, or inform the resumed agent: "Files changed since last session; re-analyze [files]."

### Anti-Pattern 8: Bulk Re-Exploration When Targeted Re-Analysis Suffices
**Mistake:** Re-running the full codebase exploration subagent after a small change.

**Why it fails:** Wastes time and context.

**Fix:** Target the subagent: "Re-analyze how the authentication flow integrates with [changed file]."

### Anti-Pattern 9: Putting Path-Scoped Rules as Directory CLAUDE.md
**Mistake:** Creating `src/middleware/CLAUDE.md` for middleware-specific conventions when they span many directories.

**Why it fails:** Developers in other packages miss the rules; not hierarchical.

**Fix:** Use `.claude/rules/middleware.md` with YAML frontmatter glob pattern: `paths: ["**/middleware/**/*"]`.

### Anti-Pattern 10: No /compact in Long Exploration
**Mistake:** Exploring a large codebase over 100+ messages without /compact.

**Why it fails:** Context becomes inconsistent (references "typical patterns" instead of specifics); model answers contradictorily.

**Fix:** After major discovery phases, run `/compact` to summarize findings and free context.

### Anti-Pattern 11: Self-Review in Same Session
**Mistake:** Agent generates code, then reviews it in the same session.

**Why it fails:** Agent retains generation reasoning; less likely to question itself.

**Fix:** Spawn a separate subagent for review (fresh context, independent eyes).

### Anti-Pattern 12: Skipping Plan Mode for Known-Architectural Tasks
**Mistake:** Asking Claude to refactor a monolith to microservices without plan mode.

**Why it fails:** Agent might commit to a wrong architecture before understanding dependencies.

**Fix:** Use plan mode for architectural / multi-file decisions. Review the plan before code phase.

---

## What a Good Answer Accounts For

### Decision Framework for Exam Questions

#### 1. Tool Selection
**Question pattern:** "Agent is doing X inefficiently. How to fix?"

**Thinking:**
- Is this a content search (Grep), file path search (Glob), full-file read (Read), or targeted edit (Edit)?
- If Edit, is the anchor text unique? If not, fall back to Read + Write.
- Is there an MCP tool that's richer than a built-in tool? If so, improve the MCP tool's description.

#### 2. MCP Scope Decision
**Question pattern:** "Where to configure [tool]?"

**Thinking:**
- Shared by team (in VCS) → `.mcp.json`
- Personal or experimental → `~/.claude.json`
- Secrets → use `${ENV_VAR}`, not hardcoded.
- Community server available? → prefer it over custom.

#### 3. Long-Session Context Management
**Question pattern:** "Agent's answers became vague after 50 messages. Why?"

**Thinking:**
- Context degradation from verbose tool results, repeated Reads.
- Mitigation: subagent for discovery (separate context), scratchpad (persist findings), `/compact` (summarize).
- Or: new session with structured summary of prior findings.

#### 4. Subagent Isolation
**Question pattern:** "Subagent returns empty result. Why?"

**Thinking:**
- Subagent context is isolated. It doesn't inherit coordinator history.
- Solution: pass required context, findings, instructions explicitly in the prompt.

#### 5. Session Resumption
**Question pattern:** "Use `--resume` or start fresh?"

**Thinking:**
- Resume: prior findings still valid (no file changes).
- Fresh + summary: safer if files changed, prior tool results stale, or need a clean slate.

#### 6. Plan vs Direct Execution
**Question pattern:** "Which mode for this task?"

**Thinking:**
- Plan: large-scale changes, unknown architecture, multiple approaches, multi-phase.
- Direct: single-file bug fix, clear stack trace, low-risk, straightforward.

---

## Practice Questions

### Q1: Built-In Tool Selection - Grep vs Glob
**Scenario:** You need to find all test files in a large React codebase that follow the naming pattern `*.test.tsx` or `*.test.ts`. The codebase has 500+ files across 30+ directories.

**Question:** What tool should the agent use?

A. Grep with pattern `--include="*.test.*"`
B. Glob with pattern `**/*.test.{ts,tsx}`
C. Read all files in src/ to identify test files
D. Bash command `find . -name "*.test.*"`

**Correct Answer:** B

**Reasoning:** Glob is designed for file path pattern matching. `**/*.test.{ts,tsx}` directly matches the naming convention. Grep is slower (searches file contents), Read is overkill, Bash find is functional but less integrated into Claude Code's tool ecosystem. (Task 2.5)

**Why others wrong:**
- A: Grep is for content search, not file path patterns.
- C: Read all files is inefficient.
- D: Bash find works but isn't the primary tool for this task in Claude Code.

---

### Q2: Edit Anchor Uniqueness - Fallback to Read + Write
**Scenario:** A file contains 12 lines with `const X = null;` and the agent needs to change only one specific line (e.g., line 42) to `const X = undefined;`. The anchor text "const X = null;" is not unique.

**Question:** What should the agent do?

A. Use Edit with anchor "const X = null;" and hope it matches the right line
B. Use Read, identify the specific line number, use Edit with more unique surrounding text
C. Use Bash sed to replace line 42
D. Use Read to get the file, find the exact location, use Write to overwrite the entire file

**Correct Answer:** B

**Reasoning:** Per Task 2.5, when Edit's anchor text is not unique, the canonical approach is Read first to find a unique multi-line anchor (e.g., lines 40-44 of context around the target), then Edit with that uniquely-anchored text. This is more surgical than overwriting the whole file.

**Why others wrong:**
- A: Edit with a non-unique anchor will fail or edit the wrong line. The exam guide explicitly warns against this in Task 2.5.
- C: Bash `sed` is possible but isn't the canonical Claude Code mechanism; the exam tests built-in tool selection.
- D: Read + Write is the documented fallback only when no unique anchor can be found in context. With 12 occurrences, surrounding lines almost always provide unique context, making B more efficient.

---

### Q3: MCP Server Scoping - Project vs User
**Scenario:** A team uses Jira for issue tracking and GitHub for repos. The team wants Claude Code to access Jira issues and GitHub PRs. The Jira server is not yet officially supported; the team is evaluating a beta MCP implementation.

**Question:** Where should the Jira MCP be configured?

A. `.mcp.json` in the project root
B. `~/.claude.json` in the user's home directory
C. A shared `CLAUDE.md` file with MCP setup instructions
D. A Git submodule with the MCP server code

**Correct Answer:** B

**Reasoning:** The Jira server is experimental (beta). User-level config (`~/.claude.json`) is for personal/experimental servers. Once the team validates and adopts it, move to `.mcp.json` for team-wide use. GitHub's server, if stable, should already be in `.mcp.json`. (Task 2.4)

**Why others wrong:**
- A: Project config is for stable, team-adopted servers.
- C: CLAUDE.md is for code conventions, not MCP setup.
- D: Git submodule doesn't directly configure MCP; would still need `.mcp.json` or shell scripts.

---

### Q4: Environment Variable Expansion - Securing Secrets
**Scenario:** A `.mcp.json` file needs to include a Jira API token. The team wants to ensure tokens are not stored in version control.

**Question:** Which is the correct pattern?

A. `"JIRA_TOKEN": "jira_token_abc123..."`
B. `"JIRA_TOKEN": "${JIRA_TOKEN}"`
C. `"JIRA_TOKEN": "process.env.JIRA_TOKEN"`
D. `"JIRA_TOKEN": "@env:JIRA_TOKEN"`

**Correct Answer:** B

**Reasoning:** `.mcp.json` supports `${ENV_VAR}` expansion. Developers set `export JIRA_TOKEN=...` in their shell. The config expands it at runtime. (Task 2.4)

**Why others wrong:**
- A: Hardcoded token, exposed in VCS.
- C: Not a valid `.mcp.json` pattern (JavaScript syntax, not JSON).
- D: Not the correct syntax (would be `${JIRA_TOKEN}`).

---

### Q5: MCP Resources vs Tools - Catalog Exposure
**Scenario:** A development team wants Claude Code to be aware of all available Jira projects (INFRA, FRONTEND, BACKEND, OPS) without making a tool call every time it needs the list.

**Question:** What should the MCP server expose?

A. A tool `list_projects` that returns the list
B. A resource `jira://projects` that returns `["INFRA", "FRONTEND", "BACKEND", "OPS"]`
C. A prompt hint that lists the projects
D. A CLAUDE.md file with the project list

**Correct Answer:** B

**Reasoning:** Resources expose read-only data catalogs. The agent can read the resource upfront (or lazily) without using a tool call each time. Tools are for actions or dynamic queries. (Task 2.4)

**Why others wrong:**
- A: Tool works but wastes a tool call for static data.
- C: Prompts are for system instructions, not data.
- D: CLAUDE.md is for code conventions, not external service data.

---

### Q6: Tool Description Quality - Misrouting Prevention
**Scenario:** A team's MCP server includes a tool `search_github_issues` with the description: "Search for issues."

**Question:** The agent often ignores this tool and uses Grep instead. What's the most effective fix?

A. Disable Grep in the agent's tool list
B. Add few-shot examples showing when to use the tool
C. Expand the tool description to include input formats, output structure, and explicit "Use this, not Grep, because..." guidance
D. Rename the tool to `find_github_issues_by_label`

**Correct Answer:** C

**Reasoning:** Tool descriptions are the primary signal for tool selection. A weak description causes ambiguity; the agent defaults to simpler Grep. Expand the description with context, examples, and explicit differentiation. (Task 2.1)

**Why others wrong:**
- A: Disabling Grep removes a useful tool for code search.
- B: Few-shot helps, but fixing the root cause (description) is more effective.
- D: Renaming alone doesn't clarify the distinction.

---

### Q7: Custom vs Community MCP Servers
**Scenario:** A team uses both Jira and a proprietary issue tracker called "InternalTrak." For Jira, an official MCP server exists. For InternalTrak, no public MCP exists.

**Question:** Which approach minimizes maintenance burden?

A. Build custom MCP servers for both Jira and InternalTrak
B. Use the official Jira MCP server; build a custom MCP for InternalTrak
C. Use Bash scripts for both integrations
D. Disable the issue tracking integration in Claude Code

**Correct Answer:** B

**Reasoning:** Use community/official MCP servers for standard integrations (Jira) to avoid maintenance. Reserve custom MCP only for genuinely team-specific workflows (InternalTrak). (Task 2.4)

**Why others wrong:**
- A: Building custom Jira MCP is unnecessary maintenance.
- C: Bash scripts are less integrated, don't expose tools.
- D: Removes valuable functionality.

---

### Q8: Codebase Exploration Strategy - Incremental vs Bulk
**Scenario:** An engineer asks Claude Code: "I need to understand how user authentication works in this codebase."

**Question:** What's the most efficient exploration strategy?

A. Read all files in `src/auth/` directory, then read all importing files
B. Grep for `authenticate`, `login`, `token` patterns; Read the entry-point file (e.g., `src/auth/index.ts`); identify exported functions; Grep each exported function to find callers; Read only calling files
C. Bash `find src -name "*.ts" -type f | head -20` and read them
D. Spawn a subagent to "understand authentication" and return a summary

**Correct Answer:** B

**Reasoning:** Incremental discovery (Grep → Read → Grep → Read) builds understanding efficiently. Bulk reading (A) wastes context; excessive subagent delegation (D) hides details when the main agent needs them. (Task 2.5, 1.6)

**Why others wrong:**
- A: Bulk reading wastes context.
- C: Random sample misses relevant files.
- D: Subagents are for discovery isolation, not primary investigation when engineer needs detail.

---

### Q9: Session Resumption - Resume vs Fresh + Summary
**Scenario:** An engineer analyzed a codebase for 3 hours yesterday with `claude --resume migration-analysis`. Today, the team merged 15 new commits affecting 8 files the engineer analyzed. The engineer wants to continue the migration analysis.

**Question:** What's the best approach?

A. Use `claude --resume migration-analysis` immediately
B. Start a fresh session; pass a summary of yesterday's findings; inform Claude that specific files changed
C. Use `claude --resume migration-analysis` but run `Grep` on changed files to re-validate prior analysis
D. Fork the prior session: `fork_session migration-analysis-v2`

**Correct Answer:** B

**Reasoning:** Stale tool results (yesterday's understanding of files that changed) are unreliable. Starting fresh with a summary is safer and clearer than resuming with potentially outdated analysis. (Task 1.7)

**Why others wrong:**
- A: Resume includes stale tool results; prior analysis is now incorrect.
- C: Requires manual comparison; error-prone.
- D: Fork is for comparing approaches, not handling changed files.

---

### Q10: Plan Mode vs Direct Execution
**Scenario:** An engineer provides a stack trace: "Error at line 127 in `utils/validate.ts`: `TypeError: expected string, got undefined`." The error is in a single function, and the fix is straightforward (add a null check).

**Question:** Should Claude Code use plan mode or direct execution?

A. Plan mode, to explore the codebase first
B. Direct execution; the scope is clear
C. Plan mode first, then direct execution
D. Use an Explore subagent to determine the best approach

**Correct Answer:** B

**Reasoning:** Direct execution is appropriate for single-file, clear-scope, low-risk fixes. Plan mode adds unnecessary overhead. (Task 3.4)

**Why others wrong:**
- A: Plan mode is overkill for a straightforward one-line fix.
- C: Combines both unnecessarily; direct execution suffices.
- D: Subagent exploration is unnecessary here.

---

### Q11: Edit Anchor Not Unique - Harder Case
**Scenario:** A file `config.ts` has:
```
export const LOG_LEVEL = 'info';
export const LOG_FORMAT = 'info';
export const LOG_HANDLER = 'file';
```

The agent needs to change `LOG_LEVEL` to `'debug'`. The anchor text "= 'info';" appears twice in the file.

**Question:** What's the correct approach?

A. Use Edit with anchor `const LOG_LEVEL = 'info';`
B. Use Edit with anchor `export const LOG_LEVEL = 'info';`
C. Use Read, then Write (overwrite entire file)
D. Use Bash sed to find and replace

**Correct Answer:** A

**Reasoning:** The anchor `const LOG_LEVEL = 'info';` is unique in the file because the variable name disambiguates it from `LOG_FORMAT` and `LOG_HANDLER`. Edit works correctly with this anchor. Per Task 2.5, the right strategy when an initial anchor is non-unique is to extend the anchor with surrounding tokens until it becomes unique.

**Why others wrong:**
- B: Also works because `export const LOG_LEVEL = 'info';` is unique, but it's longer than necessary. A is the minimal sufficient anchor and is the canonical answer when the question asks "the correct approach."
- C: Read + Write is the documented fallback for when no unique anchor can be found. Here a unique anchor exists, so Edit is the right tool.
- D: Bash `sed` is not the canonical Claude Code mechanism for targeted file edits; the exam tests built-in tool selection.

---

### Q12: Subagent Context Isolation - Explicit Context Passing
**Scenario:** A coordinator agent analyzes a codebase and discovers: "Authentication is handled in `src/auth/oauth.ts` and `src/auth/jwt.ts`." The coordinator then spawns a subagent: "Find all places in the codebase that use authentication."

**Question:** If the subagent returns "No authentication usage found", what's the likely cause?

A. The codebase doesn't use authentication
B. The subagent lacks context about the files where authentication is implemented
C. Grep is disabled in the subagent
D. The Explore subagent should have been used instead

**Correct Answer:** B

**Reasoning:** Subagent context is isolated. The subagent doesn't automatically inherit the coordinator's prior analysis. The coordinator must explicitly pass the file locations: "Authentication is in `src/auth/oauth.ts` and `src/auth/jwt.ts`. Find all callers of these files." (Task 1.3)

**Why others wrong:**
- A: Unlikely if the coordinator found it.
- C: Grep isn't typically disabled.
- D: Explore subagent wouldn't help; the issue is missing context.

---

### Q13: /compact in Long Exploration
**Scenario:** After 80 messages, the engineer asks Claude: "Which database adapter is used in the ORM layer?" Claude responds: "Based on the typical patterns, I believe it's likely either PostgreSQL or MySQL."

**Question:** What's the most effective fix?

A. Grep for "postgres" or "mysql" to get the answer
B. Start a new session with a summary of the 80-message exploration
C. Run `/compact` to consolidate findings, then ask the question again
D. Use a subagent to find the database adapter

**Correct Answer:** C

**Reasoning:** The vague phrasing "typical patterns" is the textbook symptom of context degradation in extended sessions described in Task 5.4. The canonical first response is `/compact` to consolidate the accumulated discoveries into a tighter summary, then re-ask the question with refreshed context. The exam guide names `/compact` specifically as the mechanism for this situation.

**Why others wrong:**
- A: Targeted Grep would surface the answer but doesn't address the root cause (context degradation). The agent will continue giving vague answers to subsequent questions until context is reset.
- B: Starting a new session loses everything; `/compact` preserves the structured summary while shedding verbose tool output. Task 5.4 lists `/compact` before "new session + summary" in escalation order.
- D: Spawning a subagent is appropriate for verbose discovery work, not for fixing degradation in the main session's existing context.

---

### Q14: MCP Tool Description Differentiation
**Scenario:** A team has both a `search_codebase` tool (Grep wrapper, 50 files) and a `semantic_search` tool (MCP, using embeddings, searches 500 files with semantic understanding). The agent usually picks `search_codebase` even when semantic search would be more effective.

**Question:** The team wants the agent to use `semantic_search` more often. What's the best first step?

A. Disable `search_codebase`
B. Improve the `semantic_search` tool description to highlight semantic matching, vectorized search, broader scope, and explicit "Use this for intent-based queries" guidance
C. Add few-shot examples of when to use `semantic_search`
D. Rename `search_codebase` to `grep_wrapper`

**Correct Answer:** B

**Reasoning:** Tool descriptions are the primary signal. A weak description causes the agent to pick the simpler tool. Expand the `semantic_search` description to be clear, specific, and differentiate from `search_codebase`. (Task 2.1)

**Why others wrong:**
- A: Disables a useful tool.
- C: Few-shot helps, but fixing descriptions is more foundational.
- D: Renaming alone doesn't clarify purpose.

---

### Q15: CLAUDE.md Hierarchy - Project vs User Config
**Scenario:** A project has instructions for test organization in `.claude/CLAUDE.md` at the project root. A new developer clones the repo and opens it in Claude Code. The developer doesn't see the test organization rules.

**Question:** What's the most likely cause?

A. The developer is using a personal CLAUDE.md that overrides the project-level one.
B. CLAUDE.md is not automatically loaded from project root; it must be explicitly imported.
C. The new developer hasn't set up their shell environment correctly.
D. The CLAUDE.md file is ignored because it's in the `.claude/` directory.

**Correct Answer:** A

**Reasoning:** CLAUDE.md hierarchy: user (`~/.claude/CLAUDE.md`) → project root or `.claude/CLAUDE.md` → directory-level. If the developer has a personal CLAUDE.md, it takes precedence and the project rules are hidden. Instruction: "Diagnose hierarchy issues (new teammate missing instructions because they live at user level)." (Task 3.1)

**Why others wrong:**
- B: `.claude/CLAUDE.md` at project root IS automatically loaded (part of hierarchy).
- C: Shell environment doesn't affect CLAUDE.md loading.
- D: `.claude/` directory is the correct location for project-scoped config.

---

### Q16: fork_session for Divergent Testing Strategies
**Scenario:** An engineer wants to test two approaches to adding authentication: Strategy A (OAuth via external provider) vs Strategy B (custom JWT with internal provider). Both are viable but have trade-offs.

**Question:** What's the best way to compare them?

A. Main agent implements Strategy A, then manually implements Strategy B in a separate session
B. Main agent analyzes the codebase, then spawns two fork sessions (or subagents): one to implement Strategy A, one to implement Strategy B. Compare results.
C. Main agent implements both strategies sequentially in the same session
D. Use plan mode to design both approaches, then manually decide

**Correct Answer:** B

**Reasoning:** `fork_session` allows divergent exploration from a shared codebase baseline. Each fork can independently implement and test its strategy. (Task 1.7)

**Why others wrong:**
- A: Manual comparison is error-prone, context-heavy.
- C: Sequential implementation in one session risks bias from first strategy.
- D: Plan mode is useful for design, but `fork_session` enables parallel implementation comparison.

---

### Q17: Context Degradation After Bulk Reads
**Scenario:** After 60 messages exploring a large codebase with 5+ bulk Read operations (entire `src/` directory contents), Claude responds to "What's the database adapter?" with "I believe it uses one of the common adapters like SQLAlchemy or Prisma, based on typical patterns."

**Question:** What's the root cause and best mitigation?

A. The database adapter name isn't in the codebase; Claude is guessing.
B. Context degradation from verbose Read outputs; specific details are lost. Mitigation: use `/compact` or start fresh with a summary of prior findings.
C. Glob should have been used instead of Read.
D. The codebase uses multiple adapters and Claude is uncertain.

**Correct Answer:** B

**Reasoning:** Extended sessions with verbose tool outputs accumulate context, causing vague references ("typical patterns" instead of specific class names). Mitigation: `/compact` to summarize findings, or start fresh with a structured summary. (Task 5.4)

**Why others wrong:**
- A: Specific details are in the codebase; the issue is context degradation, not missing data.
- C: Glob finds files, but the issue is Read output accumulation, not tool choice.
- D: Multiple adapters might exist, but the symptom (vague language) points to context degradation.

---

## Quick-Reference Cheat Sheet

1. **Grep:** Content search (function names, imports, error messages). Fast, context-agnostic.

2. **Glob:** File path pattern matching (`**/*.test.tsx`, `migrations/**/*.js`). Not for content search.

3. **Read:** Full-file understanding. Use strategically after Grep, not upfront bulk. Bulk reads cause context degradation.

4. **Edit:** Targeted changes via unique anchor text. Verify uniqueness first. Fallback: Read + Write.

5. **Write:** New files from scratch.

6. **Bash:** Build tools, package managers, linters, system commands (`find`, `ls`, `git log`).

7. **Incremental exploration:** Grep entry → Read entry point → Grep exported names → Read callers. Avoid bulk reads.

8. **Edit fallback:** If anchor text is not unique in the file, use Read + Write instead. Edit silently edits wrong location.

9. **CLAUDE.md hierarchy:** User (`~/.claude/CLAUDE.md`) → Project (`.claude/CLAUDE.md` or root) → Directory. User-level overrides project; check hierarchy if rules don't appear.

10. **`.mcp.json`:** Project root, VCS-committed, team-shared servers (Jira, GitHub, internal tools).

11. **`~/.claude.json`:** User home, personal/experimental servers, not shared.

12. **`${ENV_VAR}` expansion:** In `.mcp.json`, use `${GITHUB_TOKEN}`, `${JIRA_API_KEY}`. Developers set `export GITHUB_TOKEN=...` in shell.

13. **All MCP servers simultaneous:** Once configured, all tools available without explicit activation.

14. **MCP resources:** Expose catalogs (issue lists, schemas, doc hierarchies) to reduce tool calls. Resources are read-only.

15. **MCP tools:** Actions (create, update, delete) or dynamic queries. Richer than resources for side-effect operations.

16. **Community MCP servers:** Use official/community MCP (Jira, GitHub) instead of building custom. Custom only for team-specific workflows.

17. **Tool descriptions:** Are the primary lever for tool selection. Weak descriptions cause misrouting. Include input format, output structure, when-to-use, examples, explicit differentiation from alternatives.

18. **Plan mode:** For large-scale changes, unknown architecture, multiple approaches, multi-file modifications. Always map structure first before implementing on legacy codebases.

19. **Direct execution:** For single-file clear-scope fixes, straightforward changes, low-risk.

20. **Explore subagent:** Delegate verbose discovery to subagent; main agent stays high-level. Subagents have isolated context; pass required information explicitly.

21. **Scratchpad files:** Persist findings to a file during exploration; survives `/compact` and `/clear`.

22. **`/compact`:** Summarize context after discovery phases. Mitigates context degradation in long sessions (symptoms: vague "typical patterns" language, lost specificity).

23. **`--resume <name>`:** Continue cross-day work. But if files changed, start fresh with a summary (more reliable than stale tool results).

24. **`fork_session`:** Branch from shared baseline for divergent approach exploration (e.g., compare two testing strategies).

25. **Subagent context isolation:** Subagents do NOT auto-inherit coordinator history. Pass all needed context, findings, instructions in the subagent prompt.

26. **Task decomposition for legacy:** Map structure first, identify high-impact areas, prioritize, adapt as dependencies emerge. Never skip the mapping phase.
