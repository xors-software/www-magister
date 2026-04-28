# Scenario 5: Claude Code for Continuous Integration

## The Scenario

You are integrating Claude Code into your Continuous Integration/Continuous Deployment (CI/CD) pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimize false positives.

**Primary domains:** Claude Code Configuration & Workflows (D3), Prompt Engineering & Structured Output (D4).

---

## What's actually being tested

This scenario is the canonical exam test for **non-interactive CLI invocation in automated pipelines**, **machine-parseable output via structured formats**, **false-positive reduction through explicit criteria and few-shot**, and **multi-pass review architecture to avoid attention dilution**.

The exam writers test D3 directly through Task 3.6 (Claude Code in CI/CD): the `-p` / `--print` flag for non-interactive mode, `--output-format json` and `--json-schema` for structured findings, CLAUDE.md as project context, session isolation between generation and review, and re-review patterns after new commits. Q10 (exam guide extract) tests the CLI invocation flag directly; Q11 tests batch API appropriateness; Q12 tests multi-file review architecture.

D4 is heavily tested through Task 4.1 (explicit criteria for precision), Task 4.2 (few-shot prompting for FP reduction and format consistency), Task 4.5 (batch processing strategies and when NOT to use batch), and Task 4.6 (multi-instance review and attention dilution). The core pattern is: **vague instructions like "be conservative" or "report high-confidence only" don't reduce false positives; explicit criteria with concrete examples and few-shot demonstrations do**.

Task 1.6 (task decomposition strategies) is also tested: per-file local passes + cross-file integration pass for many-file PRs. The anti-pattern is assuming a larger context window or a single consensus run across multiple full-PR reviews fixes attention dilution; it doesn't.

The foundational principle: **non-interactive CLI invocation needs explicit flags and structured output, not environment variables or workarounds. Multi-file reviews need decomposition into per-file + cross-file passes. False positives are minimized by explicit criteria + few-shot, not by confidence-based filtering. Batch API is for non-blocking, not for pre-merge checks.**

---

## Reference architecture: how to build this

### The CI Invocation: Non-Interactive Mode

When Claude Code runs in CI, the environment is non-interactive: no human at the terminal, no TTY, output to stdout/files for posting as comments. The tool must not hang waiting for input.

**WRONG (hangs in CI):**
```bash
# These will hang or fail:
claude "Review this PR for bugs"
# (waits for follow-up input, no way to EOF)

CLAUDE_HEADLESS=true claude "Review..."
# (CLAUDE_HEADLESS env var doesn't exist)

claude "Review..." < /dev/null
# (doesn't prevent hanging on internal paging/decisions)

claude --batch "Review..."
# (--batch flag doesn't exist)
```

**CORRECT:**
```bash
claude -p "Review the PR in $PR_DIFF for security issues. Output as JSON."
# -p (or --print) flag tells Claude to:
# 1. Process the input without waiting for follow-up
# 2. Print result to stdout
# 3. Exit cleanly when done
```

The `-p` flag is the canonical way to invoke Claude Code non-interactively. Task 3.6 explicitly lists this. Exam Q10 tests exactly this: "Claude hangs in CI. What's the fix?" Answer: `-p` flag. Not environment variables, not stdin redirects, not non-existent `--batch` flag.

### Structured Output: JSON Schema for Machine-Parseable Findings

Code review feedback must be posted as inline PR comments. GitHub API expects structured data: file path, line number, severity, issue text, suggested fix.

**BAD (unstructured prose):**
```
claude "Review the PR"
# Output:
# "In the login.ts file, line 47, there's an issue with error handling.
# The function doesn't catch network timeouts, which could leave the UI
# unresponsive. Consider adding a try-catch block around the fetch call."
```

The CI system must parse this prose to extract (file, line, text). Fragile; prone to parse errors.

**GOOD (structured JSON with schema):**
```bash
claude -p \
  --output-format json \
  --json-schema '{
    "type": "object",
    "properties": {
      "findings": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "file_path": {"type": "string"},
            "line_number": {"type": "integer"},
            "severity": {"enum": ["critical", "high", "medium", "low"]},
            "category": {"enum": ["bug", "security", "style", "performance"]},
            "issue": {"type": "string"},
            "suggested_fix": {"type": "string"},
            "detected_pattern": {"type": "string"}
          },
          "required": ["file_path", "line_number", "severity", "issue"]
        }
      },
      "summary": {"type": "string"}
    },
    "required": ["findings"]
  }' \
  "Review PR changes: $PR_DIFF"
```

Output:
```json
{
  "findings": [
    {
      "file_path": "src/login.ts",
      "line_number": 47,
      "severity": "high",
      "category": "bug",
      "issue": "fetch() call in login handler is not wrapped in try-catch. Network timeouts will crash the handler.",
      "suggested_fix": "Wrap the fetch call in try-catch and return a user-friendly error message.",
      "detected_pattern": "unhandled_promise_rejection"
    }
  ],
  "summary": "1 high-severity issue found."
}
```

Task 3.6 explicitly requires `--output-format json` and `--json-schema` for CI. The schema:
- Eliminates format ambiguity (no "line 47" vs "line number 47" parsing)
- Enables automated posting to GitHub
- Validates Claude's response matches expectations
- Supports `detected_pattern` field for systematic FP analysis (Task 4.4)

### CLAUDE.md as Project Context

The CI environment is stateless: no prior session history, no memory of team conventions. CLAUDE.md provides that context.

**Example CLAUDE.md for CI:**
```markdown
# Testing Standards
Our test suite uses Jest. Test files live in __tests__/ directories.

## Test Coverage Requirements
- All exported functions must have tests
- Critical paths (auth, payment) require >90% coverage
- Fixtures are in __tests__/fixtures/

## Code Review Standards
Flag these as bugs:
- Uncaught promise rejections
- SQL injection risks (unsanitized queries)
- Missing authentication checks on protected endpoints

Do NOT flag:
- Style inconsistencies (linting is separate)
- Missing JSDoc comments
- Formatting (prettier is separate)

## Session Isolation
When reviewing code this session generates:
- Use an independent review instance (don't review in the same session)
- This prevents self-review bias where generation reasoning is retained

## PR Review Process
On new commits:
1. Include prior findings from previous reviews
2. Report ONLY new issues or still-unaddressed prior ones
3. Don't re-flag already-acknowledged findings
```

