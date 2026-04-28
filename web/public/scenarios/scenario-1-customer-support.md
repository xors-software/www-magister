# Scenario 1: Customer Support Resolution Agent

## The Scenario

You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom Model Context Protocol (MCP) tools (`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`). Your target is 80%+ first-contact resolution while knowing when to escalate.

**Primary domains:** Agentic Architecture & Orchestration (D1), Tool Design & MCP Integration (D2), Context Management & Reliability (D5).

---

## What's actually being tested

This scenario is the canonical exam test for **programmatic enforcement vs probabilistic compliance**, **tool description design as the primary lever for reliability**, and **explicit escalation criteria with structured handoffs**.

The exam writers test D1 through multi-step workflow sequencing: whether you understand that tool call ordering has a non-zero failure rate when left to prompting alone (the `get_customer` before `process_refund` ordering issue in Q1). Task 1.4 (Multi-step workflows with enforcement and handoff) and Task 1.1 (Agentic loop lifecycle) are directly tested.

D2 is heavily tested via tool description clarity. The exam Q2 scenario is classic: two tools with minimal descriptions, agent picks the wrong one. Task 2.1 (Tool interface design) and Task 2.2 (Structured error responses) are the core. Expect questions that ask "what's the most effective first fix?" and the answer is "expand the tool descriptions" not "add few-shot" or "build a classifier."

D5 is tested through escalation calibration (Q3: why does explicit criteria + few-shot beat sentiment/confidence?) and context management (case facts block as a separate persistent layer to prevent numeric/date compression in summarization). Task 5.2 (Escalation and ambiguity resolution) is the primary target.

The pattern recurring across all three questions is: **when something needs deterministic behavior (ordering, escalation logic, error categorization), prompts have a non-zero failure rate and hooks/structured design beat prompts**. This is the foundational principle.

---

## Reference architecture: how to build this

### The Agentic Loop

The agent loop follows this structure:

```
1. User sends support request (text)
2. Agent reads request, inspects conversation history for context
3. Agent decides which tool(s) to call next (or whether to respond)
4. Claude API processes message + tools, returns stop_reason
5a. If stop_reason == "tool_use": execute requested tools, append results to history, loop to step 2
5b. If stop_reason == "end_turn": return agent response to user
```

This is model-driven, not hardcoded sequencing. The agent sees the conversation history and reasons which tool makes sense next. The risk: without tool description clarity or programmatic enforcement, this reasoning fails at non-zero rates.

### Tool Definitions: The Foundation

A well-designed tool definition tells the LLM when to call it and what it does. Here's the spectrum:

**BAD: Minimal descriptions**
```json
{
  "name": "get_customer",
  "description": "Get customer details"
}

{
  "name": "lookup_order",
  "description": "Look up an order"
}
```

Problem: The agent doesn't know whether "find my order" means `get_customer` or `lookup_order`. Both could plausibly apply. Result: ~10% misrouting.

**GOOD: Differentiated, prescriptive descriptions**
```json
{
  "name": "get_customer",
  "description": "Retrieve customer account information by email or phone. Returns verified customer ID, account status, contact info. Call this FIRST for any customer request to verify identity and get a stable customer ID. Required before any financial operations like refunds. Example: 'What's my account status?' or 'Verify my email is on file'."
}

{
  "name": "lookup_order",
  "description": "Search for a specific order by order number or customer ID. Returns order details (date, items, price, status). Use only after get_customer if you need specific order details. Example: 'Where's order #12345?' or 'What was in my order from January?'. Do not use to verify customer identity; use get_customer for that."
}
```

The difference: prescriptive descriptions tell the agent the purpose, example queries, sequencing hint ("call FIRST"), what NOT to use it for. This dramatically improves routing accuracy. Task 2.1 drill.

### Programmatic Enforcement: PrerequisiteGate Example

Prompting: "Check the customer's identity before processing refunds."
Result: ~12% of requests skip the identity check (as in exam Q1).

Programmatic gate (conceptual pattern):
```python
# Pseudocode showing the logical pattern.
# The Agent SDK implements this via hook registration (specific API
# varies; consult the SDK documentation for your language).

def prerequisite_gate_on_tool_call(tool_name, args):
    # Block process_refund until get_customer has been called
    # and returned a verified customer ID

    if tool_name == "process_refund":
        if not context.has("verified_customer_id"):
            raise PrerequisiteNotMet(
                "Customer identity must be verified via get_customer first. "
                "Call get_customer with customer email/phone."
            )
    return args
```

Or via PostToolUse hook to intercept and validate results:
```python
def on_tool_result(tool_name, result):
    # Example using the PostToolUse hook pattern
    if tool_name == "get_customer":
        # Validate and store the verified customer ID
        if not result.get("verified_id"):
            raise VerificationFailed("Customer identity could not be verified")
        context.set("verified_customer_id", result["verified_id"])
    return result
```

The gate makes compliance deterministic. Exam tests whether you choose this over system prompt wording or few-shot. Task 1.4 (multi-step enforcement) and Task 1.5 (hooks) cover this pattern.

