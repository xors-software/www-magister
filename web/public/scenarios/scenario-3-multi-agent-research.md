# Scenario 3: Multi-Agent Research System

## The Scenario

> You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialized subagents: one searches the web, one analyzes documents, one synthesizes findings, and one generates reports. The system researches topics and produces comprehensive, cited reports.

Primary domains tested: **Domain 1: Agentic Architecture & Orchestration (27%)**, **Domain 2: Tool Design & MCP Integration (18%)**, **Domain 5: Context Management & Reliability (15%)**.

---

## What's Actually Being Tested

This scenario tests your ability to architect a multi-subagent system where **isolation, context passing, tool distribution, and error propagation are critical**. The exam focuses on five core skills:

### Task 1.2 - Coordinator-Subagent Orchestration
- Hub-and-spoke routing: all inter-subagent communication flows through the coordinator.
- Recognizing overly narrow task decomposition (Q7 root cause pattern).
- Dynamic subagent selection based on query complexity (don't always invoke the full pipeline).
- Iterative refinement: coordinator evaluates gaps in synthesis output and re-delegates targeted follow-up queries.

### Task 1.3 - Subagent Invocation, Context Passing, Spawning
- The `Task` tool must be present in `allowedTools` for the coordinator.
- Subagent context is **explicitly provided in the prompt**; no automatic inheritance from coordinator history.
- `AgentDefinition` configures role, system prompt, and tool restrictions per subagent type.
- **Parallel spawning** means emitting multiple `Task` calls in a **single coordinator response** (not across sequential turns).
- Structured data formats preserve attribution (URLs, doc names, page numbers, dates) alongside content.

### Task 1.6 - Task Decomposition Strategies
- Fixed sequential pipelines vs. adaptive decomposition.
- Split large research into specific, focused queries; avoid vague "learn everything about X" tasks.
- For broad topics, decompose into aspects (visual arts → fine arts, graphic design, photography) and verify coverage before synthesis.

### Task 2.3 - Tool Distribution & Scoped Cross-Role Tools
- Too many tools degrade selection; restrict each subagent to 4-5 tools per role.
- Web search agent gets web tools; document analysis gets document tools.
- Synthesis agent gets **scoped cross-role tool** (e.g., `verify_fact`) for high-frequency simple lookups (85% of cases); complex verification routes back through coordinator.
- Avoid giving synthesis agent full web toolkit; that causes mission creep and conflicts with separation of concerns.

### Task 2.2 - Structured Error Responses
- Distinguish access failure (timeout, network) from valid empty result (successful query, no matches).
- Return structured error context: failure type, attempted query, partial results, alternatives.
- Local recovery within subagent for transient failures; propagate unresolvable errors + context upward.

### Task 5.3 - Error Propagation Across Multi-Agent Systems
- Structured error context enables coordinator recovery; generic statuses ("search unavailable") hide context.
- Anti-patterns: silent suppression, workflow termination on single failure, generic error statuses.

### Task 5.6 - Provenance and Uncertainty in Multi-Source Synthesis
- Claim-source mappings must survive summarization steps intact.
- Conflicting statistics: annotate with both sources, don't arbitrarily pick one.
- Include publication/collection dates to avoid temporal misinterpretation.
- Coverage annotations flag which aspects are well-supported vs. have gaps.

---

## Reference Architecture: How to Build This

### Hub-and-Spoke vs. Pipeline

Hub-and-spoke is the canonical pattern for this scenario:

- **Hub-and-spoke (correct):** All subagent communication routes through coordinator. Coordinator owns task decomposition, error handling, and gap detection. Subagents are stateless workers.
- **Pipeline (wrong for this):** Agent A → Agent B → Agent C in sequence. Information loss in handoffs. No visibility into failures. Gap detection is implicit, not explicit.

Hub-and-spoke wins because:
1. **Observability:** Coordinator sees all outputs and can judge coverage.
2. **Iterative refinement:** Coordinator can re-delegate if synthesis reveals gaps.
3. **Error recovery:** Coordinator decides how to handle individual agent failures without terminating the entire workflow.

### Coordinator Responsibilities

The coordinator's main loop:

```
1. Parse user query.
2. Decompose into targeted research tasks for specific subagents.
   - For broad topics: decompose into distinct aspects (not a single vague query).
   - For narrow topics: may skip some subagents entirely.
3. Emit Task calls (multiple, in parallel, in a single response).
4. Receive subagent summaries + structured findings (with metadata).
5. Evaluate synthesis output:
   - Are all major aspects covered?
   - Are conflicting claims annotated with sources?
   - Are dates included for temporal data?
6. If gaps detected: re-decompose, re-delegate targeted follow-up queries.
7. Invoke synthesis subagent (may be multiple times if gaps are addressed).
8. Generate final report.
```

### AgentDefinition for Each Subagent Type

#### Web Search Subagent
```
name: web-search-agent
description: "Search and analyze web sources. Return structured results with URLs, publication dates, and key findings."
tools: ["WebSearch", "WebFetch"]
model: "sonnet"

System Prompt:
You are a research assistant specializing in web search. Your role is to find credible sources on a given topic and extract key information.

Output Format:
1. Search queries executed
2. Results found, structured as:
   - Claim/Finding
   - Source URL
   - Publication Date
   - Excerpt/Evidence
3. Coverage: Which aspects of the query were covered?
4. Gaps: Which aspects could not be found?
5. Obstacles: Timeouts, blocked sources, or queries that returned no results.
```

#### Document Analysis Subagent
```
name: document-analysis-agent
description: "Analyze uploaded documents or files. Extract facts, statistics, and structured data with precise citations."
tools: ["Read", "Glob", "Grep"]
model: "sonnet"

System Prompt:
You are a document analyst specializing in information extraction. Your role is to read documents and extract factual claims, statistics, and structured data.

Output Format:
1. Document(s) analyzed
2. Key findings, structured as:
   - Claim/Data Point
   - Page Number / Location
   - Source Document
   - Context/Evidence
3. Conflicts: Contradictory claims within or across documents
4. Temporal Data: Include dates, time periods, or version numbers
5. Coverage: Which aspects of the document set were analyzed?
```

#### Synthesis Subagent
```
name: synthesis-agent
description: "Synthesize findings from multiple sources. Preserve claim-source mappings. Annotate conflicts. Flag gaps."
tools: ["verify_fact"] # Scoped cross-role tool only
model: "sonnet"

System Prompt:
You are a synthesis specialist. Your role is to integrate findings from multiple sources into a coherent narrative.

CRITICAL: You must preserve claim-source mappings. When merging findings, annotate each claim with its source(s). If sources conflict, include both with attribution.

Include publication/collection dates for temporal data to prevent misinterpretation.

Output Format:
1. Synthesized Narrative:
   - Well-Established Findings (found in multiple, independent sources)
   - Findings with Single Source (note the source)
   - Contested/Conflicting Findings (annotate with both sources + dates)
2. Coverage Assessment:
   - Which aspects are well-supported?
   - Which aspects have gaps or limited sources?
3. Recommendations for Gap Filling:
   - Are there specific aspects that need additional research?
4. Limitations and Caveats
```

#### Report Generation Subagent
```
name: report-generator-agent
description: "Generate polished final reports with proper citations and formatting."
tools: ["Read"] # Read prior findings for context
model: "sonnet"

System Prompt:
You are a professional report writer. Your role is to format synthesized research into a polished, citeable report.

Use appropriate content type rendering: tables for financials/comparisons, prose for narrative, structured lists for technical details.

Output Format:
[Structured markdown with proper citations throughout]
```

### The Task Tool Requirement

Per the exam guide (Task 1.3), the Agent SDK provides a `Task` tool for spawning subagents. The coordinator must have `"Task"` in its `allowedTools` array. The reference architecture below reflects documented patterns; verify against the current Agent SDK documentation for exact JSON structure and field names.

Example structure:

```json
{
  "type": "tool",
  "name": "Task",
  "input": {
    "description": "Brief one-line description of the subagent to invoke",
    "prompt": "Detailed prompt to the subagent, including:",
    "allowedTools": ["WebSearch", "WebFetch"],
    "model": "sonnet"
  }
}
```

### Parallel Spawning

Spawn multiple subagents in a **single coordinator response**. Emit all `Task` calls together:

```
Coordinator decides:
- Invoke web-search-agent for current statistics
- Invoke document-analysis-agent for historical context
- Invoke web-search-agent again (parallel) for legal/regulatory information

Response includes THREE Task calls, all at once.
Wait for all three summaries before proceeding to synthesis.
```

**Anti-pattern:** Spawning subagents sequentially across multiple turns. This loses the parallel efficiency and violates the context isolation model.

### Context Passing

Subagent prompts must include complete prior findings, not just summaries:

```
You are analyzing [topic].

Here are findings from prior research phases:

WEB_SEARCH_PHASE_1:
- Claim: Global population is X
  Source: https://worldbank.org/data
  Date: 2024
  Excerpt: "According to World Bank data..."

DOCUMENT_ANALYSIS_PHASE_1:
- Historical context from [document name, page 3]:
  "In 1990, the figure was..."

Your task: [specific research goal]
Focus on aspects not yet covered: [list gaps]
```

Use structured formats with **metadata (URLs, doc names, page numbers, dates) alongside content**. This preserves attribution through the synthesis step.

### Tool Distribution Strategy

- **Web Search Agent:** `WebSearch`, `WebFetch`. No document tools. No synthesis tools.
- **Document Analysis Agent:** `Read`, `Glob`, `Grep`. No web tools. No synthesis tools.
- **Synthesis Agent:** `verify_fact` only (scoped cross-role tool for simple fact-checking). No document read, no web search.
- **Report Generator:** `Read` (to load synthesized findings). No editing, no execution.

**Scoped Cross-Role Tool Example:**
```
Tool: verify_fact
Input: { "claim": "string", "sources": ["url1", "url2", ...] }
Output: {
  "matches": bool,
  "confidence": "high" | "medium" | "low",
  "contradictions": ["if any"]
}

Use case (85%): Synthesis agent has a disputed claim; needs quick confirmation.
Complex case (15%): Verification requires deep investigation → coordinator re-delegates to web-search-agent.
```

### Error Propagation

When a subagent encounters an error, return **structured error context**, not a generic status. Per the exam guide (Task 2.2), structured errors should include `errorCategory` (transient, validation, business, permission), `isRetryable`, and human-readable description. Below is an illustrative example with additional context fields:

```
{
  "errorCategory": "transient",
  "isRetryable": true,
  "attempted_query": "global warming statistics 2024",
  "partial_results": [
    { "source": "url1", "status": "success", "finding": "..." }
  ],
  "alternatives_tried": [
    "Query with fewer filters",
    "Regional data instead of global"
  ],
  "description": "Request timed out; partial results collected. Recommend retry with adjusted parameters or use alternatives."
}
```

The coordinator reads this and decides:
- Retry with adjusted query parameters?
- Use partial results and flag in synthesis?
- Mark this aspect as having limited coverage?

**Anti-patterns:**
- Generic "search unavailable" hides the actual problem.
- Empty results returned as `{ "status": "success", "results": [] }` conflates "no matches" with "tool failure."
- Terminating the entire workflow on a single subagent failure (continue with other subagents; flag gaps in synthesis).

### Iterative Refinement Loop

After synthesis:

```
1. Coordinator reads synthesis output.
2. Checks coverage annotations:
   "Visual Arts: well-supported (5 sources)"
   "Graphic Design: single source"
   "Photography: gap detected"
3. If gaps exist:
   a. Re-decompose: identify which subagents should address gaps.
   b. Re-delegate: send new Task calls with focused queries on gap areas.
   c. Collect new findings.
   d. Re-invoke synthesis with updated findings.
4. Repeat until coverage is satisfactory.
```

### Provenance: Claim-Source Mappings

Subagents output **structured findings** with metadata:

```
findings: [
  {
    "claim": "Visual art enrollment increased 15% in 2023",
    "sources": [
      {
        "url": "https://nea.gov/data",
        "publication_date": "2024-01",
        "excerpt": "According to NEA Survey, visual art courses..."
      },
      {
        "document": "enrollment_report.pdf",
        "page": 12,
        "excerpt": "15% increase reported"
      }
    ],
    "confidence": "high"
  }
]
```

**Synthesis preserves this structure.** When merging into narrative prose:

```
According to the National Endowment for the Arts (2024), visual art enrollment
increased 15% in 2023 [cite: https://nea.gov/data]. This trend aligns with
internal enrollment reports from the period [cite: enrollment_report.pdf, p. 12].
```

**Conflicting claims example:**

```
Population estimate for City X in 2020:
- Source A (Census Bureau, 2021): 425,000
- Source B (Municipal Report, 2020): 412,000
- Annotation: Census Bureau data is methodologically rigorous and uses standard
  definitions; Municipal Report may use different geographic boundaries.
  Recommend Census data for policy decisions.
```

### Content Type Rendering

- **Financial data, comparisons:** Render as tables with proper column headers and units.
- **News, narrative findings:** Prose with inline citations.
- **Technical or procedural information:** Structured lists with step numbers and prerequisites.

---

## The Exam-Relevant Patterns (Must Internalize)

Cluster these patterns by domain. Memorize them; they predict ~70% of exam questions.

### Session State and Resumption (Domain 1, Task 1.7)

1. **Named session resumption (`--resume <session-name>`)** for cross-day research continuity. Prior tool results and findings persist.

2. **Session branching for divergent exploration.** When the coordinator has analyzed a codebase/topic and wants to compare two research approaches from that shared baseline, use session branching (per exam guide Task 1.7) to fork from a baseline.

3. **Resume vs. new + summary decision:** When files or topics change between sessions, a fresh start with a structured summary of prior findings is more reliable than resuming with stale tool results. Inform the resumed agent which files changed.

### Coordinator-Subagent Orchestration (Domain 1, Tasks 1.2, 1.3, 1.6)

1. **Narrow decomposition is the default failure mode for broad topics.** When asked to research "the arts," decomposing into only "visual art" misses architecture, music, literature. Coordinator must check topic breadth before task decomposition. **(Q7 root-cause pattern)**

2. **Subagent context isolation is real.** Subagents do not automatically inherit coordinator history. Pass findings explicitly in the prompt, using structured formats with metadata.

3. **Parallel spawning = multiple Task calls in ONE coordinator response.** Not multiple turns. Coordinator awaits all responses before proceeding.

4. **Hub-and-spoke routing = all communication through coordinator.** No direct subagent-to-subagent communication. Coordinator observes all outputs and detects gaps.

5. **Dynamic subagent selection.** Don't always invoke the full pipeline. For "find today's stock price," skip document analysis; invoke only web search.

6. **Iterative refinement loop.** Coordinator evaluates synthesis output for gaps, re-decomposes, re-delegates, repeats. The loop terminates when coverage is sufficient.

7. **Coordinator prompts specify goals + quality criteria, not step-by-step procedures.** Bad: "First search for X, then read document Y, then synthesize." Good: "Research global prevalence of condition X. Find statistics from at least 3 independent sources. Highlight any conflicting numbers."

### Tool Interface Design (Domain 2, Task 2.1)

Tool descriptions are the primary signal LLMs use for tool selection. For this scenario:

- **Web Search tool:** Should specify "return URLs and publication dates alongside findings" not just "search the web."
- **Verify Fact tool (scoped cross-role):** Should specify "quick fact-checking against provided sources (not web search); returns match / contradiction / unclear" to prevent mission drift.
- **Document Read tool:** Should specify "extract data points with precise line/page citations" not generic "analyze documents."
- **Distinguish similar tools via naming:** If synthesis and coordinator both need to reference source materials, call them `load_structured_findings` (synthesis) vs `fetch_raw_document` (coordinator) to disambiguate purpose.

**Anti-pattern:** Generic descriptions like "analyze content" or "extract information" cause misrouting. Tools with overlapping names (e.g., two agents each with "analyze_document") cause the model to confuse which tool to use.

### MCP Server Integration (Domain 2, Task 2.4)

For multi-agent research systems, MCP servers can expose resources (data catalogs) to reduce exploratory tool calls:

- **Research catalog via MCP resource:** Instead of having web-search-agent execute 20 queries to discover available datasets, MCP server exposes a resource listing curated research sources (academic databases, government data, news archives). Agent can consult the resource first, then use WebSearch/WebFetch efficiently.
- **Project-level `.mcp.json`** for shared team research tools; user-level `~/.claude.json` for experimental servers.
- **Environment variable expansion** for credentials: `${RESEARCH_API_KEY}` in .mcp.json so secrets aren't committed.

This is less critical for Scenario 3 than tool distribution, but coordination with upstream MCP servers improves research efficiency.

### Tool Distribution (Domain 2, Task 2.3)

8. **Scoped cross-role tool (e.g., `verify_fact`) for high-frequency needs.** Synthesis agent uses a narrowly scoped verification tool for 85% of fact-checks (simple validation against known sources); 15% of complex cases route back to coordinator for full investigation. This preserves separation of concerns while reducing latency.

9. **Tool overload degrades selection.** Giving synthesis agent 18 tools (web search, document read, bash, etc.) makes the model uncertain which tool to use. Restrict to 4-5 tools per role; synthesis typically needs only a scoped verification tool.

10. **Renaming tools to disambiguate.** If both web-search and document-analysis agents have a "analyze" tool, rename: `analyze_content` → `extract_web_results` (web agent) and `extract_data_points` (document agent).

11. **Splitting generic tools.** Instead of one `analyze_document` tool, use `extract_data_points`, `summarize_content`, `verify_claim_against_source`. Each has a clear purpose.

12. **Web search agent doesn't do synthesis.** Don't give synthesis agent web search tools; that causes it to search for new sources instead of integrating existing findings.

### Error Propagation (Domain 2/5, Tasks 2.2, 5.3)

13. **Structured error context > generic statuses.** Include failure type (timeout vs. empty result vs. invalid input), attempted query, partial results, and alternatives. Coordinator can then make recovery decisions.

14. **Distinguish access failure from valid empty.** A query that times out is different from a query that completes successfully with zero matches. Return different error objects.

15. **Local recovery for transient failures.** If a subagent hits a timeout, it retries with backoff (local decision). Only unresolvable errors propagate to coordinator with context.

16. **Single-failure doesn't terminate the workflow.** If document-analysis-agent fails, web-search-agent still completes. Coordinator synthesizes from partial results and flags gaps in coverage.

### Context Preservation in Long Research (Domain 5, Task 5.1)

Multi-agent research systems accumulate findings across many subagent calls. Context must be preserved:

- **Structured case facts block:** Extract transactional facts (research topic, search dates, coverage goals) into a persistent block included in each subsequent prompt. Prevents "lost in the middle" effect where details fade through summarization.
- **Don't summarize metadata:** When passing subagent findings to synthesis or coordinator, include complete structured data (URLs, page numbers, publication dates, excerpts) outside summarized prose. Summarization loses the structure needed for proper citation.
- **Trim verbose tool outputs:** If document-analysis-agent reads a 50-page document and extracts 100 claims, coordinator should trim to 10-15 relevant ones before passing to synthesis. Prevents context accumulation from drowning out quality signals.
- **Place key findings at start:** Structure aggregated research summaries with the most critical findings first, explicit section headers. Mitigates "lost in the middle" position effect in long inputs.

**Anti-pattern:** Coordinator accumulates raw subagent outputs without filtering; context window fills with irrelevant detail and synthesis quality degrades.

### Provenance and Conflict Handling (Domain 5, Task 5.6)

17. **Claim-source mappings preserved through synthesis.** Subagents output structured findings with URL, page number, date, excerpt. Synthesis carries this structure through to the final report.

18. **Conflicts: annotate with both sources, don't pick one.** If two sources give different statistics, include both with publication dates and methodological notes. Let the reader decide.

19. **Dates are critical for temporal data.** A claim that "unemployment is 5%" is meaningless without a date. Include publication date or data collection date in all findings.

20. **Coverage annotations flag gaps.** Synthesis output includes a section: "Well-supported: visual art (5 sources). Single-source: graphic design (1 source). Gaps: photography (0 sources)."

---

## Gotchas and Anti-Patterns

These are the traps the exam writers use to create hard questions. Memorize them.

### Architectural Gotchas

1. **Subagent inherits coordinator history without explicit context.** Wrong: assume the synthesis subagent has seen all prior web search results because they're in the conversation. Right: explicitly include summarized findings in the synthesis prompt.

2. **Spawning subagents sequentially across turns instead of parallel in one response.** Wrong: coordinator sends Task #1 (web search), waits for summary, then sends Task #2 (document analysis). Right: coordinator sends Tasks #1 and #2 together in a single response.

3. **Single-subagent-type pipeline.** E.g., "invoke web-search-agent twice in sequence for depth." This wastes parallelism. Use a single well-scoped query or split into multiple subagents (web search + document analysis).

4. **No gap detection; assumes initial decomposition is complete.** Coordinator decomposes, delegates, receives synthesis, and publishes report without checking if all aspects are covered. This causes narrow coverage (Q7 trap).

5. **Coordinator gives step-by-step procedural prompts.** Bad: "Search for X, then for Y, then summarize Z." Good: "Research all aspects of topic X. Identify at least 3 independent sources per aspect. Flag conflicting claims."

### Tool Distribution Gotchas

6. **Synthesis agent given full web search toolkit.** This violates separation of concerns. Synthesis agent should integrate existing findings, not search for new ones. Use scoped `verify_fact` tool for simple checks.

7. **Speculative caching.** Trying to predict which facts synthesis will need and preloading them into the subagent prompt. This fails because synthesis discovers unexpected angles. Instead, use iterative refinement: synthesis flags gaps, coordinator re-delegates.

8. **Batched verification creates blocking dependencies.** Synthesis agent tries to verify all disputed claims at once via a `batch_verify_facts` tool. But synthesis needs to flag disputes mid-stream (while writing), not at the end. Use streaming `verify_fact` calls.

### Error Handling Gotchas

9. **Generic error statuses: "search unavailable," "tool failed," "error."** These hide the actual problem. Is it a timeout (retry)? Invalid input (coordinator fault)? No matches (valid empty)? Each requires different recovery.

10. **Empty results returned as success.** A query that completes with zero matches returns `{ "status": "success", "results": [] }`. Synthesis can't distinguish "we looked and found nothing" from "the tool crashed silently." Return `{ "status": "success_empty", "query": "...", "reason": "no sources matched filter" }`.

11. **Workflow termination on single subagent failure.** If web-search-agent times out, coordinator still invokes document-analysis-agent and synthesis. The final report flags "web sources unavailable; based on X documents analyzed."

### Provenance Gotchas

12. **Source attribution lost during summarization.** Web-search-agent returns detailed claim-source pairs. But coordinator's summary of the findings loses the URLs. Synthesis then can't cite sources. Fix: coordinator includes full structured findings in synthesis prompt, not summaries.

13. **Synthesis agent arbitrarily picks one statistic when sources conflict.** E.g., two sources give different unemployment rates. Synthesis picks the higher one without annotation. Instead: include both, note publication dates, mention methodological differences.

14. **Date-stripped findings causing temporal contradictions.** Coordinator receives: "Employment rate is 85%." Is this 2020 or 2024? When synthesis compares two "conflicting" claims, they might be from different years. Require all temporal findings to include publication/collection date.

15. **Coverage gaps not detected.** Coordinator decomposes query into 3 aspects, receives synthesis, publishes without checking which aspects are actually covered. Synthesis should explicitly report: "Aspect 1: well-supported (5 sources). Aspect 2: gap (no sources found)."

### Prompting Gotchas

16. **"You are an expert researcher."** This adds no value; Claude already has research knowledge. Prompts should specify output format, citation requirements, and conflict handling. Don't claim expertise.

17. **Synthesis agent given a "just integrate everything" prompt.** This causes it to merge conflicting claims into vague sentences that obscure disagreement. Instead: "Preserve conflicting claims with attribution. Use dates to distinguish temporal differences from genuine conflicts."

18. **Coordinator doesn't specify re-delegation triggers.** Synthesis doesn't know when coordinator expects re-delegation. Instead, coordinator prompt should say: "If synthesis output shows gaps in aspects X or Y (check coverage annotations), re-delegate focused queries to web-search-agent."

---

## What a Good Answer Accounts For

Use this decision framework when answering exam questions on this scenario.

### Root-Cause Analysis (Q7 Pattern)

When a question describes output failure, trace the fault:

- "Reports cover only visual arts; researcher asked for 'all art forms.'" Root cause: **Coordinator's task decomposition was too narrow.** Subagents worked correctly within scope; the scope itself was the defect.
- "Synthesis doesn't cite sources." Root cause: **Coordinator didn't include structured findings (with metadata) in synthesis prompt.** Subagents collected sources correctly; coordinator failed to pass them through.
- "Conflict between two statistics not flagged." Root cause: **Synthesis agent didn't receive both sources with dates,** OR **synthesis agent arbitrarily picked one instead of annotating both.**

**Key insight:** Symptoms point downstream; faults often lie upstream. Ask: "Which component had incomplete information or misguided instructions?"

### Error Propagation (Q8 Pattern)

Question describes a subagent failure. Choose recovery:

- **Bad:** Retry forever. Subagent timeout doesn't become un-timed-out by retrying.
- **Bad:** Suppress error (empty as success). Coordinator can't tell "no matches" from "tool crashed."
- **Bad:** Terminate workflow. Other subagents and synthesis can proceed with partial results.
- **Good:** Structured error context (failure type, attempted query, partial results). Coordinator reads context and decides: use partial results, adjust query, skip aspect, or flag gap in coverage.

### Tool Distribution (Q9 Pattern)

Question describes a tool assignment problem:

- Synthesis agent spends 40% latency waiting for coordinator to verify facts. Solution: **give synthesis agent a scoped verification tool (e.g., `verify_fact`) for simple lookups** (handles 85% of cases locally).
- Synthesis agent given full web search toolkit; model misuses it to search for new sources instead of integrating findings. Solution: **remove web tools; add scoped verification tool only.**
- Synthesis needs to verify 30 claims in parallel; batched tool call creates blocking dependency. Solution: **emit parallel verification calls as synthesis writes, not batch at end.**

### Context and Prompting

- Subagent question: "Should coordinator pass full prior findings or just a summary?" Answer: **Full structured findings with metadata (URLs, dates, page numbers).** Summaries lose attribution.
- Prompting question: "Coordinator prompt should tell synthesis to?" Answer: **"Integrate findings, preserve claim-source mappings, annotate conflicts with both sources, include dates for temporal data."** Not: **"You are an expert synthesizer."**

### Provenance and Conflict

- "Two sources disagree on statistic X." Best handling: **Annotate both with publication dates, note methodological differences, let reader decide.** Not: **Pick the newer one.** Not: **Average them.**
- "Claim appears in synthesis but source URL is missing." Root cause: **Coordinator passed only summary text to synthesis, not structured claim-source pairs.** Fix: coordinator includes full structured findings.

---

## Practice Questions

These 10 questions follow exam patterns Q7, Q8, Q9 from the official exam guide. Questions 7, 8, and 9 below are canonical patterns that define high-confidence exam items; study them especially carefully. Read carefully; all are designed to have plausible wrong answers.

### Question 1 (Domain 1, Task 1.2 - Root Cause)

**Stem:** A coordinator researches "modern business management techniques." It decomposes into subagent queries: (1) "lean methodology," (2) "agile frameworks." Final report covers only agile and lean, missing management by objectives, total quality management, and other major methodologies. Which is the root cause?

A) Web-search-agent timed out on queries it didn't attempt.
B) Coordinator's task decomposition was too narrow for a broad topic.
C) Synthesis agent arbitrarily dropped findings on omitted methodologies.
D) Document-analysis-agent returned empty results for TQM.