When Claude Code runs in CI, it reads this CLAUDE.md and uses it as a guide. Task 3.6 states: "CLAUDE.md provides project context (testing standards, fixtures, review criteria) to CI-invoked Claude."

### Session Isolation: Independent Review Instance

Self-review has a critical limitation: the same session that generated code has reasoning context from the generation phase. The model is less likely to question code it just wrote in the same session.

**WRONG (same session):**
```bash
# Session 1:
claude -p "Generate a login handler"
# [Claude writes login.ts]

# Still in Session 1:
claude -p "Review the code you just generated"
# [Claude reviews, but carries generation reasoning forward]
# Result: Misses obvious bugs because of retained context
```

**CORRECT (independent instance):**
```bash
# Session 1:
claude -p "Generate a login handler"
# [Claude writes login.ts]

# [Exit session, commit code, push PR]

# Session 2 (new/independent):
claude -p "Review src/login.ts for bugs"
# [Fresh instance, no prior generation context]
# Result: Better bug detection
```

Task 4.6 states: "Independent review instances (no prior reasoning context) catch subtle issues better than self-review." This is tested in Q12: a 14-file PR has inconsistent findings across review runs. Why? Because the same session reviewing all 14 files retains reasoning about file 1-7 when reviewing file 8-14, leading to inconsistent application of criteria. Fix: per-file passes (each file reviewed independently, no retained context) plus a cross-file integration pass (looking only at data flow and dependencies).

Task 3.6 requires: "Include prior findings on re-review after new commits, instruct to report only new/unaddressed." This prevents duplicate comments and lets developers know what was already flagged.

### Multi-Pass Architecture: Per-File + Cross-File

A PR with 14 files can't be reviewed effectively in a single pass. The model's attention is diluted across all files, leading to:
- Inconsistent severity assignment (similar issue flagged as "high" in file 3, "low" in file 11)
- Contradictory findings (suggests a pattern in file 2, contradicts it in file 9)
- Missed cross-file issues (data flow issues are only visible across files)

**WRONG (single pass, all files):**
```bash
claude -p "Review all changes in $PR_DIFF"
# [Claude sees all 14 files at once]
# Attention is diluted across 14 contexts
# Inconsistent findings, missed data flow issues
```

**CORRECT (decomposed passes):**
```bash
# Pass 1: Per-file local review (5-10 files per batch, depends on context)
for file in src/auth.ts src/db.ts src/api.ts src/utils.ts src/types.ts; do
  claude -p --output-format json \
    "Review $file for local bugs (unhandled errors, type mismatches, null refs).
     Don't worry about cross-file compatibility yet." \
    --json-schema '...' \
    < "$file"
done

# Pass 2: Cross-file integration review
claude -p --output-format json \
  "The PR modifies these files: $(git diff --name-only).
   Review for data flow issues:
   - Type mismatches between auth.ts outputs and db.ts inputs?
   - API contracts between api.ts and utils.ts consistent?
   - Any unused exports or missing imports?
   Include prior findings from pass 1: $(cat prior_findings.json)" \
  --json-schema '...'
```

Why this works:
- Pass 1 focuses each instance on local issues (null checks, error handling) without context bloat
- Pass 2 explicitly reviews cross-file contracts and data flow
- No retained reasoning between passes (each is independent)
- Attention dilution is minimized