### Tool Error Responses: Structured Categories

Generic response:
```json
{
  "error": "Operation failed"
}
```

Agent has no recourse. It retries indefinitely, hallucinates, or escalates prematurely.

Structured response (Task 2.2):
```json
{
  "isError": true,
  "errorCategory": "business",
  "isRetryable": false,
  "description": "Refund amount $750 exceeds policy limit of $500. Escalation required."
}
```

Or for transient errors:
```json
{
  "isError": true,
  "errorCategory": "transient",
  "isRetryable": true,
  "description": "Backend service temporarily unavailable. Retry in 5 seconds."
}
```

The structured error categories are: **transient** (timeout, service unavailable, retry will likely succeed), **validation** (bad input format, retry won't help without user providing better data), **business** (policy violation, insufficient funds, retry won't help, escalation needed), **permission** (insufficient access, need human review).

The agent's logic then becomes:
- Transient + isRetryable=true: retry the call
- Validation: ask user for clarification and retry
- Business: escalate with the reason
- Permission: escalate

### Escalation Handoff: Structured Data

When the agent decides to escalate, it must provide a human agent with context. The human doesn't have the conversation transcript (they may work a different shift, different queue). So:

Bad: "Please escalate this to a human."

Good (structured handoff):
```json
{
  "customer_id": "cust_abc123",
  "customer_name": "Alice Johnson",
  "customer_email": "alice@example.com",
  "issue_type": "billing_dispute",
  "root_cause": "Customer reports duplicate charge on 2026-04-15. lookup_order returned two entries with same items, overlapping dates. Possible system bug or duplicate submission.",
  "order_ids": ["ord_555", "ord_556"],
  "amounts": [49.99, 49.99],
  "attempted_resolution": [
    "Verified customer identity via get_customer",
    "Found two orders with identical items and overlapping timestamps",
    "Ran policy check: manual intervention required for suspected duplicates"
  ],
  "recommended_action": "Investigate backend order creation logs for 2026-04-15. If confirmed duplicate, issue one refund of $49.99."
}
```

This lets the human pick up the case without re-verifying identity or re-reading the conversation. Task 1.4.

### Multi-Concern Decomposition

A customer writes: "I was charged twice, and one of the items arrived damaged. I want a refund and a replacement."

Bad approach: Try to resolve both in one step. Context gets tangled, agent conflates refund reasoning with replacement reasoning.

Good approach (programmatic decomposition):
```python
# Agent decomposes the request
case_items = [
    {
        "concern": "duplicate_charge",
        "action": "lookup_order + process_refund",
        "escalation_trigger": "if amount > $500 or policy exception",
    },
    {
        "concern": "damaged_item",
        "action": "lookup_order + initiate_replacement",
        "escalation_trigger": "if item is discontinued",
    }
]

# Agent handles each in parallel or sequence, builds unified response
```

This keeps context clean and prevents the agent from confusing which order item is damaged vs charged twice. Task 1.4 (decompose multi-concern customer requests into distinct items).

### Context Management: Case Facts Block

Long support conversations can lose precision in summarization. "Customer wants refund for item from early April" compresses the actual date 2026-04-03, the order ID ord_888, the refund amount $127.50.

Solution (Task 5.1): Maintain a persistent **case facts block** outside the conversation history:

```
=== CASE FACTS (persistent across turns) ===
Customer ID: cust_abc123
Customer Name: Alice Johnson
Customer Email: alice@example.com
Primary Issue: Billing dispute
Order ID(s): ord_555, ord_556
Order Dates: 2026-04-15 (both)
Items: Widget A (x2)
Amounts: $49.99 each
Refund Requested: $49.99
Current Status: Investigating duplicate charge
=== END CASE FACTS ===

[Conversation history follows, but the agent always includes the case facts block in the system prompt for each API call]
```

The case facts block is:
- A separate context layer (not part of conversation history, so not subject to summarization loss)
- Refreshed after each turn with any new facts discovered
- Always prepended to the system prompt before each API call
- Concise (fact-value pairs, not prose)

This ensures Claude doesn't lose order IDs, amounts, or dates as the conversation progresses. Task 5.1.

---

## The exam-relevant patterns (must internalize)

1. **Programmatic prerequisite gates beat system prompts for deterministic sequencing** (Task 1.4). If `process_refund` must be preceded by `get_customer`, enforce it with a hook that raises an error if the prerequisite isn't met, not with prompt text. Prompt text has ~10% failure rate; hooks have 0% after validation.

2. **Tool descriptions are the primary lever for tool selection reliability, more effective than few-shot or classifiers** (Task 2.1). Expand descriptions to include input formats, example queries, when-to-use vs alternatives, before adding few-shot or building routing layers. Task 2.1 states this directly.

3. **Structured error categories (transient/validation/business/permission) with isRetryable flags beat generic "Operation failed" responses** (Task 2.2). This enables intelligent local recovery in the agent loop instead of escalating or retrying blindly.