**Correct: B.** The coordinator failed to decompose the broad topic "modern business management" comprehensively. It chose two specific methodologies but didn't identify all major categories before delegating. Subagents worked correctly within their assigned scope; the scope itself was inadequate.

Why others are wrong: A (agent never ran = not root cause). C (synthesis received nothing to synthesize on omitted topics). D (document agent wasn't asked to analyze TQM).

---

### Question 2 (Domain 5, Task 5.3 - Error Propagation Choice)

**Stem:** Web-search-agent encounters a timeout while searching for "renewable energy statistics 2024." It currently returns `{ "status": "error", "message": "search unavailable" }`. Coordinator receives this and terminates the entire workflow. What's the better error response?

A) `{ "errorCategory": "transient", "isRetryable": true, "attempted_query": "renewable energy statistics 2024", "partial_results": [{ "url": "eia.gov", "stat": "wind 12% growth" }], "alternatives_tried": ["retry with regional focus", "use 2023 data"], "description": "Request timed out before completion" }`

B) `{ "status": "error", "message": "search unavailable - please retry manually" }`

C) `{ "status": "success", "results": [], "reason": "no matches found" }`

D) Retry automatically 5 times with exponential backoff before reporting to coordinator.

**Correct: A.** Structured error context per exam guide Task 2.2: includes `errorCategory` (transient, not access or validation), `isRetryable` flag, attempted query, partial results collected before timeout, and alternatives. Coordinator can then decide: use partial results, adjust query scope, skip this aspect, or flag gap in synthesis output.