Task 1.6 states: "Split large reviews into per-file local passes plus a separate cross-file integration pass to avoid attention dilution." This is tested in Q12 where a 14-file PR has inconsistent findings. The distractors include:
- "Give the model a larger context window" (doesn't fix dilution, just adds noise)
- "Run the review three times and report consensus" (suppresses real intermittent bugs, actually makes it worse)
- "Ask developers to split the PR into smaller ones" (shifts burden, doesn't fix the system)

### Explicit Criteria Over "Be Conservative"

False positive rate is high when criteria are vague.

**WRONG (vague, leads to FP):**
```
"Review the code and flag issues. Be conservative - only report things you're
confident about. Don't flag minor style issues."
```

Result: Claude flags 47 findings, 35% are minor style issues it interpreted as "important." Or it flags nothing because "conservative" is ambiguous and confidence is poorly calibrated.

**CORRECT (explicit, reduces FP):**
```
"Review the code. Flag these and ONLY these:

**Report as BUG (high):**
- Uncaught async errors: try-catch missing, promise .catch() missing, top-level await without handler
  Example: fetch(...).then(...) with no .catch() → REPORT

**Report as BUG (medium):**
- Null/undefined refs: accessing .property without null check, array[index] without bounds check
  Example: data.user.email where data could be null → REPORT

**Report as SECURITY (high):**
- SQL injection: user input in query string without parameterization
  Example: query = 'SELECT * FROM users WHERE id=' + userId → REPORT

**DO NOT REPORT (even if present):**
- Style/formatting: indentation, line length, spacing
- JSDoc comments: missing, incomplete, or outdated documentation
- Local variable naming: cryptic names like 'x', 'tmp' (linting handles this)
- Unused imports: if import is not used (linting handles this)

For each finding:
- Severity: one of {critical, high, medium, low}
- Category: one of {bug, security, performance, style}
- Code location: exact line number
- Suggested fix: concrete code snippet or explanation
"
```

This eliminates ambiguity. Claude knows exactly what to report. FP rate drops. Task 4.1 states: "Explicit criteria > vague instructions ('flag only when comment claim contradicts code behavior' > 'check comments are accurate')" and "Temporarily disable high false-positive categories to restore trust while improving prompts."

### Few-Shot Examples for Ambiguous Cases

Severity assignment is ambiguous. When is a missing null check "high" vs "medium"?

**Without few-shot (vague):**
```
"Flag potential null reference bugs. Severity: high if critical path,
medium otherwise."
```

Result: Claude flags "if (!user)" as high in some files, medium in others.

**With few-shot (consistent):**
```
"Flag potential null reference bugs. Severity is determined by execution
context and data origin:

Example 1: CRITICAL PATH → HIGH
  Code:
    const user = await getUserFromDB(userId); // can return null
    const email = user.email; // ← missing null check
  Why HIGH: This is in the payment authorization flow. Null here crashes
  the transaction and loses revenue.

  Output:
  {
    "severity": "high",
    "issue": "user could be null; email access will throw TypeError",
    "suggested_fix": "Add guard: if (!user) return handleError(); const email = user.email;"
  }

Example 2: NON-CRITICAL PATH → MEDIUM
  Code:
    const profile = getUserProfile(userId); // can return null
    console.log(profile.bio); // ← missing null check
  Why MEDIUM: This is in a logging statement during optional profile fetch.
  Null here causes a console error but doesn't affect user operations.

  Output:
  {
    "severity": "medium",
    "issue": "profile could be null; bio access will throw TypeError",
    "suggested_fix": "Add guard: if (profile) console.log(profile.bio);"
  }

Example 3: DEFENSIVE CODE → DO NOT FLAG
  Code:
    if (data && data.items && data.items.length > 0) {
      return data.items[0].name; // multiple checks prevent null
    }
  Why NOT FLAGGED: Multiple checks ensure safety before access.

Apply this reasoning to all null-reference findings in the PR.
"
```

Task 4.2 states: "Few-shot is the most effective technique for consistently formatted output when instructions alone fail" and "2-4 targeted examples for ambiguous scenarios showing reasoning for chosen action over plausible alternatives." This is also tested in Q12 where severity is inconsistent; few-shot examples establish a consistent decision tree.

### Detected Pattern Field for FP Analysis

Over time, you discover a category of false positives: flagging "missing async error handling" when the promise is actually handled by an outer context manager.

**Without pattern tracking:**
```json
{
  "file_path": "src/events.ts",
  "line_number": 123,
  "severity": "high",
  "issue": "fetch() call without .catch() handler"
}
```

You dismiss it as a false positive, but 3 weeks later, the same issue appears again. No systematic way to analyze "what percent of these are FP?"

**With detected_pattern field:**
```json
{
  "file_path": "src/events.ts",
  "line_number": 123,
  "severity": "high",
  "issue": "fetch() call without .catch() handler",
  "detected_pattern": "unhandled_promise_in_event_listener"
}
```

After 100 reviews, you can query: "How many findings had detected_pattern = 'unhandled_promise_in_event_listener'? Of those, how many were false positives?" If 60% are FP, you know this pattern needs refinement (maybe promises in event listeners are legitimately handled by browser, so this pattern should be disabled or re-scoped).

Task 4.4 states: "`detected_pattern` field tracks which constructs trigger findings → enables analysis of dismissal patterns."

### Message Batches API: When to Use, When NOT to Use

The Anthropic Message Batches API (Task 4.5) offers 50% cost savings and up to 24-hour processing. But it has no latency SLA and doesn't support multi-turn tool calling within a single request.

**CORRECT (batch for non-blocking):**
```bash
# Overnight tech-debt scan: batch the review of all 50 files
# Next morning, retrieve results, summarize, post to internal dashboard
claude batch submit --input-file pr_files.jsonl
# [submit at 6pm, retrieve at 6am next day]
# Cost: 50% savings, latency: up to 24 hours (acceptable for overnight)
```

**WRONG (batch for pre-merge check):**
```bash
# Pre-merge check: must block merge until review is done
# Using batch:
claude batch submit --input-file pr_review.jsonl
# [wait up to 24 hours?? user's PR blocks for a day??]
# This is unacceptable
```

**CORRECT (sync API for blocking):**
```bash
# Pre-merge check: must complete quickly
# Using sync API:
claude -p "Review this PR for bugs" < pr_changes.txt
# [Latency: ~5 seconds, blocks merge until done]
# Cost: 2x batch, but acceptable for pre-merge
```

Task 4.5 states: "Appropriate for non-blocking, latency-tolerant (overnight, weekly, nightly). Inappropriate for blocking workflows (pre-merge checks). Batch API does NOT support multi-turn tool calling within a single request."

The exam tests this in Q11: "Code reviews for both pre-merge checks (must be done before merge) and overnight tech-debt reports (next morning is fine). Should you use Batch API for both?"

Answer: No. Pre-merge must use sync API (low latency). Overnight can use batch (low cost). Q11 distractors include: "Batch is often faster so use it for pre-merge" (wrong; batch has no SLA), "Batch requires custom_id ordering to ensure results come back in order" (wrong; custom_id is for correlation only, not ordering; you must manage ordering separately).

### Batch API Details: custom_id and Resubmission

```bash
# Prepare batch input (JSONL format)
cat > batch_input.jsonl << 'EOF'
{"custom_id": "auth.ts", "params": {"model": "claude-3-5-sonnet-20241022", "max_tokens": 1000, "messages": [{"role": "user", "content": "Review src/auth.ts"}]}}
{"custom_id": "db.ts", "params": {"model": "claude-3-5-sonnet-20241022", "max_tokens": 1000, "messages": [{"role": "user", "content": "Review src/db.ts"}]}}
EOF

# Submit batch
claude batch submit --input-file batch_input.jsonl
# Output: batch_id = "batch_xxxxx"

# Check status
claude batch status batch_xxxxx
# [eventually returns]

# Retrieve results (JSONL format)
claude batch retrieve batch_xxxxx > batch_output.jsonl

# Parse output
cat batch_output.jsonl | grep '"custom_id": "auth.ts"'
# {"custom_id": "auth.ts", "result": {"message": {...}, "usage": {...}}}
```

If a specific file's review timed out or failed:
```bash
# Resubmit ONLY the failed custom_id
cat > batch_input_retry.jsonl << 'EOF'
{"custom_id": "db.ts", "params": {"model": "claude-3-5-sonnet-20241022", "max_tokens": 1000, "messages": [{"role": "user", "content": "Review src/db.ts"}]}}
EOF

claude batch submit --input-file batch_input_retry.jsonl
```

Task 4.5 states: "Resubmit only failed `custom_id`s with modifications (e.g., chunk oversized docs)."

### Test Generation with Existing-Tests Context

Test generation should avoid duplicating existing test scenarios.

**WRONG (no context on existing tests):**
```bash
claude -p "Generate Jest tests for src/auth.ts"
# [Claude generates tests]
# Result: Tests cover the same scenarios as __tests__/auth.test.ts
# Wasted effort, redundant coverage
```

**CORRECT (include existing tests):**
```bash
# Read existing test file
existing_tests=$(cat __tests__/auth.test.ts)

claude -p \
  "Generate additional Jest tests for src/auth.ts.
   Existing tests already cover:
   $(existing_tests)

   Focus on these gaps:
   - Edge cases not covered in existing tests
   - New functions added in this PR
   - Error cases not yet tested" \
  < src/auth.ts
```

Task 3.6 states: "Provide existing test files in test-gen context to avoid duplicates."

### Re-Review on New Commits with Prior Findings

Developer pushes PR, Claude reviews, flags 5 issues. Developer fixes 3 of them and pushes again. Now review runs on the updated code.

**WRONG (ignore prior findings):**
```bash
# Second review (after developer commits fixes)
claude -p "Review the PR for bugs"
# [Claude flags the same 3 fixed issues again]
# Result: Duplicate comments, developer sees "bug flagged, then flagged again"
```

**CORRECT (include prior findings, report only new):**
```bash
# Store prior findings
prior_findings='[
  {
    "file_path": "src/login.ts",
    "line_number": 47,
    "issue": "Uncaught promise rejection in fetch()"
  },
  ...
]'

# Second review
claude -p \
  "Re-review the PR. Prior review flagged these issues:
   $(echo $prior_findings)

   For each prior finding:
   - If still present, note it as 'still-unaddressed'
   - If fixed, remove from the report

   Report ONLY new issues or still-unaddressed prior ones.
   Don't re-flag already-fixed issues." \
  --output-format json \
  --json-schema '...'
```

Task 3.6 states: "Include prior findings on re-review after new commits, instruct to report only new/unaddressed."

---

## The exam-relevant patterns (must internalize)

1. **`-p` / `--print` flag for non-interactive CLI invocation, not environment variables or stdin workarounds.** Task 3.6. This is Q10 directly: "Claude hangs in CI. What's the fix?" Answer: `-p` flag. The flag tells Claude to process and exit cleanly without waiting for follow-up input.

2. **`--output-format json` and `--json-schema` for machine-parseable findings.** Task 3.6. JSON schema eliminates format ambiguity, enables automated PR commenting, validates output structure. Without schema, CI system must parse prose.

3. **CLAUDE.md provides project context to CI runs: testing standards, fixture conventions, review criteria, session isolation rules.** Task 3.6. CI environment is stateless; CLAUDE.md fills that gap.

4. **Session isolation: independent review instance (fresh context, no prior generation reasoning) catches bugs better than self-review in same session.** Task 4.6. Self-review in the same session where code was generated retains generation reasoning, making the reviewer less likely to question the code.

5. **Per-file passes avoid attention dilution; follow with cross-file integration pass for data-flow issues.** Task 1.6, Task 4.6. A single 14-file review has diluted attention and leads to inconsistent severity assignment. Decompose: per-file local (each file independent, no retained context), then cross-file integration (focusing only on contracts and data flow).

6. **Explicit criteria over "be conservative" or "report only high-confidence."** Task 4.1. Vague instructions lead to inconsistent, high false positive rates. List exactly which categories to report (bugs, security), which to skip (style, local naming conventions), with severity criteria and concrete code examples per level.

7. **Few-shot examples for ambiguous cases: 2-4 targeted examples showing the reasoning for chosen action over plausible alternatives.** Task 4.2. Severity assignment (when is null-check "high" vs "medium"?) needs examples that establish consistent decision boundaries.

8. **Temporary category disable for high false-positive patterns.** Task 4.1. If a category is 60% false positive, disable it while improving the prompt instead of letting it clutter findings.

9. **`detected_pattern` field for systematic false-positive analysis.** Task 4.4. Enables you to query "what patterns are triggering false positives?" and iteratively improve prompts.

10. **Batch API for non-blocking (overnight reports, weekly scans), synchronous API for blocking (pre-merge checks).** Task 4.5. Batch has no latency SLA; sync completes in seconds. Never use batch for pre-merge checks.

11. **Batch API does NOT support multi-turn tool calling within a single request.** Task 4.5. Each batch item is a single request-response pair.

12. **`custom_id` in batch for correlation; resubmit only failed IDs with modifications.** Task 4.5. custom_id links request to response, not ordering. On failure, resubmit just that ID.

13. **Prompt refinement on sample before bulk batch to reduce iteration cost.** Task 4.5. Test the review prompt on 2-3 files first, iterate, then submit 50-file batch.

14. **Include prior findings on re-review; instruct to report only new or still-unaddressed.** Task 3.6. Prevents duplicate comments and tracks developer progress.

15. **Test generation includes existing test files as context to avoid duplicates.** Task 3.6. Reading existing tests prevents redundant scenario coverage.

16. **Bigger context window does NOT fix attention dilution; decomposition does.** Task 4.6. Claude 3.5 Sonnet has 200K tokens, Claude 3 Opus has 200K. Using larger model for single-pass 14-file review still has dilution problem. Multi-pass architecture fixes it.

17. **Consensus across multiple full-PR runs SUPPRESSES real intermittent bugs, doesn't fix attention dilution.** Anti-pattern. Running the review 3 times and reporting "only findings in all 3 runs" actually removes real bugs from the report (some bugs are missed in some runs due to dilution).

18. **Asking developers to chunk PRs (split into smaller ones) shifts burden, doesn't fix the system.** Anti-pattern. The right fix is multi-pass architecture in the review system, not asking developers to change their workflow.

---

## Gotchas and anti-patterns

1. **Using `--batch` flag or `CLAUDE_HEADLESS` environment variable.** Neither exists. The correct non-interactive flag is `-p` or `--print`. Task 3.6. Exam tests this directly (Q10). If you see these options in a question, eliminate them immediately.

2. **Using stdin redirection `< /dev/null` as a workaround for hanging.** This doesn't work. The `-p` flag is the canonical solution. Piping `/dev/null` doesn't prevent Claude from hanging on internal decisions.

3. **Using Batch API for pre-merge checks.** Batch has no latency SLA; can take up to 24 hours. Pre-merge checks must block merge, so 24-hour latency is unacceptable. Use synchronous API. Q11 directly tests this.

4. **Batch API with a fallback timeout to sync API.** "If batch doesn't return in 10 minutes, fall back to sync." This adds complexity without benefit. Decide upfront: blocking → sync, non-blocking → batch. Task 4.5.

5. **Assuming larger context model (Claude 3 Opus vs Sonnet) fixes attention dilution in single-pass 14-file review.** It doesn't. Bigger context adds noise without fixing the core problem: reviewing 14 files in one pass dilutes attention. Multi-pass architecture (per-file + cross-file) is the fix, not model size. Task 4.6.

6. **Running review 3 times and reporting consensus ("only findings present in all 3 runs") as a fix for attention dilution.** This actually suppresses real bugs. Some issues will be missed in run 1 due to dilution, caught in run 2, but consensus-filtering removes them from the final report. Task 4.6 anti-pattern.

7. **"Be conservative" or "report only high-confidence findings" without specific criteria.** This is vague and leads to inconsistent, high FP rates. Replace with explicit criteria: "Report these bugs (with concrete examples), don't report these (with examples), severity is determined by (specific rules)." Task 4.1.

8. **Self-reported confidence score to filter findings.** Claude says "I'm 90% confident this is a bug." This is poorly calibrated (high confidence on straightforward cases, high confidence on hard cases). Don't use confidence as a filter. Use explicit criteria. Task 4.1, Task 4.6.

9. **Same-session review of code generated in the same session.** The reviewer retains generation reasoning and is less likely to catch bugs. Use an independent instance. Task 4.6.

10. **Adding more files to one review pass to "give more context" in the hope of catching cross-file bugs.** This worsens attention dilution without enabling cross-file reasoning. Instead: per-file passes (for local bugs), then a separate cross-file pass (explicitly asking about data flow). Task 1.6, Task 4.6.

11. **Single-pass review on a 14-file PR expecting it to catch all local AND cross-file issues.** It won't. Decompose: pass 1 (per-file local), pass 2 (cross-file integration). Task 1.6, Task 4.6.

12. **Handling oversized files in batch without chunking.** If a batch item (file review) times out or exceeds token limits, resubmit with the file split into smaller chunks or with a summary. Task 4.5.

13. **Re-running review on new commits without including prior findings, then wondering why the same issues are flagged again.** Include prior findings and instruct: "Report only new or still-unaddressed." Task 3.6.

14. **Expecting test generation without existing-test context to not duplicate scenarios.** It will. Always include existing test files as context so Claude knows what's already covered. Task 3.6.

15. **Using sentiment analysis or issue complexity as a signal for code review categories.** Task 5.2 lists these as anti-patterns (though Task 5.2 is about escalation, the principle carries: don't use soft signals like sentiment or perceived complexity; use explicit criteria).

---

## What a good answer accounts for

When you read a scenario question about CI/CD code review, first **identify the problem domain**:

1. **Non-interactive invocation** (CLI hangs, output to file, no TTY): This is a **CLI flag** question. Answer: `-p` flag, not environment variables or workarounds. Task 3.6, Q10.

2. **False positive reduction** (30% of flagged issues are style, not bugs): This is an **explicit criteria + few-shot** question. Answer: list exactly which categories to report, with concrete examples per severity level. Not "be conservative" or "high confidence only." Task 4.1, Task 4.2.

3. **Inconsistent findings across runs** (bug marked "high" in file 3, "medium" in file 11): This is an **attention dilution / decomposition** question. Answer: per-file passes (each file independent) + cross-file integration pass. Not bigger model, not consensus runs. Task 1.6, Task 4.6, Q12.

4. **Blocking vs non-blocking review** (pre-merge checks must complete quickly; overnight reports can be slow): This is a **sync vs batch API** question. Answer: sync for pre-merge, batch for overnight. Not "batch is faster" or "timeout fallback." Task 4.5, Q11.

5. **Self-review catching fewer bugs than independent review**: This is a **session isolation** question. Answer: use an independent instance (fresh context, no prior generation reasoning). Task 4.6.

6. **Duplicate findings on re-review after developer fixes some issues**: This is a **prior findings + instruction to report only new** question. Answer: include prior findings in the prompt, instruct to skip already-fixed ones. Task 3.6.

7. **Test generation duplicating existing test scenarios**: This is an **existing-tests context** question. Answer: include existing test files in the prompt. Task 3.6.

Once you've identified the domain, look at the options:

- If it's a non-interactive question and an option says "CLAUDE_HEADLESS env var" or `--batch` flag, eliminate it.
- If it's a FP reduction question and an option says "report only if confidence > threshold," eliminate it.
- If it's an attention dilution question and an option says "use a bigger model" or "run 3 times and consensus," eliminate it.
- If it's a blocking/non-blocking question and an option says "batch for pre-merge," eliminate it.

The harder questions test boundary cases:

- When is a **single pass sufficient vs multi-pass required**? (Single pass for small, well-scoped PRs like 2-3 files; multi-pass for many files to avoid dilution. Task 1.6.)
- When is **bigger context window the fix vs decomposition required**? (Decomposition; bigger context doesn't fix attention dilution, just adds noise. Task 4.6.)
- When is **batch API appropriate vs inappropriate**? (Batch for non-blocking, no SLA acceptable; sync for blocking. Never use batch for pre-merge checks even if "often faster." Task 4.5.)
- When is **confidence-based filtering acceptable vs explicit criteria required**? (Never confidence-based; always explicit criteria. Task 4.1.)

---

## Practice questions

### Q1: Non-Interactive CLI Invocation in CI

Claude Code is integrated into a GitHub Actions workflow that runs on every PR. The workflow hangs indefinitely after invoking Claude, preventing the merge gate from completing.

```yaml
- name: Review PR
  run: |
    claude "Review the changes for bugs"
```

What is the most effective fix?

A) Add the `-p` flag to the invocation.

B) Set the `CLAUDE_HEADLESS=true` environment variable before running claude.

C) Pipe `/dev/null` into the claude command: `claude "..." < /dev/null`.

D) Use the `--batch` flag: `claude --batch "Review..."`.