4. **Escalation criteria must be explicit with few-shot examples, not sentiment-based or self-reported-confidence-based** (Task 5.2). The exam Q3 tests this: agent at 55% FCR because it escalates straightforward cases and attempts complex ones. The fix is explicit criteria + few-shot, not a classifier or sentiment analysis. Sentiment doesn't correlate with escalation need; policy gaps do.

5. **Structured handoff summaries (customer ID, root cause, recommendation) for human escalation, because humans lack transcript access** (Task 1.4). Hand off a JSON blob with factual details, not a prose summary that could be ambiguous or miss numbers.

6. **Case facts block (persistent, outside summarized history) for multi-turn support conversations** (Task 5.1). Prevents order IDs, amounts, dates from being compressed or lost as history accumulates. Refresh after each turn with discovered facts.

7. **Multi-customer match requires explicit additional identifier request, not heuristic selection** (Task 5.2). If `lookup_order` returns three matches (customer Alice Johnson is common), ask "Which of these three orders: order #111, #222, or #333?" Do not pick by heuristic (e.g., "newest order" or "largest amount"). Task 5.2 states this explicitly.

8. **Decompose multi-concern customer requests into distinct items (concern + action + escalation trigger) to prevent context tangling** (Task 1.4). Don't try to reason about "refund amount AND replacement item AND billing address correction" in one step; separate them logically and reason over each.

9. **PostToolUse hooks for normalization (Unix timestamp to ISO 8601, numeric status codes to enums) so downstream reasoning is uniform** (Task 1.5). If backend returns timestamps in different formats across different tools, normalize in a PostToolUse hook so the agent sees consistent data.

10. **Tool call interception hooks to block policy violations (e.g., refund > $500) and redirect to escalation, not prompts** (Task 1.5). Hooks give deterministic enforcement; prompts are probabilistic. Task 1.5 explicitly covers this.

11. **Scoped tool availability: each agent instance gets only the tools relevant to its role, reducing misuse** (Task 2.3). The support agent shouldn't have a `create_account` tool if it never creates accounts. Narrower tool set improves selection reliability.

12. **Error propagation upward: return structured error context (failure type, attempted query, partial results) to upstream coordinator, not generic status or silence** (Task 5.3). This lets the coordinator make intelligent recovery decisions.

13. **Explicit vs implicit escalation criteria: explicit criteria enable calibration, implicit (sentiment, confidence) don't** (Task 5.2). An agent that escalates on "customer sounds frustrated" has no way to improve; an agent that escalates on "policy does not cover this use case" can be tuned by policy changes. The exam tests whether you recognize this.

14. **Few-shot examples for escalation decision**: show the agent 2-4 realistic examples where each demonstrates the decision (escalate vs attempt) and the reasoning. This is more effective than prose instructions for ambiguous edge cases (Task 5.2).

15. **Avoid sentiment analysis and self-reported confidence as proxies for escalation decisions** (Task 5.2). Task 5.2 explicitly lists these as anti-patterns. Sentiment might be high but the case is straightforward; confidence might be high on a hard case. Use policy and capability criteria instead.

---

## Gotchas and anti-patterns

1. **Relying on agent self-reports of confidence to decide escalation.** Agent says "I'm 90% confident this is a fraud case." This is not reliable. Confidence is often highest on straightforward cases and can be high on cases outside the agent's capability. Real-world signal: explicit policy criteria (e.g., "escalate if refund is claimed within 7 days of high-ticket purchase > $1000"), not the agent's self-assessed confidence. Anti-pattern from Task 5.2.

2. **Using sentiment analysis (customer frustration, anger score) to trigger escalation.** A frustrated customer on a straightforward billing question should not be escalated just because sentiment is high; conversely, a calm customer with a policy exception should be escalated regardless of tone. Sentiment doesn't correlate with escalation need. Task 5.2 explicitly calls this out.

3. **Resolving multi-customer matches via heuristic (picking the "most recent" or "highest value" order when multiple customers have the same name).** This guarantees wrong outcomes in edge cases. The right move: ask the customer "Which of these three orders?" with concrete details. Task 5.2.

4. **Generic "Operation failed" error responses that hide the failure reason, retryability, and category.** The agent or upstream coordinator has no way to decide whether to retry, ask for user input, or escalate. Structured error with `errorCategory` and `isRetryable` is mandatory. Task 2.2.

5. **Tool descriptions that are too minimal or generic (e.g., "analyze order" without distinguishing from "verify customer").** This causes 10%+ misrouting. Expand descriptions with input formats, examples, boundaries. Task 2.1.

6. **Enforcing deterministic prerequisites (identity verification before refund) via system prompt instead of a programmatic gate.** Prompts have a non-zero failure rate; gates have zero (after validation). If the error has financial consequences, use a gate. Task 1.4 and Task 1.5.

7. **Context bloat: passing all 40 fields of a raw tool response to the model without trimming.** The model loses precision on what matters. Order response has `order_id`, `items`, `total`, `status`, `created_at`, `updated_at`, `shipping_address`, `billing_address`, `notes`, `metadata_v1`, `metadata_v2`, etc. but the agent only needs the first five for a refund decision. Trim in a PostToolUse hook. Task 5.1.