Why others are wrong: B (generic message; coordinator can't make informed decisions). C (conflates empty result with timeout; prevents proper recovery). D (retrying the same timed-out query won't fix the timeout; local retry only helps for transient network hiccups, not actual timeouts).

---

### Question 3 (Domain 2, Task 2.3 - Tool Distribution with Scoped Cross-Role)

**Stem:** Synthesis subagent synthesizes 100 findings across 8 sources. For each finding, it needs to verify that no other source contradicts it. Today's approach: synthesis emits a `verify_claim` call for each of 100 claims, routed back to coordinator which re-delegates to web-search-agent. Latency is 40% of total system time. Which improves latency most?

A) Give synthesis agent the full web-search toolkit so it verifies locally without coordinator round-trips.

B) Give synthesis agent a scoped `verify_fact` tool that accepts a claim + list of known sources, returns "matches / contradicts / unclear." For the 85% of checks that resolve, synthesis completes locally. For edge cases (15%), synthesis still routes to coordinator.

C) Batch all 100 verification requests into a single coordinator call; coordinator sends all to web-search-agent in parallel.

D) Pre-cache all likely verification needs before synthesis starts.

**Correct: B.** Scoped cross-role tool solves 85% of verifications (simple fact-checking against known sources) locally, eliminating coordinator round-trip latency. Complex cases (15%) still route to coordinator, preserving separation of concerns. Synthesis doesn't drift into searching for new sources.