**Correct: A**

**Why A:** Task 3.6 explicitly requires the `-p` / `--print` flag for non-interactive mode. This tells Claude to process the input and exit cleanly without waiting for follow-up. The flag is the canonical solution. Exam Q10 tests this directly.

**Why not the others:**
- B) `CLAUDE_HEADLESS` environment variable doesn't exist. No such feature.
- C) Piping `/dev/null` doesn't prevent hanging; Claude still waits on internal decisions.
- D) `--batch` flag doesn't exist. The batch API is a separate system (for batching requests), not a CLI flag.

---

### Q2: Structured Output for Automated PR Commenting

A CI workflow reviews PRs and needs to post findings as GitHub PR comments. The review output is currently:

```
"In src/login.ts line 47, the fetch() call doesn't have error handling.
This could crash the handler. Consider wrapping it in a try-catch block."
```

The CI system parses this prose to extract file, line, and text, but parsing is fragile (breaks if Claude's phrasing varies slightly).

Which approach best enables reliable automated commenting?

A) Ask Claude to always format findings as "FILE:LINE: ISSUE" on each line.

B) Use `--output-format json` and `--json-schema` with a defined schema for findings.

C) Ask Claude to output findings as a CSV with columns: file, line, issue.

D) Require findings to be Markdown tables and parse the table.