8. **Summarizing conversation history aggressively (condensing "refund of $127.50 for order #ord_123 from 2026-04-03" to "refund due on old order").** This loses precision. Instead, maintain a persistent case facts block outside the summarized history with exact numbers and dates. Task 5.1.

9. **Escalating to a human without a structured handoff (no customer ID, no root cause, no recommendation).** The human must re-verify identity and re-read the conversation or re-run tools. Provide a JSON blob with customer_id, root_cause, recommended_action. Task 1.4.

10. **Mixing concerns in a single reasoning step ("should I process this $50 refund AND investigate the billing address AND initiate a replacement?").** Context gets tangled. Decompose into distinct concerns (refund, billing, replacement) and reason over each separately. Task 1.4.

11. **Assuming "confidence" or "clarity of request" means the agent should attempt resolution.** A customer may ask "Can you match a competitor's price?" in a very clear way, but the policy may not cover competitive matching. Explicit policy criteria, not perception of clarity. Task 5.2.

12. **Routing complex cases to the agent when a policy exception or gap is obvious.** Example: customer requests a refund 8 months after purchase; policy allows 30 days. Don't try to convince the customer or find loopholes; escalate immediately with the policy gap noted. Task 5.2 calls this "policy exception/gap (not just complex)."

---

## What a good answer accounts for

When you read a scenario question, first **identify the problem domain**:

1. **Determinism** (tool ordering, prerequisites, state enforcement): Does the question ask why something fails non-deterministically or how to enforce a rule reliably? This is a **hooks / programmatic enforcement** question. The answer is not "improve the system prompt" but "use a gate or PostToolUse hook." Task 1.4, Task 1.5.

2. **Tool selection** (agent picks the wrong tool, conflates similar tools): This is a **tool description** question. The answer is "expand descriptions to disambiguate" before "add few-shot" or "build a classifier." Task 2.1.

3. **Error handling and recovery** (generic error, can't decide to retry vs escalate): This is a **structured error category** question. The answer is `errorCategory` + `isRetryable` + context. Task 2.2, Task 5.3.

4. **Escalation calibration** (escalates wrong cases, misses real ones): This is an **explicit criteria + few-shot** question. The answer is NOT sentiment, confidence, or ML classifiers. Task 5.2.

5. **Context loss in long conversations** (dates disappear, order IDs forgotten, amounts condensed): This is a **case facts block** question. The answer is a persistent structured layer outside summarized history. Task 5.1.

6. **Handoff quality** (human agents lack context when escalating): This is a **structured handoff** question. The answer is a JSON blob with customer_id, root_cause, recommendation. Task 1.4.

7. **Multi-concern confusion** (agent tangles refund logic with replacement logic): This is a **decomposition** question. The answer is to separate concerns into distinct reasoning passes. Task 1.4.

Once you've identified the domain, look at the options:

- If it's a determinism question and an option says "improve the system prompt", eliminate it (unless it's paired with hooks, which makes it a placeholder).
- If it's a tool selection question and an option says "build a classifier", eliminate it unless the question asks specifically for ML; task descriptions don't mention classifiers for tool routing.
- If it's an escalation question and an option mentions "sentiment" or "self-reported confidence", eliminate it.
- If it's a context loss question and an option says "add summarization", check if it's paired with a case facts block; if not, eliminate.

The harder questions test boundary cases:

- When are **prompts sufficient vs hooks required**? (Prompts for guidance on style/tone; hooks for deterministic enforcement like prerequisites or policy thresholds.)
- When should you **consolidate tools vs write better descriptions**? (Consolidate only if the tools truly overlap in capability; more often, write differentiated descriptions.)
- When is **sentiment-based escalation acceptable**? (Never, per Task 5.2. It's listed as an anti-pattern.)
- When do you **attempt resolution vs escalate immediately**? (Attempt if the policy covers it and you have the capability; escalate if policy is silent, capability is unclear, or the customer explicitly requests it. Task 5.2.)

---

## Practice questions

### Q1: Tool Sequencing and Prerequisite Enforcement

A customer calls in with "I want a refund for order #12345." The agent successfully looks up the order but skips `get_customer` verification ~12% of the time, directly calling `process_refund` with just the order number. This results in refunds being issued to the wrong account ~7% of the time. The agent's FCR is being harmed.

Which of the following is the most effective fix?

A) Add a system prompt instruction: "Always verify the customer's identity via get_customer before processing any refund."

B) Implement a programmatic prerequisite gate that prevents `process_refund` from executing unless `get_customer` has returned a verified customer ID in the current session.

C) Add three few-shot examples to the system prompt showing scenarios where `get_customer` is called before `process_refund`.

D) Build a routing classifier that detects refund requests and forces `get_customer` to be called first.

**Correct: B**