Why others are wrong: A (full toolkit causes mission creep; synthesis drifts into research instead of integration; violates separation of concerns). C (batched verification creates blocking dependency; synthesis needs to verify mid-stream as it writes, not at the end). D (speculative caching fails because synthesis discovers unexpected verification needs as it writes; unpredictable coverage).

---

### Question 4 (Domain 1, Task 1.3 - Parallel Spawning)

**Stem:** Coordinator decides it needs findings from three subagents: (1) web search for current statistics, (2) document analysis for historical context, (3) a second web search for regulatory information. How should the coordinator invoke them?

A) In sequence across three separate responses: Task #1 (await summary), then Task #2 (await summary), then Task #3.

B) All three in a single coordinator response, as three separate `Task` tool calls. Coordinator awaits all three summaries before proceeding.

C) Tasks #1 and #2 in response 1, Task #3 in response 2 after Task #2 completes.

D) Invoke Task #1 (web search). After it completes, have it invoke Task #2 (document analysis) directly, then Task #3.

**Correct: B.** Parallel spawning = multiple `Task` calls in a single coordinator response. Coordinator submits all three tasks and awaits all three summaries. This preserves parallelism and respects the hub-and-spoke model (all routing through coordinator, not peer-to-peer).

Why others are wrong: A (sequential across turns; loses parallelism). C (splits across two responses; loses parallelism). D (subagent-to-subagent invocation violates hub-and-spoke; breaks observability and error handling).