**Correct: B**

**Why B:** Task 3.6 requires `--output-format json` and `--json-schema` for CI output. JSON schema:
- Validates Claude's response matches the expected structure
- Eliminates format ambiguity
- Enables automated posting via GitHub API
- Supports fields like `detected_pattern` for FP analysis

**Why not the others:**
- A) Prose parsing is fragile; any deviation breaks parsing.
- C) CSV is unstructured (no type validation, no schema enforcement).
- D) Markdown table parsing is fragile and doesn't validate data types.

---

### Q3: Multi-File PR Review Inconsistency

A 14-file PR is reviewed and Claude flags:
- In src/auth.ts (file 1): null-check issue marked "high" severity
- In src/utils.ts (file 8): similar null-check issue marked "low" severity
- Some cross-file data-flow issues are missed entirely

The findings are inconsistent and incomplete.

What is the root cause and fix?

A) Claude's context window is too small; use Claude 3 Opus (200K tokens) instead of Sonnet (200K tokens).

B) Run the review 3 times on the full PR and report only findings present in all 3 runs to reduce noise.

C) The single-pass review of all 14 files at once causes attention dilution, leading to inconsistent criteria application and missed cross-file issues. Decompose into per-file local passes (each file independent) followed by a separate cross-file integration pass.

D) Ask developers to split large PRs into smaller ones (max 5 files per PR).