**Why B:** Task 1.4 requires programmatic enforcement for deterministic compliance when errors have financial consequences. Prompts (A and C) have non-zero failure rates (as evidenced by the 12% skips). A gate raises an exception if the prerequisite isn't met, making the ordering deterministic. Hooks and prerequisite gates give guarantees; prompts give probabilities. The exam explicitly tests this distinction (Q1 in the extract).

**Why not the others:**
- A) Prompt-based instruction; agent will still skip ~10% of the time as it already does.
- C) Few-shot helps with ambiguous cases, not deterministic sequencing. The agent already knows the concept; the problem is execution failure.
- D) Over-engineered; a simple exception on missing prerequisite is simpler and more reliable than a classifier. Task 2.3 warns against routing layers when simpler solutions suffice.

---

### Q2: Tool Description Clarity and Selection Reliability

An agent has two tools: `get_customer` (minimal description: "Get customer info") and `lookup_order` (minimal description: "Look up order info"). When a customer says "Can you check on my account?", the agent picks `lookup_order` ~30% of the time instead of `get_customer`, leading to failures because the customer's question is about their account status, not a specific order.

What is the most effective first step to improve tool selection reliability?

A) Add 4 few-shot examples to the system prompt showing when to use each tool.

B) Expand each tool's description with input formats, example queries, when-to-use vs when-not-to-use guidance, and boundary cases.

C) Build a pre-processing classifier that routes customer requests to the correct tool before the agent sees them.

D) Consolidate `get_customer` and `lookup_order` into a single `query_backend` tool with mode parameters.

**Correct: B**

**Why B:** Task 2.1 states "Tool descriptions are the primary signal LLMs use for tool selection" and "Minimal descriptions cause unreliable selection among similar tools." The fix is to expand descriptions before adding complexity. Example: "Use `get_customer` for account status, contact info, verification (input: email or phone). Use `lookup_order` for specific order details (input: order number or customer ID). Do NOT use `lookup_order` to verify account status."

**Why not the others:**
- A) Few-shot is a second-order fix; task 2.1 says fix descriptions first.
- C) A classifier is over-engineered; better descriptions solve this.
- D) Consolidation loses functional clarity and makes both use cases less reliable. Task 2.1 explicitly warns against this.

---

### Q3: Escalation Calibration and Explicit Criteria

An agent operating a support channel is achieving 55% first-contact resolution (FCR). Analysis shows it escalates straightforward billing questions (10 minute resolution time) while attempting complex policy exception requests (which should be escalated). The agent's justification when escalating varies: sometimes "I'm not confident in this decision," sometimes "The customer sounds frustrated."

To improve escalation calibration toward 80%+ FCR, which approach is most effective?

A) Define explicit escalation criteria in the system prompt (e.g., "escalate if: customer requests human, OR policy does not explicitly cover the use case, OR refund > threshold") and provide 2-3 few-shot examples of boundary cases showing the reasoning.

B) Add sentiment analysis to detect frustration and escalate high-frustration cases automatically.

C) Train a separate ML classifier on historical escalation decisions to predict when to escalate.

D) Add a self-confidence threshold: only escalate if the agent's self-reported confidence drops below 60%.

**Correct: A**

**Why A:** Task 5.2 on escalation states "Explicit escalation criteria + few-shot examples in system prompt" and explicitly lists sentiment-based escalation and self-reported confidence as anti-patterns. Explicit criteria (policy coverage, threshold amounts) are actionable and tunable; sentiment and confidence are not. The exam Q3 confirms this: "Explicit escalation criteria + few-shot examples" beats sentiment and confidence.

**Why not the others:**
- B) Sentiment doesn't correlate with escalation need (Task 5.2 anti-pattern). A calm customer with a policy gap should still be escalated.
- C) ML is over-engineered; explicit rules + few-shot is simpler and more interpretable.
- D) Self-reported LLM confidence is poorly calibrated (Task 5.2 anti-pattern). The agent is already incorrectly confident on hard cases.

---

### Q4: Error Response Structure and Recovery

A tool call to `lookup_order` times out. The agent receives the response: `{"error": "Operation failed"}`. The agent doesn't know whether to retry, ask the customer for clarification, escalate, or try an alternative approach.

Which response structure would best enable intelligent recovery?

A)
```json
{
  "isError": true,
  "errorCategory": "transient",
  "isRetryable": true,
  "description": "Backend service timeout after 30s. Retry in 5 seconds."
}
```

B)
```json
{
  "error": "Service unavailable. Please try again later."
}
```

C)
```json
{
  "status": "failed",
  "reason": "timeout",
  "message": "The lookup operation could not complete in time."
}
```

D)
```json
{
  "isError": true,
  "errorCategory": "transient",
  "description": "Backend service temporarily unavailable."
}
```

**Correct: A**

**Why A:** Task 2.2 specifies structured error responses with `errorCategory`, `isRetryable`, and a human-readable description. This lets the agent decide: transient + retryable = retry; validation + not retryable = ask user; business + not retryable = escalate. Task 5.3 reinforces this for error propagation. Option A provides all required fields for intelligent recovery logic.