---

### Question 5 (Domain 1, Task 1.3 - Context Passing)

**Stem:** Coordinator completed web-search phase (5 findings with URLs and dates). Now it invokes synthesis subagent. What should the synthesis prompt include?

A) A summary: "Web search found 5 findings related to renewable energy. Proceed to synthesize."

B) The full structured findings: Each finding includes claim, source URL, publication date, excerpt. In structured format: `[ { "claim": "...", "sources": [{ "url": "...", "date": "2024-01", "excerpt": "..." }] }, ... ]`

C) Just the URLs, no excerpts or dates (to save tokens).

D) A high-level narrative summary of the web findings (coordinator writes a paragraph).

**Correct: B.** Synthesis needs complete structured findings with metadata (URLs, dates, page numbers, excerpts) to preserve attribution through synthesis into the final report. Summaries and narratives lose the structure needed for proper citation.

Why others are wrong: A (summary loses attribution; synthesis can't cite sources). C (URLs without dates or excerpts prevent proper conflict detection and citation). D (narrative converts structured data to prose; synthesis can't extract citations).

---

### Question 6 (Domain 5, Task 5.6 - Conflict Handling)

**Stem:** Two sources give conflicting statistics: Source A (2024 report) says "unemployment 3.8%," Source B (2023 report) says "unemployment 4.2%." Synthesis agent needs to report this. What's the best approach?