**Correct: C**

**Why C:** Task 1.6 (task decomposition) and Task 4.6 (multi-instance review) state: "Per-file passes for local issues + integration pass for cross-file data flow to avoid attention dilution and contradictory findings." Attention is diluted when reviewing 14 files in one pass; severity criteria are applied inconsistently; cross-file data flow issues require explicit focus.

The fix:
- Pass 1: Review each file independently (auth.ts alone, utils.ts alone) → consistent severity within each pass
- Pass 2: Review only cross-file contracts (data flow, type compatibility) → catches integration issues

**Why not the others:**
- A) Both Sonnet and Opus have 200K tokens. Bigger context doesn't fix attention dilution; it adds noise. Task 4.6 states: "Bigger context window is NOT a fix for attention dilution."
- B) Consensus across runs suppresses real bugs. Some issues are missed in run 1 due to dilution, caught in run 2, but consensus filtering removes them. Task 4.6 anti-pattern.
- D) Shifts burden to developers instead of fixing the system. Task 1.6 and Q12 explicitly call this out: developers shouldn't have to chunk PRs; the review system should be multi-pass.

---

### Q4: False Positive Reduction in Code Review

Code review findings include:
- 45% actual bugs (uncaught errors, null refs, security issues)
- 55% false positives (style flagging as "bug", missing JSDoc flagged as "incomplete implementation")

The review prompt currently says: "Flag bugs and issues. Be conservative - only report things you're confident about."

What is the most effective fix?

A) Add a confidence threshold: "Report findings only if your confidence is > 80%."

B) Define explicit criteria with concrete examples:
   - "Report as BUG (high): uncaught promise rejection. Example: fetch(...).then(...) without .catch() → REPORT"
   - "DO NOT REPORT: missing JSDoc, style inconsistencies, local variable names"
   - Include 2-3 worked examples for each severity level

C) Run the review twice and report only findings that appear in both runs.

D) Disable the entire "style" category by removing style-related examples from the prompt.

**Correct: B**

**Why B:** Task 4.1 states: "Explicit criteria > vague instructions ('be conservative' doesn't work). Define severity criteria with concrete code examples per level." Task 4.2 adds: "Few-shot examples (2-4 targeted examples) beat general instructions."