**Why not the others:**
- B) Generic message with no categorization; agent can't make recovery decisions.
- C) Has fields but lacks `errorCategory` and `isRetryable` flags. Without categorization, the agent can't apply recovery logic (should it retry, ask the user, or escalate?).
- D) Has `errorCategory` and `isRetryable`, but is missing the flag that tells the agent whether retry will succeed. Option A includes this critical boolean; D does not.

---

### Q5: PostToolUse Hook for Normalization

A support agent calls `get_customer` from System A and `lookup_order` from System B. System A returns customer ID as `customer_id: 12345` (integer) and created_date as Unix timestamp `1609459200`. System B returns order status as numeric code `2` (representing "shipped") and order date as ISO string `"2026-04-15"`. The agent receives inconsistent data formats across tools and has to normalize in its reasoning, leading to occasional errors (e.g., treating the status code as a priority level).

How should this be addressed?

A) Add instructions to the system prompt: "Normalize all dates to ISO 8601 format and all status codes to English labels."

B) Implement a PostToolUse hook that normalizes tool results before the agent sees them (convert Unix timestamps to ISO 8601, convert status codes 1/2/3 to "pending"/"shipped"/"delivered", convert integer IDs to string IDs consistently).

C) Have the agent explicitly request formatted data from each tool by specifying output format in tool parameters.

D) Build a post-processing layer that the agent calls after each tool to normalize results.

**Correct: B**

**Why B:** Task 1.5 directly covers this: "PostToolUse to normalize heterogeneous formats (Unix timestamps, ISO 8601, numeric status codes)." Hooks intercept tool results and transform them before the model sees them, ensuring the agent always receives consistent data. This is guaranteed (hooks run every time); prompt-based normalization is probabilistic. The hook approach (B) is both more reliable and simpler than asking the agent to normalize ad-hoc (A) or adding conditional logic (C/D).

**Why not the others:**
- A) Prompt-based normalization; agent still sees inconsistent data first.
- C) Requires tool parameters to specify format (complex) and doesn't solve the problem if backends return inconsistent formats.
- D) Requires the agent to remember to call the layer; hooks are automatic.

---

### Q6: Structured Handoff for Escalation

A support agent determines that a customer's refund request ($750) exceeds policy limits (max $500) and escalates to a human. What should the escalation handoff include to enable the human to make a decision without requiring the customer to re-verify or re-provide information?

A) "Escalate to human for review. Reason: refund amount exceeds policy."

B)
```json
{
  "customer_id": "cust_789",
  "customer_email": "bob@example.com",
  "issue": "refund_request",
  "requested_amount": 750,
  "policy_limit": 500,
  "order_id": "ord_456",
  "order_date": "2026-03-10",
  "items": "Laptop (1x)",
  "attempted_resolution": "Verified customer identity via get_customer. Confirmed order #456. Refund amount exceeds policy max of $500.",
  "recommendation": "Approve partial refund of $500 (policy max) or escalate to manager for exception approval."
}
```

C) A link to the conversation history.

D) The conversation transcript copied to the escalation ticket.

**Correct: B**

**Why B:** Task 1.4 requires structured handoff summaries including customer ID, root cause, recommended action, and attempted resolution. The human gets factual details without reading a transcript. Option B is a complete JSON structure with all key facts (customer, order, policy gap, recommendation). Options A and C/D are incomplete or require the human to re-read/re-verify.

**Why not the others:**
- A) Prose summary with no customer ID or order details; human must ask customer to re-verify.
- C) Link assumes human has access to chat history; may not be available if customer calls back on different day/queue.
- D) Transcript is verbose and doesn't highlight key facts (policy limit, recommended action).

---

### Q7: Case Facts Block for Multi-Turn Conversations

A customer calls in about an order. Turn 1: Agent finds order #123 from 2026-04-15. Turn 2: Customer explains a billing issue. Turn 3: Agent processes a refund. Turn 4: Customer adds "Oh, and item 2 is damaged too." By turn 4, the agent's conversation history has grown. A system that aggressively summarizes conversation might compress "refund of $49.99 for order #123 from 2026-04-15" into "refund on April order." The agent then struggles to recall exact amounts and order numbers for the replacement request in turn 5.

How should this be prevented?

A) Disable summarization; keep the full conversation history.

B) Use prompting: "Remember the order ID is 123, the date is 2026-04-15, and the refund amount is $49.99."

C) Maintain a persistent case facts block outside the conversation history, refreshed after each turn with discovered facts (customer ID, order ID, dates, amounts, status). Include this block in the system prompt for each API call.

D) Store order metadata in a database and query it each turn instead of relying on conversation history.

**Correct: C**

**Why C:** Task 5.1 explicitly covers this. A case facts block is a structured persistent layer (outside summarized history) that includes customer ID, order ID, dates, amounts, and status. It's refreshed after each turn and prepended to the system prompt, preventing precision loss from summarization. This is simpler than full history (A), more reliable than prompting (B), and less complex than database queries (D).