A) Pick Source A (newer data) and ignore Source B.

B) Average them: "approximately 4.0%."

C) Annotate both: "Source A (2024) reports 3.8%; Source B (2023) reports 4.2%. The difference reflects year-over-year improvement." Include publication dates to clarify whether this is a temporal change or a methodological disagreement.

D) Report only the statistic with higher confidence score; drop the other.

**Correct: C.** Include both claims with publication dates, publication dates let readers understand whether the difference is temporal or methodological. Synthesis preserves claim-source mappings and annotates conflicts; doesn't suppress information.

Why others are wrong: A (loses data; reader can't see the trend). B (obscures the actual values and the sources). D (confidence scores are often poorly calibrated; loses information unnecessarily).

---

### Question 7 (Domain 1, Task 1.2 - Narrow Decomposition Root Cause)

**Stem:** A coordinator researches "contemporary art movements." It decomposes into subagent queries: (1) "abstract expressionism," (2) "pop art." The final report covers only those two movements, omitting surrealism, color field painting, constructivism, and kinetic art. Researchers expected comprehensive coverage. Which is the root cause?

A) Web-search-agent timed out on several queries it attempted.

B) Coordinator's task decomposition was too narrow for a broad topic.

C) Synthesis agent arbitrarily dropped findings on omitted movements.