Explicit criteria eliminate ambiguity; "conservative" and confidence are poorly calibrated. Few-shot examples establish consistent decision boundaries.

**Why not the others:**
- A) Self-reported confidence is poorly calibrated (Task 4.1 anti-pattern). Claude is often highly confident on straightforward cases and hard cases alike.
- C) Running twice doesn't reduce FP; it increases noise (you'd see findings in both runs, missing precision).
- D) Disabling the entire category is too blunt. Instead, refine the criteria: "DO NOT flag style (indentation, spacing, line length, JSDoc)" with examples that show the boundary.

---

### Q5: Batch API Appropriateness

An engineering team needs two code review workflows:
1. Pre-merge checks: Reviews must complete and block merge or allow it (SLA: < 5 minutes)
2. Overnight tech-debt reports: Reviews of all open PRs, summarized in a morning email (SLA: completed by 6am)

Should the team use the Message Batches API for both?

A) Yes, batch API is generally faster and cheaper, so use it for both workflows.

B) No. Pre-merge checks should use the synchronous API (completes in ~5 seconds, blocks merge). Overnight reports can use batch API (completes within 24 hours, cost savings acceptable).

C) Use batch for pre-merge but implement a timeout fallback to sync API if batch doesn't return in 2 minutes.

D) Batch API supports ordered retrieval via custom_id sorting, so it's appropriate for both if you sort results by custom_id before posting to GitHub.

**Correct: B**

**Why B:** Task 4.5 states: "Batch API: appropriate for non-blocking, latency-tolerant (overnight, weekly, nightly). Inappropriate for blocking workflows (pre-merge checks). Batch has no guaranteed latency SLA."

Pre-merge checks are blocking (must block merge). Batch latency (up to 24 hours) is unacceptable. Sync API (seconds) is required. Overnight reports are non-blocking; batch is appropriate and cheaper.

**Why not the others:**
- A) Batch is NOT faster; it has no SLA and can take 24 hours. Never use for pre-merge checks.
- C) Timeout fallback adds unnecessary complexity. Decide upfront: blocking → sync, non-blocking → batch. Don't mix.
- D) custom_id is for correlation (linking request to response), not ordering. Results come back in any order; you must manage ordering separately. And ordering doesn't make batch appropriate for blocking workflows (SLA is still missing).

---

### Q6: Session Isolation for Code Review

A developer uses Claude Code to generate a login handler, then asks Claude (in the same session) to review the generated code. The review flags 2 bugs.

An independent Claude instance (fresh session) reviewing the same code flags 7 bugs.

Why does the independent instance find more issues?

A) The independent instance has a larger context window.

B) The independent instance lacks the generation reasoning context from the earlier step, avoiding bias where the generator is less likely to question its own code. Task 4.6 states: "Independent review instances catch subtle issues better than self-review."

C) The independent instance is using a different model (Sonnet instead of Opus).

D) The independent instance ran the review twice, while the first ran it once.

**Correct: B**

**Why B:** Task 4.6 (Multi-instance / multi-pass review) states: "Self-review limitation: model retains generation reasoning, less likely to question itself in same session. Independent review instances (no prior reasoning context) catch subtle issues better than self-review."

The same session that generated code carries forward the reasoning ("I chose this error-handling approach because..."), making the model reluctant to criticize it. Fresh context eliminates this bias.

**Why not the others:**
- A) Both instances have the same context window. Bigger context doesn't fix bias; it adds noise.
- C) Model version isn't the variable here; session context is.
- D) No evidence that the independent instance ran twice. The difference is session freshness.

---

### Q7: Prior Findings and Re-Review After New Commits

A PR is reviewed and Claude flags 5 bugs. The developer fixes 3 of them and pushes a new commit. The team runs the review again without including the prior findings in the prompt.

What is the likely outcome?

A) The review will correctly report only the 2 unfixed bugs, improving the developer's workflow.

B) The review will re-flag the 3 fixed bugs, creating duplicate comments and confusing the developer.

C) The review will miss all bugs because the context is fresh and Claude doesn't remember prior findings.

D) The review will flag all 5 bugs again plus new ones, doubling the finding count.

**Correct: B**

**Why B:** Task 3.6 states: "Include prior findings on re-review after new commits, instruct to report only new/unaddressed."

Without prior findings in the prompt, Claude has no way to know that certain bugs were already flagged. It will re-flag fixed bugs as if they're new, creating duplicate comments.

**Why not the others:**
- A) Without prior findings context, Claude will re-flag fixed bugs.
- C) Claude doesn't have memory across sessions; fresh context means fresh analysis, but that means re-flagging prior issues.
- D) Claude won't "double" findings; it flags what it sees, which includes already-fixed issues.

---

### Q8: Few-Shot Examples for Severity Consistency

A code review flags null-reference bugs with inconsistent severity:

Example 1: `const email = user.email` (user can be null) in payment processing → flagged "high"

Example 2: `const bio = profile.bio` (profile can be null) in a logging statement → flagged "high"

Example 3: Similar null-ref in a UI component → flagged "low"

The team wants consistent severity assignment. Which approach is most effective?

A) Add explicit instructions: "High severity if in critical paths, low if in non-critical paths."

B) Include 2-4 worked few-shot examples showing:
   - Example 1 (critical path, null-ref) → HIGH with reasoning
   - Example 2 (non-critical, null-ref) → MEDIUM with reasoning
   - Example 3 (defensive code preventing null-ref) → DO NOT FLAG

C) Ask Claude to report its confidence score and filter out low-confidence findings.

D) Run the review 3 times and average the severity scores.

**Correct: B**

**Why B:** Task 4.2 states: "Few-shot is the most effective technique for consistently formatted output when instructions alone fail" and "2-4 targeted examples for ambiguous scenarios showing reasoning for chosen action over plausible alternatives."

Few-shot examples establish consistent decision boundaries. Each example shows the reasoning for the decision (why Example 1 is HIGH: execution context in payment flow; why Example 2 is MEDIUM: non-critical logging).