**Why not the others:**
- A) Unbounded context growth; impractical for long conversations.
- B) Prompting doesn't prevent summarization loss; the agent still sees the same compressed history.
- D) Database access on every turn adds latency and complexity; case facts block is sufficient.

---

### Q8: Decomposing Multi-Concern Requests

A customer: "I was charged twice for order #A12, one item arrived damaged, and I need to update my billing address."

An agent that tries to reason about all three in one step produces incoherent reasoning: "The duplicate charge might be related to the damaged item, and the address..." Decisions get tangled.

How should the agent decompose this?

A) Attempt all three in parallel within a single agent call to minimize latency.

B) Decompose into distinct concerns: (1) duplicate charge (action: lookup_order + process_refund, escalation trigger: if amount > $500), (2) damaged item (action: lookup_order + initiate_replacement, escalation trigger: if item discontinued), (3) billing address (action: update_customer_info, escalation trigger: if verification fails). Reason over each separately.

C) Ask the customer which issue is most urgent and address only that one.

D) Combine all concerns into a single `handle_complex_case` tool call with all parameters.

**Correct: B**

**Why B:** Task 1.4 states "Decompose multi-concern customer requests into distinct items, investigate in parallel, synthesize unified resolution." Breaking into (concern, action, escalation trigger) tuples keeps reasoning clear. Each concern has its own investigation path and escalation trigger. The agent then synthesizes the unified response (refund amount, replacement item, address confirmed).

**Why not the others:**
- A) Parallel processing doesn't prevent context tangling in reasoning; decomposition does.
- C) Avoids the problem; customer asked for all three.
- D) Consolidation hides the distinct logic and makes escalation triggers unclear.

---

### Q9: Scoped Tool Availability and Misuse Prevention

A synthesis agent (responsible for integrating findings from multiple sub-agents into a report) has access to the following tools: `web_search`, `get_customer`, `lookup_order`, `verify_fact`, and `initiate_replacement`. The synthesis agent starts calling `get_customer` and `lookup_order` speculatively on entities mentioned in sub-agent reports, thinking these might provide useful context. This increases latency and token usage without improving report quality.

What is the best way to prevent this?

A) Add a system prompt instruction: "Do not call get_customer or lookup_order unless the report explicitly requests these details."

B) Restrict the synthesis agent's tool set to only `verify_fact` and `web_search` (tools aligned with its role: validating claims, not querying customer systems).

C) Add a cost warning to the tool descriptions: "Calling this tool is expensive; use only if necessary."

D) Train the synthesis agent on a corpus of good vs bad synthesis reports to improve judgment.

**Correct: B**

**Why B:** Task 2.3 states "Scoped access: each agent gets only the tools needed for its role" and "Restrict each subagent's tool set to its role." The synthesis agent's role is integrating and reporting; it shouldn't have customer/order tools. By removing the tools, the misuse is impossible. Prompting (A) is probabilistic; scoping is deterministic.

**Why not the others:**
- A) Prompt-based guidance; agent will still misuse ~20% of the time.
- C) Cost warnings don't prevent misuse; agent optimizes for report quality, not cost.
- D) Training requires examples and doesn't solve the root cause (unnecessary tool access).

---

### Q10: When to Escalate vs Attempt Resolution

A customer writes: "I purchased a laptop on 2026-01-10. Can you price-match a competitor's offer of $800? I originally paid $950."

The company's price-match policy states: "We match competitor prices on identical in-stock items within 30 days of purchase."

Today is 2026-04-26 (107 days later). The policy is clear: the request is outside the 30-day window.

What should the agent do?

A) Attempt to resolve by explaining the policy and offering a smaller goodwill discount (e.g., 10% off future purchase).

B) Escalate immediately to a human with the policy gap noted: "Customer requests price match 107 days after purchase. Policy limit is 30 days. Escalation required for manager exception consideration."

C) Escalate only if the customer expresses frustration after hearing the policy.

D) Apply sentiment analysis; if the customer is calm, attempt resolution; if frustrated, escalate.

**Correct: B**

**Why B:** Task 5.2 states "Honor explicit human requests immediately; escalate when policy is silent on specific request (competitor price match when policy only addresses own-site)" and "Escalate when policy is silent or a specific request is outside policy scope." The policy is explicit and the request is clearly outside (107 days vs 30-day limit). Escalate with the policy gap noted, not the tone or perceived reasonableness. The agent shouldn't try to "convince" or negotiate around a clear policy boundary.

**Why not the others:**
- A) Policy is clear; this isn't a gray area where negotiation makes sense.
- C) Escalation shouldn't depend on tone; the policy boundary is already exceeded regardless of frustration.
- D) Sentiment doesn't correlate with whether policy applies. Escalate based on policy, not tone.

---

## Quick-reference cheat sheet

**Determinism & Sequencing (D1, Task 1.4/1.5)**
- Programmatic prerequisites (gates) beat system prompts for rule enforcement.
- PostToolUse hooks normalize heterogeneous data formats before the model sees them.
- Tool call interception hooks block policy violations (refund > $500) deterministically.