D) Document-analysis-agent returned empty results for constructivism and kinetic art.

**Correct: B.** The coordinator failed to decompose the broad topic "contemporary art movements" comprehensively. It chose two specific movements but didn't identify and delegate research on all major categories (surrealism, color field, constructivism, kinetic) before delegating. Subagents worked correctly within their assigned scope; the scope itself was inadequate. This is the root cause of incomplete coverage.

Why others are wrong: A (if agent timed out, coordinator would see an error; narrow decomposition is the issue, not timeout). C (synthesis can only synthesize findings it receives; if topics weren't assigned, synthesis has nothing to synthesize on them). D (document agent wasn't asked to analyze those movements).

---

### Question 8 (Domain 5, Task 5.3 - Distinguishing Error Categories)

**Stem:** Document-analysis-agent needs to verify whether two conflicting claims come from the same source document or different documents. Web-search-agent reports a timeout on one query. Document-analysis-agent returns a file-not-found error on another. Both currently return generic "error" statuses. How should subagents categorize these errors to enable coordinator recovery?

A) Both should return `{ "errorCategory": "transient", "isRetryable": true, ... }` so coordinator knows to retry both.

B) Timeout is transient (retry); file-not-found is validation (don't retry, escalate). Return different `errorCategory` values and let coordinator decide recovery per category.

C) Both are non-retryable; return `isRetryable: false` and propagate immediately.