**Why not the others:**
- A) "Critical vs non-critical paths" is still vague. What defines "critical"? Few-shot examples clarify.
- C) Self-reported confidence is poorly calibrated (Task 4.1).
- D) Averaging severity scores across runs doesn't establish consistent criteria; it adds noise.

---

### Q9: Test Generation with Existing-Tests Context

A team generates tests for a new authentication module. The generator is told: "Generate Jest tests for src/auth.ts." After generation, the team finds that 60% of the generated tests duplicate scenarios already in __tests__/auth.test.ts.

Why did duplication occur and how is it fixed?

A) Claude has no way to know what tests already exist; duplication is inevitable.

B) Task 3.6 states: "Provide existing test files in test-gen context to avoid duplicates." The fix: include existing test files as context so Claude knows what's already covered. Instruct: "Focus on gaps: new functions added, edge cases not yet covered."

C) The duplication indicates that the codebase is over-tested; remove 60% of the old tests.

D) Use a larger model (Opus) which has better knowledge of existing code.

**Correct: B**

**Why B:** Task 3.6 explicitly requires existing test files in the context. Without context, Claude generates based on the code alone, rediscovering the same scenarios. With context, Claude identifies gaps and avoids duplication.

**Why not the others:**
- A) Claude can see existing test files if they're included in the context; duplication is avoidable.
- C) Over-testing isn't the issue; missing new coverage is.
- D) Model size doesn't solve lack of context.

---

### Q10: Detected Pattern Field for False-Positive Analysis

Over time, the code review system flags many "unhandled promise rejection" issues. The team wants to understand how many are real bugs vs false positives (handled by outer context managers).

How can the team systematically analyze this?

A) Track confidence scores for each finding.

B) Run the review multiple times and compare consensus findings.

C) Include a `detected_pattern` field in the findings (e.g., `detected_pattern: "unhandled_promise_in_event_listener"`). Task 4.4 states: "`detected_pattern` field tracks which constructs trigger findings → enables analysis of dismissal patterns." After 100 reviews, query: "Of all findings with detected_pattern = 'unhandled_promise_in_event_listener', what percent were false positives?" Then improve or disable the pattern.

D) Manually review findings and update the criteria based on anecdotal feedback.

**Correct: C**

**Why C:** Task 4.4 explicitly requires the `detected_pattern` field for systematic FP analysis. This enables quantitative analysis: "60% of detected_pattern = 'X' are FP, so refine the prompt for X or disable X temporarily."

**Why not the others:**
- A) Confidence scores are poorly calibrated.
- B) Consensus suppresses real bugs that are missed in some runs.
- D) Anecdotal feedback is unreliable; quantitative analysis is better.

---

## Quick Reference Cheat Sheet

**CLI & Invocation**
- Non-interactive: `-p` flag (or `--print`), not `CLAUDE_HEADLESS` env var, not `--batch` flag, not stdin redirection.
- Hanging in CI: add `-p` flag to the invocation.

**Structured Output**
- Use `--output-format json` + `--json-schema` for machine-parseable findings.
- JSON schema validates output structure, eliminates parse ambiguity, supports `detected_pattern`.
- Schema should include: file_path, line_number, severity, category, issue, suggested_fix, detected_pattern.

**Context & CLAUDE.md**
- CLAUDE.md provides project context: testing standards, fixtures, review criteria, session isolation rules.
- Refresh CLAUDE.md with updated standards when conventions change.

**False Positive Reduction**
- Explicit criteria > "be conservative" or "high confidence only" (Task 4.1).
- List exactly which categories to report (bugs, security) and skip (style, naming).
- Define severity criteria with concrete code examples per level.
- Include 2-4 few-shot examples for ambiguous cases (Task 4.2).
- Temporarily disable high-FP categories while improving prompts.

**Multi-File Review**
- Per-file passes: each file independent, no retained context across files (Task 1.6).
- Cross-file integration pass: explicitly focus on data flow, type contracts, dependencies.
- NOT: single pass on all files (dilutes attention). NOT: bigger model (adds noise). NOT: consensus runs (suppresses real bugs).

**Session Isolation**
- Independent review instance (fresh context) catches more bugs than self-review in same session (Task 4.6).
- If code is generated in session A, review in session B (independent instance).

**Re-Review on New Commits**
- Include prior findings in re-review prompt (Task 3.6).
- Instruct: "Report only new issues or still-unaddressed prior ones. Don't re-flag already-fixed issues."
- Prevents duplicate comments.

**Test Generation**
- Include existing test files as context (Task 3.6).
- Instruct: "Focus on gaps: new functions added, edge cases not yet covered in existing tests."

**Batch API**
- Appropriate: non-blocking, latency-tolerant (overnight, weekly). Cost: 50% savings. Latency: up to 24 hours.
- NOT appropriate: blocking pre-merge checks. Latency SLA: none.
- Sync API for pre-merge (completes in ~5 seconds). Batch for overnight reports.
- `custom_id`: correlation only, not ordering. Resubmit failed IDs only.
- No multi-turn tool calling within a single batch request.
- Refine prompts on sample before bulk batch.

**Pattern Analysis**
- `detected_pattern` field tracks which constructs trigger findings (Task 4.4).
- Enables systematic FP analysis: "Of all findings with pattern X, what percent are FP?"
- Drives iterative prompt improvement.

**Gotchas to Avoid**
- Don't use `--batch` flag (doesn't exist). Don't use `CLAUDE_HEADLESS` env (doesn't exist).
- Don't use batch for pre-merge checks (no SLA).
- Don't rely on confidence scores (poorly calibrated).
- Don't run review 3 times and consensus (suppresses real bugs).
- Don't ask developers to chunk PRs (fix the review system, not the workflow).
- Don't use bigger model to fix attention dilution (decomposition is the fix).
- Don't same-session review code generated in same session (session isolation required).
- Don't re-review without prior findings context (creates duplicate comments).
- Don't test-gen without existing-test context (creates duplicate tests).