**Tool Design (D2, Task 2.1/2.2)**
- Expand tool descriptions with input formats, example queries, when-to-use vs alternatives, boundary cases.
- Structured error responses: `errorCategory` (transient/validation/business/permission) + `isRetryable` + description.
- Scoped tool availability: each agent role gets only relevant tools.
- Tool descriptions are the primary signal for tool selection; fix descriptions before adding few-shot or classifiers.

**Error Propagation (D2/D5, Task 2.2/5.3)**
- Distinguish transient (retry) from validation (ask user) from business (escalate) from permission errors.
- Return attempted query, partial results, and alternatives in structured error context.
- Propagate unresolvable errors upward to coordinator; attempt local recovery for transient failures.

**Escalation (D5, Task 5.2)**
- Explicit escalation criteria, not sentiment or self-reported confidence.
- Few-shot examples of boundary cases showing the reasoning.
- Escalate: when customer requests human, when policy is silent on the use case, when capability is unclear.
- Ask for additional identifiers if multiple customer matches; don't pick by heuristic.
- Honor explicit escalation requests immediately without attempting investigation first.

**Context Management (D5, Task 5.1)**
- Case facts block: persistent, structured layer outside summarized history.
- Include: customer ID, order ID, dates, amounts, issue type, current status.
- Refresh after each turn with discovered facts.
- Prepend to system prompt for each API call to prevent precision loss.

**Escalation Handoff (D1, Task 1.4)**
- Structured JSON with: customer_id, customer_email, issue, root_cause, attempted_resolution, recommendation.
- No human should need to re-verify identity or re-read transcript.
- Include specific order IDs, amounts, dates, policy boundaries.

**Multi-Concern Decomposition (D1, Task 1.4)**
- Separate concerns into (concern, action, escalation_trigger) tuples.
- Investigate each separately to avoid context tangling.
- Synthesize unified response after all concerns are resolved.

**Structured Output (D4, Task 4.3)**
- Use tool_use with JSON schema for structured extraction, not freeform prose.
- `tool_choice: "any"` when document type is unknown; forced tool when ordering matters.
- Nullable fields prevent hallucination (don't fabricate to satisfy required fields).

**Few-Shot Guidance (D4, Task 4.2 / D5, Task 5.2)**
- 2-4 examples for ambiguous scenarios; show reasoning for chosen action over alternatives.
- Escalation few-shot: 2-3 boundary cases demonstrating explicit criteria.
- Examples should demonstrate the desired output format and handling of edge cases.

**Batch API (D4, Task 4.5)**
- Batch API: 50% cost savings, 24-hour latency SLA, no guaranteed fast response, no multi-turn tool use within single request.
- Use for overnight/weekly latency-tolerant tasks only; sync API for blocking (pre-merge checks).

**Claude Code / CLAUDE.md (D3, Task 3.1/3.2/3.3)**
- Project CLAUDE.md: shared via VCS, applies to all project members.
- User CLAUDE.md: personal, not shared (at ~/.claude/CLAUDE.md).
- `.claude/rules/` with YAML frontmatter `paths` glob patterns for conditional rule activation.
- `.claude/commands/` for shared project slash commands.
- `.claude/skills/` with `context: fork` for isolated subagent work.

**Plan Mode (D3, Task 3.4)**
- Plan mode for: large-scale changes, architectural decisions, multi-file modifications, uncertainty about approach.
- Direct execution for: single-file bug fix with clear stack trace, well-scoped change.
- Combine: plan mode (investigation) + direct execution (implementation).

**Session Management (D3, Task 3.5 / D5, Task 5.4)**
- Named sessions (--resume) for cross-day continuity.
- `fork_session` for branching from a shared baseline.
- Scratchpad files persist findings across context boundaries.
- Start fresh with summary is more reliable than resume with stale results.

**MCP Integration (D2, Task 2.4)**
- Project `.mcp.json` with env-var expansion (${GITHUB_TOKEN}) for shared servers.
- User `~/.claude.json` for experimental servers.
- MCP resources expose data catalogs to reduce exploratory tool calls.
- Choose community servers (Jira) over custom; reserve custom for team-specific workflows.

**Built-in Tools (D2, Task 2.5)**
- Grep: content search (function names, error messages, imports).
- Glob: file path patterns (matching \*\*/\*.test.tsx).
- Read/Write: full-file ops; Edit: targeted edits via unique text matching.
- Read + Write fallback when Edit can't find unique anchor text.

**Anti-Patterns (Cross-Domain)**
- Sentiment-based escalation: doesn't correlate with escalation need.
- Self-reported confidence for decisions: poorly calibrated, agent is often most confident on hard cases.
- Multi-customer matches resolved by heuristic: ask for additional identifiers instead.
- Generic error responses: always include errorCategory, isRetryable, description.
- Context bloat: trim verbose tool outputs to relevant fields.
- Aggressive summarization without case facts block: precision loss on dates, amounts, IDs.
- Prompt-based enforcement for deterministic rules: use hooks instead.
- Escaping to human without structured handoff: include customer ID, root cause, recommendation.