D) Return `isRetryable: false` for both; retrying prevents finding alternative sources.

**Correct: B.** Per exam guide Task 2.2, error categories (transient, validation, business, permission) enable coordinator to make recovery decisions. Timeout is transient (network may recover); file-not-found is validation (wrong path; won't recover via retry). Coordinator sees different categories and decides: retry timeout with backoff, but escalate file-not-found as a coordination error (wrong file passed to subagent).

Why others are wrong: A (file-not-found is not transient; retrying won't help). C (transient errors warrant local retry before propagation). D (distinguishing error types is the whole point of structured errors).

---

### Question 9 (Domain 2, Task 2.3 - Tool Overload)

**Stem:** Synthesis subagent is given these tools: WebSearch, WebFetch, Read, Glob, Grep, bash, verify_fact, summarize_document, extract_entities, cross_reference_sources. It has 18 tools total. When asked to synthesize findings, it randomly misuses tools (searches for new sources instead of integrating; reads files instead of using prior findings). What's the root cause?

A) System prompt doesn't explicitly forbid new searches.

B) Tool overload: too many tools causes model uncertainty about tool selection. Restrict to 4-5 tools per role. Synthesis should have only a scoped verification tool (simple checks).

C) Subagent model is too weak (Haiku instead of Sonnet).

D) Synthesis needs a more detailed output format.

**Correct: B.** Too many tools (18 vs. 4-5) degrades tool selection. Model becomes uncertain which tool to use, leading to misuse. Synthesis role is narrow: integrate findings, preserve attribution, flag conflicts. It needs only a scoped verification tool for simple checks.

Why others are wrong: A (system prompt can influence but won't fully override tool overload). C (model weakness doesn't cause tool misuse; overload does). D (output format doesn't affect which tools are invoked).

---

### Question 10 (Domain 5, Task 5.3 - Local Recovery vs. Propagation)

**Stem:** Document-analysis-agent reads document X. File not found (disk I/O error). Should the subagent:

A) Retry the Read call with exponential backoff locally. If it succeeds, continue normally. If it fails after 3 retries, propagate structured error context to coordinator.

B) Immediately propagate error to coordinator without retrying.

C) Return empty results as success (assume the document is not essential).

D) Terminate the entire workflow; if document-analysis fails, research can't proceed.

**Correct: A.** Local recovery for transient failures (disk hiccups, temporary unavailability). If local retry succeeds, proceed normally. If it fails after N attempts (non-transient), propagate structured error context (failure type, attempted file, alternatives) to coordinator for higher-level decision.

Why others are wrong: B (skip local recovery; some transient failures are recoverable). C (suppress error; coordinator can't account for missing data). D (single failure doesn't terminate workflow; coordinator decides impact).

---

## Quick-Reference Cheat Sheet

Review these 20 bullets before the exam.

1. **Hub-and-spoke routing** - all subagent communication through coordinator.
2. **Parallel spawning** - multiple `Task` calls in one response, not sequential.
3. **Context isolation** - subagents get explicit context passed in prompt, no auto-inheritance.
4. **Narrow decomposition is the failure mode** - check topic breadth before decomposing; verify coverage after synthesis.
5. **Iterative refinement** - coordinator detects gaps, re-delegates, re-synthesizes until coverage is adequate.
6. **Structured error context** - per exam guide: errorCategory (transient/validation/business/permission), isRetryable, description, plus attempted query, partial results.
7. **Distinguish access failure from valid empty** - timeout ≠ zero matches; return different errorCategory values.
8. **Local recovery for transient** - retry within subagent; propagate unresolvable errors with context.
9. **Tool distribution** - 4-5 tools per subagent; scoped cross-role tool (e.g., verification) for high-frequency needs.
10. **Synthesis doesn't search** - remove web tools; add only scoped verification tool for simple fact-checks.
11. **Claim-source mappings preserved** - subagent outputs structured findings with URL, date, page number, excerpt.
12. **Synthesis annotates conflicts** - include both sources with dates; don't pick one.
13. **Dates for temporal data** - "unemployment 4.5%" is meaningless without a date.
14. **Coverage annotations** - synthesis output flags which aspects are well-supported, single-source, or gap.
15. **Prompts specify goals, not procedures** - "research X comprehensively" not "search for A then B then C."
16. **Coordinator passes full structured findings** - not summaries; synthesis needs metadata for citation.
17. **Single failure doesn't terminate workflow** - use partial results; flag gaps in synthesis.
18. **Renaming tools disambiguates** - `analyze_content` → `extract_web_results` vs `extract_data_points`.
19. **Splitting generic tools** - `analyze_document` → `extract_data_points`, `summarize_content`, `verify_claim_against_source`.
20. **Root cause questions: trace upstream** - symptoms point downstream; faults often lie in upstream decisions (decomposition, context passing, tool distribution).
