# Scenario 6: Structured Data Extraction

## The Scenario

> You are building a structured data extraction system using Claude. The system extracts information from unstructured documents, validates the output using JavaScript Object Notation (JSON) schemas, and maintains high accuracy. It must handle edge cases gracefully and integrate with downstream systems.

**Primary domains tested:** Domain 4 (Prompt Engineering & Structured Output - tasks 4.2, 4.3, 4.4, 4.5) and Domain 5 (Context Management & Reliability - tasks 5.5, 5.6).

---

## What's Actually Being Tested

This scenario maps directly to six interconnected exam tasks:

1. **Task 4.2 (Few-shot prompting)** - Varied document structures (inline citations vs bibliographies, narrative vs tabular data) require concrete examples demonstrating extraction for different formats to prevent hallucination and inconsistency.

2. **Task 4.3 (Structured output via tool_use and JSON schemas)** - `tool_use` with JSON schemas is the canonical reliable mechanism; `tool_choice` options ("auto", "any", forced) control whether text output is permitted or a tool call is mandatory; required vs optional/nullable fields prevent fabrication; enums with "other" + detail and "unclear" values enable extensibility.

3. **Task 4.4 (Validation, retry, feedback loops)** - Retry with specific error feedback only works when info IS PRESENT but misformatted (format/structure mismatches); it fails when info is absent from the source. Semantic errors (sums don't match, wrong field placement) persist across retries; `calculated_total` vs `stated_total` + `conflict_detected` boolean enable self-correction validation; `detected_pattern` field tracks which constructs trigger dismissals for false-positive analysis.

4. **Task 4.5 (Batch processing strategies)** - Message Batches API (50% cost, 24-hour max, no multi-turn tool calling) for non-blocking overnight workloads; sync API for blocking pre-merge; sample-refine before bulk batch; `custom_id` for correlating batch request/response pairs; resubmit only failed `custom_id`s with modifications.

5. **Task 5.5 (Human review and confidence calibration)** - Aggregate accuracy hides per-segment poor performance; stratified random sampling by document type and field for ongoing error rate and novel pattern detection; field-level confidence scores calibrated with labeled validation sets; route low-confidence or contradictory-source extractions to human review, not arbitrary thresholds.

6. **Task 5.6 (Provenance and uncertainty in multi-source synthesis)** - Claim-source mappings must be preserved through extraction and synthesis; conflicting statistics annotated with source attribution (don't pick arbitrarily); publication/collection dates required to distinguish temporal differences from actual contradictions; render content type appropriately (financials as tables, news as prose).

---

## Reference Architecture: How to Build This

### Core: tool_use with JSON Schema

The most reliable structured output mechanism is `tool_use` paired with a strict JSON schema. This eliminates syntax errors (malformed JSON, missing required brackets) but does NOT eliminate semantic errors (line items that don't sum, incorrect field values placed in wrong locations).

**Why tool_use over free-text JSON:**
- Parser failures on malformed JSON require post-processing and retry - expensive.
- tool_use guarantees valid JSON syntax by construction; Claude must return a valid tool call with properly structured input matching the schema.
- Schema validation still requires semantic checks (sums, date ranges, enum constraints).

Example tool definition:

```json
{
  "name": "extract_invoice_metadata",
  "description": "Extract structured data from an invoice document including line items, totals, and dates.",
  "input_schema": {
    "type": "object",
    "properties": {
      "invoice_number": {
        "type": "string",
        "nullable": true,
        "description": "Invoice identifier from the document; null if not present"
      },
      "issue_date": {
        "type": "string",
        "format": "date",
        "nullable": true,
        "description": "ISO 8601 date format (YYYY-MM-DD); null if not present"
      },
      "line_items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "description": {
              "type": "string"
            },
            "quantity": {
              "type": "number"
            },
            "unit_price": {
              "type": "number"
            },
            "line_total": {
              "type": "number"
            }
          },
          "required": ["description", "quantity", "unit_price", "line_total"]
        }
      },
      "stated_total": {
        "type": "number",
        "nullable": true,
        "description": "Total claimed in the document; null if not present"
      },
      "calculated_total": {
        "type": "number",
        "description": "Sum of all line_total values"
      },
      "conflict_detected": {
        "type": "boolean",
        "description": "True if stated_total != calculated_total"
      },
      "currency": {
        "type": "string",
        "enum": ["USD", "EUR", "GBP", "other"],
        "description": "Currency code; use 'other' and provide detail in currency_detail"
      },
      "currency_detail": {
        "type": "string",
        "nullable": true,
        "description": "If currency='other', specify currency name here"
      },
      "extraction_confidence": {
        "type": "string",
        "enum": ["high", "medium", "low", "unclear"],
        "description": "Field-level confidence based on document clarity"
      },
      "detected_pattern": {
        "type": "string",
        "nullable": true,
        "description": "If dismissing a finding, what pattern triggered it (enables false-positive analysis)"
      }
    },
    "required": [
      "line_items",
      "calculated_total",
      "conflict_detected",
      "currency",
      "extraction_confidence"
    ]
  }
}
```

### tool_choice: "auto" vs "any" vs forced

Three `tool_choice` modes control whether the model may return text or must call a tool:

1. **`"auto"` (default)** - Model may return text or call a tool. Use when conversational fallback is acceptable (e.g., "I cannot extract this because the document is corrupted"). Risk: model might skip structured output when uncertain.

2. **`"any"`** - Model MUST call a tool, but may choose which one. Use when document type is unknown but multiple extraction schemas exist (invoices vs contracts vs resumes), and you need guaranteed structured output. Model selects the best tool for the document.

3. **Forced (specific tool)** - Model MUST call a specific tool. Use when:
   - Ordering matters (extract metadata before enrichment steps).
   - Output structure is non-negotiable.
   - You need to ensure downstream systems receive compatible schema.

Example forced selection:

```json
{
  "tool_choice": {
    "type": "tool",
    "name": "extract_invoice_metadata"
  }
}
```

**Exam-critical distinction:** `"auto"` + low confidence = conversational text, bypassing structure. `"any"` when doc type unknown ensures tool call but allows tool selection. Forced selection when you must guarantee a specific structured output.

### Schema Design: Required, Optional, Nullable, Enums

**Required fields:** Only when info is ALWAYS present in valid source documents. If a source may legitimately lack info (e.g., some invoices have no purchase order number), field should NOT be required.

**Optional fields:** Omit from the schema if the extraction can succeed without them, or include with `"nullable": true` to permit explicit null values.

**Nullable fields prevent fabrication.** Required field + missing info = model fabricates a plausible value. Optional/nullable field + missing info = model returns null or omits the field, preserving accuracy.

Example: `"purchase_order": { "type": "string", "nullable": true }` allows null when PO is absent, preventing the model from inventing "PO-12345".

**Enums with "other" + detail string:**

```json
{
  "document_type": {
    "type": "string",
    "enum": ["invoice", "receipt", "purchase_order", "quote", "other"],
    "description": "Type of financial document"
  },
  "document_type_detail": {
    "type": "string",
    "nullable": true,
    "description": "If document_type='other', describe the type here"
  }
}
```

This enables extension without breaking the schema.

**"unclear" enum value:**

```json
{
  "extraction_confidence": {
    "type": "string",
    "enum": ["high", "medium", "low", "unclear"]
  }
}
```

For ambiguous cases, "unclear" is preferable to a forced guess, and signals human review routing downstream.

### Format Normalization Rules

Include format rules in the prompt alongside the schema. Examples:

- **Dates:** "Always extract dates as ISO 8601 (YYYY-MM-DD). If the source shows '3/15/25', interpret as March 15, 2025 and output '2025-03-15'."
- **Numbers:** "Extract monetary amounts as numbers without currency symbols. '$1,234.56' becomes 1234.56."
- **Names:** "Full names are surname, given name order. Extract as provided; do not reorder."
- **Addresses:** "Preserve multi-line addresses with explicit newline indicators or array format as specified in schema."

These rules prevent the model from inventing alternative formats and reduce validation errors.

### Few-Shot for Varied Document Structures

Provide 2-4 examples covering different source structures. Key: vary the STRUCTURE of the source, not just the values.

Example 1: Inline format (text narrative)
```
Input: "Invoice #INV-2025-00147 issued March 15, 2025 to Acme Corp for:
- Widget A x 5 @ $10 = $50
- Widget B x 3 @ $20 = $60
Total: $110"

Output: {
  "invoice_number": "INV-2025-00147",
  "issue_date": "2025-03-15",
  "line_items": [
    {"description": "Widget A", "quantity": 5, "unit_price": 10, "line_total": 50},
    {"description": "Widget B", "quantity": 3, "unit_price": 20, "line_total": 60}
  ],
  "stated_total": 110,
  "calculated_total": 110,
  "conflict_detected": false,
  "currency": "USD",
  "extraction_confidence": "high"
}
```

Example 2: Tabular format (HTML table)
```
Input: "<table>
  <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
  <tr><td>Service: Consulting</td><td>8</td><td>150</td><td>1200</td></tr>
  <tr><td>Subtotal</td><td colspan='3'>1200</td></tr>
</table>
Invoice #SVC-451 dated 2025-03-20. Payment in EUR."

Output: {
  "invoice_number": "SVC-451",
  "issue_date": "2025-03-20",
  "line_items": [
    {"description": "Service: Consulting", "quantity": 8, "unit_price": 150, "line_total": 1200}
  ],
  "stated_total": 1200,
  "calculated_total": 1200,
  "conflict_detected": false,
  "currency": "EUR",
  "extraction_confidence": "high"
}
```

Example 3: Ambiguous/missing info
```
Input: "Payment due for items ordered. Final cost unknown, awaiting tax calculation.
Item 1: $500
Item 2: $750"

Output: {
  "invoice_number": null,
  "issue_date": null,
  "line_items": [
    {"description": "Item 1", "quantity": 1, "unit_price": 500, "line_total": 500},
    {"description": "Item 2", "quantity": 1, "unit_price": 750, "line_total": 750}
  ],
  "stated_total": null,
  "calculated_total": 1250,
  "conflict_detected": false,
  "currency": "USD",
  "extraction_confidence": "medium",
  "detected_pattern": "source lacks invoice number, date, stated total"
}
```

Few-shot examples should show:
- How to handle missing fields (null vs omit vs "unclear").
- How to standardize varied formats (inline vs table) to consistent schema.
- How to annotate ambiguous cases and conflicts rather than guessing.

### Validation and Retry

**Retry-with-error-feedback pattern:**

1. Extract with tool_use (receives tool call result).
2. Validate: check JSON schema syntax (eliminated by tool_use), then semantic validation (sums match, date ranges valid, required enums present).
3. On validation failure, append original document + failed extraction + specific error to a follow-up request:

```
"The extraction returned conflict_detected=true: stated_total (1200) != calculated_total (1250).
Original invoice text: [document excerpt].
Please re-examine the invoice and correct the discrepancy."
```

4. Retry: model re-reads source with error context and attempts correction.

**When retry is FUTILE:** If the source document genuinely lacks info (no stated total present, dates are illegible), retrying won't help. Detect this by checking whether the model is inventing vs missing:
- Missing info → model returns null or "unclear" → retry is futile.
- Format/parsing error → model misread the format → retry with specific error feedback may succeed.

**Semantic validation that persists across retries:**
- Line items don't sum correctly → model may recalculate but cannot fix source data.
- Dates in wrong format or outside reasonable range → provide format rule in retry.
- Enum mismatch → cite specific allowed values in error message.

**Self-correction fields:**

Extract `calculated_total` (sum of line items) ALONGSIDE `stated_total` (value claimed in source), and compute `conflict_detected = (stated_total != calculated_total)`. This flags data quality issues without forcing the model to pick which value is "correct."

**`detected_pattern` for dismissal analysis:**

When the model declines to extract a field or flags it "unclear", capture WHY:

```json
{
  "dismissal_pattern": "invoice_number_absent_multiple_formats_in_document",
  "dismissal_confidence": "medium"
}
```

Patterns help distinguish between:
- Systematic dismissals (valid: source truly missing).
- False positives (overly conservative criteria; recalibrate).
- Format-specific issues (improve few-shot examples for that format).

---

## Message Batches API and Synchronous API

### When to Use Batch vs Sync

**Message Batches API:**
- 50% cost savings.
- Up to 24-hour processing (no guaranteed latency SLA).
- No multi-turn tool calling within a single batch request.
- Appropriate for non-blocking, latency-tolerant workloads (overnight extractions, weekly reports, nightly background jobs).

**Synchronous API:**
- Standard latency (seconds to minutes).
- Multi-turn tool calling supported.
- Appropriate for blocking workflows (pre-merge checks, real-time customer requests, synchronous integrations).

**Exam rule:** Never use batch for blocking pre-merge checks (unacceptable latency). Never use sync for overnight non-blocking work (unnecessary cost).

### Batch Submission and Correlation

Use `custom_id` to correlate batch request/response pairs:

```json
{
  "requests": [
    {
      "custom_id": "invoice-2025-001",
      "params": {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Extract invoice metadata. [invoice document]. [schema + examples]"
              }
            ]
          }
        ]
      }
    },
    {
      "custom_id": "invoice-2025-002",
      "params": { ... }
    }
  ]
}
```

On response, each output includes the `custom_id`, allowing you to match results back to inputs.

**Resubmit only failed `custom_id`s:** If extraction fails for 5 out of 1000 documents, resubmit only those 5 with modifications (e.g., chunked oversized documents, adjusted prompts for edge cases), not the full batch.

### Sample-Refine Before Bulk Batch

Before submitting 10,000 documents to batch:
1. Randomly sample 50-100 documents.
2. Extract with sync API.
3. Validate results; identify failure patterns (specific doc formats, edge cases).
4. Refine prompt, schema, few-shot examples.
5. Resubmit sample; confirm improvements.
6. Then batch the full set.

This prevents wasted batch slots and resubmission cycles.

---

## Human Review and Confidence Calibration (Task 5.5)

### Aggregate Accuracy Hides Per-Segment Problems

A system might report 94% accuracy overall but 78% on a specific document type:
- Small document type volume masks the problem (5% of docs are contracts, failing at 22%).
- Automating at 94% aggregate = automating a category where 1 in 5 are wrong.

**Stratified sampling strategy:**
1. Segment accuracy by document type (invoices, receipts, contracts, etc.) and by field (invoice_number, total, dates, line_items).
2. For each segment, calculate error rate on a labeled validation set (humans reviewed 200 invoices; AI correct 180/200 = 90%).
3. Route segments below a threshold (e.g., < 92%) to human review or recalibration.

### Stratified Random Sampling for Ongoing Error Rate and Novel Patterns

After deployment, continue sampling to detect:
- Drift (accuracy dropping over time as source formats evolve).
- Novel patterns (new document types, formatting changes) not seen in training.

Sample design:
- **Per-segment stratification:** Sample 5-10 high-confidence extractions per document type per week.
- **Per-field stratification:** Sample more frequently for high-stakes fields (totals) than low-stakes (memo text).
- **Random within strata:** Within "invoices with high confidence score", randomly select a subset to audit.

### Field-Level Confidence Calibration

Each extracted field includes a confidence score (high, medium, low, unclear). Calibrate thresholds using labeled data:

1. Extract 100 invoices; humans validate.
2. For all extractions marked "high confidence," count errors. E.g., 2/95 = 2.1% error rate.
3. For "medium confidence," count errors. E.g., 15/4 = 75% error rate.
4. For "low confidence," count errors. E.g., 8/9 = 89% error rate.

**Calibrated routing thresholds:**
- "high confidence" + error rate < 2% → auto-accept.
- "medium confidence" + error rate 50-80% → route to human review.
- "low" / "unclear" → always route to human review.

These thresholds are calibrated to your actual data, not generic rules.

---

## Provenance and Uncertainty (Task 5.6)

### Claim-Source Mappings

When extracting from multiple documents (e.g., financial summaries pulling from 5 source documents), preserve which source each claim came from:

```json
{
  "revenue_2025": {
    "stated_value": 5000000,
    "source_attribution": [
      {
        "document_name": "Q1-2025-earnings-report.pdf",
        "excerpt": "Revenue in Q1 reached $1.2M",
        "publication_date": "2025-04-15",
        "claim": "Q1 revenue $1.2M"
      },
      {
        "document_name": "Q2-2025-earnings-report.pdf",
        "excerpt": "Q2 revenue of $1.3M",
        "publication_date": "2025-07-15",
        "claim": "Q2 revenue $1.3M"
      }
    ],
    "synthesis_method": "sum of quarterly figures"
  }
}
```

This preserves **provenance** - the ability to trace the extracted value back to its sources.

### Handling Conflicting Values

If two credible sources contradict each other:

```json
{
  "annual_revenue": {
    "conflict_detected": true,
    "values_and_sources": [
      {
        "value": 5200000,
        "source": "annual-report-2024.pdf",
        "publication_date": "2025-02-01",
        "methodology": "sum of monthly reports"
      },
      {
        "value": 5100000,
        "source": "audited-financials-2024.pdf",
        "publication_date": "2025-03-15",
        "methodology": "audited total revenue"
      }
    ],
    "difference": 100000,
    "explanation": "Annual report includes prepaid expenses; audited version excludes them"
  }
}
```

DO NOT arbitrarily pick one value. Annotate the conflict with attribution and let downstream systems (humans or business logic) decide reconciliation.

### Publication/Collection Dates are Critical

Without dates, a system cannot distinguish between:
- Temporal contradiction (same metric measured at different times → values rightfully differ).
- Data error (same metric measured same day → values should match).

```json
{
  "employee_count": {
    "value": 250,
    "publication_date": "2024-06-30",
    "source": "mid-year-headcount-report.pdf",
    "note": "This is June 30 headcount; may differ from Dec 31 year-end"
  },
  "employee_count_year_end": {
    "value": 285,
    "publication_date": "2024-12-31",
    "source": "year-end-report.pdf",
    "note": "Headcount grew from June to year-end"
  }
}
```

### Rendering Content Type Appropriately

- **Financials (numbers, summaries):** Render as tables with sources and confidence.
- **News or prose:** Render as narrative text with inline citations.
- **Technical or structured lists:** Render as nested JSON or markdown lists.

This preserves the semantics of the original content and enables human interpretation.

---

## The Exam-Relevant Patterns (24 Core Concepts)

1. **tool_use with JSON schema guarantees syntax correctness** (not semantic correctness).

2. **tool_choice "auto"** allows conversational fallback; use when uncertainty fallback is acceptable.

3. **tool_choice "any"** forces a tool call but model picks tool; use for unknown doc types with multiple extraction schemas.

4. **tool_choice forced selection** ensures specific tool and ordering; use when downstream systems require exact schema.

5. **Required fields only for always-present info** - missing info + required field = fabrication.

6. **Optional/nullable fields prevent hallucination** - model returns null instead of inventing data.

7. **Enums with "other" + detail string** enable safe extensibility without schema breakage.

8. **"unclear" enum value** signals ambiguous cases for human review instead of forced guessing.

9. **Validation-retry pattern:** Append original doc + specific error to follow-up request.

10. **Retry is futile when info is absent** (model returns null) vs effective for format/parsing errors.

11. **detected_pattern field enables false-positive dismissal analysis** - distinguish systematic vs spurious.

12. **Aggregate accuracy hides per-segment poor performance** - segment by doc type and field.

13. **Stratified random sampling detects drift and novel patterns** during ongoing operation.

14. **Field-level confidence scores calibrated on labeled validation data** route human review at thresholds that match actual error rates.

15. **Batch API for non-blocking (overnight) workloads; sync for blocking** (pre-merge, real-time).

16. **custom_id correlates batch request/response pairs** - resubmit only failed `custom_id`s.

17. **Sample-refine before bulk batch** - validate on 50-100 docs before 10,000.

18. **Claim-source mappings preserved through synthesis** - provenance preserved via structured outputs.

19. **Conflicting values annotated with attribution, not arbitrarily picked** - preserve uncertainty.

20. **Publication/collection dates required to distinguish temporal from data errors** - prevent misinterpretation.

21. **Format normalization rules in prompt alongside schema** reduce validation errors.

22. **Few-shot examples covering varied source structures** (inline, tabular, narrative, embedded) enable generalization.

23. **Self-correction validation: calculated_total vs stated_total + conflict_detected** flag data quality issues.

24. **Render content type appropriately** (financials as tables, news as prose) preserve semantics.

---

## Gotchas and Anti-Patterns (16 Critical Mistakes)

1. **Required fields where source may legitimately lack info** → model fabricates plausible values. Use optional/nullable instead.

2. **Free-text JSON without tool_use** → syntax errors; post-processing required; expensive retries. Use tool_use with schema.

3. **Strict schema as a semantic error fix** → strict JSON syntax doesn't prevent sums-don't-match, wrong field values. Semantic validation is separate.

4. **Retrying when info is absent from source** → model has nothing new to read; retry fails. Check whether info is present before retrying.

5. **"Be conservative" without explicit criteria** → vague; model applies arbitrary thresholds. Define explicit conditions or use calibrated scores.

6. **Automating based on aggregate accuracy** → hiding category-specific failures. Segment by doc type and field; validate per-segment before automation.

7. **Sentiment or self-reported confidence as routing signal** → LLM confidence poorly calibrated; high confidence + low accuracy common. Route by calibrated field-level scores instead.

8. **tool_choice "auto" when structure is mandatory** → model may return text instead of structured output. Use "any" or forced selection.

9. **Silently picking one statistic when sources conflict** → loses provenance and uncertainty information. Annotate conflicts with attribution.

10. **No publication/collection dates** → cannot distinguish temporal differences from data errors. Contradictions become ambiguous.

11. **Bulk batching without sample refinement** → high failure rate; expensive resubmissions; wastes batch slots. Sample-refine first.

12. **Sync API for overnight non-blocking workloads** → unnecessary cost; blocks resources unnecessarily. Use batch API.

13. **Batch API for blocking pre-merge checks** → unacceptable 24-hour latency. Use sync API.

14. **Expecting multi-turn tool calling within a single batch request** → unsupported by Message Batches API. Design for single-turn.

15. **Universal review threshold instead of calibrated to your data** → catches either too many or too few errors. Calibrate on labeled validation set per segment.

16. **One document type's poor accuracy hidden by aggregate** → automating a category where 1 in 5 fails. Segment and validate per-segment.

---

## What a Good Answer Accounts For

When you encounter a scenario question, think through this decision tree:

### "System hallucinates values for missing fields"

- Check: Are those fields required in the schema?
- Fix: Make fields optional/nullable so model returns null instead of inventing.
- Anti-pattern: Adding stricter validation rules (doesn't prevent fabrication; validates that fabrications are plausible).

### "JSON syntax errors break parsing"

- Check: Are you using tool_use with schema?
- Fix: Migrate to tool_use; syntax guaranteed.
- Anti-pattern: Post-processing regex or JSON repair (still error-prone; expensive on high volume).

### "Retries don't improve extraction"

- Check: Is the missing info actually present in the source document?
- If NO: Info is absent → retry is futile. Mark as "low confidence" or "unclear" and route to human review.
- If YES: Info is present but model misread format → retry with specific error feedback and format rules.
- Anti-pattern: Retrying blindly without checking whether info is present.

### "Aggregate accuracy looks 95% but one document type fails silently"

- Fix: Segment accuracy by document type and field; validate per-segment before reducing human review.
- Anti-pattern: Relying on aggregate metric; automating without per-segment validation.

### "Conflicting numbers in different sources"

- Don't pick one arbitrarily.
- Annotate both with source attribution, publication date, methodology.
- Let downstream systems decide reconciliation.
- Anti-pattern: Silent arbitration (lose provenance and uncertainty).

### "Same data, different time - which value is right?"

- Dates are required.
- Include publication/collection date in every extracted claim.
- Document temporal scope (Q1 2025, year-end 2024, etc.).
- Anti-pattern: No dates → contradictions become ambiguous misattributions.

### "Extraction cost is too high"

- Is the workload blocking (real-time, pre-merge)? Use sync API.
- Is it non-blocking (overnight, weekly batch)? Use batch API (50% cost).
- Sample-refine on 50-100 docs before submitting 10,000.
- Anti-pattern: Sync API for overnight work (cost waste); batch for blocking (latency violation).

### "tool_choice: which mode?"

- `"auto"`: Conversational fallback acceptable? Use this (model may return text).
- `"any"`: Multiple extraction schemas, doc type unknown? Use this (model picks tool, structure guaranteed).
- Forced: Specific tool required, ordering matters, downstream needs exact schema? Use forced selection.
- Anti-pattern: `"auto"` when structure is non-negotiable (model may return conversational text).

### "Format inconsistent across documents"

- Include format normalization rules in prompt alongside schema.
- Add few-shot examples covering varied formats (inline, table, narrative, embedded).
- Model generalizes from examples; rules prevent invention.
- Anti-pattern: Assuming schema alone fixes format variance (few-shot critical for generalization).

---

## Practice Questions

### Question 1: Required Fields and Fabrication

**Stem:** You're extracting purchase order data. Your schema marks `po_number`, `vendor_name`, `line_items`, and `total_amount` as required. After extraction, you notice the system is hallucinating `po_number` values when the source document doesn't include one. What's the most effective fix?

A) Add a validation step that checks if po_number "looks plausible" and flags suspiciously invented ones.

B) Change po_number from required to optional/nullable; accept null when the field is genuinely absent from the source.

C) Increase the model temperature and let it retry with more creativity to find the PO number.

D) Mark po_number as required but add a few-shot example showing how to extract when PO is missing.

**Correct answer: B**

**Reasoning:** Required fields + absent info = fabrication. Model invents a plausible value to satisfy the requirement. Making the field optional/nullable allows the model to return null, preserving accuracy. (A) doesn't address the root cause - validation can flag suspicious values but can't prevent fabrication. (C) is wrong - higher temperature increases hallucination, not reduces it. (D) contradicts itself - required fields still force a value even with examples.

---

### Question 2: tool_choice for Unknown Document Types

**Stem:** Your system receives varied financial documents (invoices, purchase orders, credit memos, receipts). The document type is not pre-labeled. You have three extraction schemas (one per document type). Which tool_choice setting ensures the model always returns structured output while allowing it to select the appropriate schema?

A) tool_choice: "auto" with all three tools available.

B) tool_choice: "any" with all three tools available.

C) tool_choice forced to the first tool; handle failures by retrying with the next tool.

D) tool_choice: "auto" with a routing classifier that pre-selects the schema.

**Correct answer: B**

**Reasoning:** `"any"` forces a tool call (guarantees structured output) but allows the model to choose which tool (appropriate schema for detected document type). (A) "auto" allows the model to return conversational text instead of tool call. (C) forced selection doesn't allow tool switching; wastes attempt on wrong schema. (D) adds unnecessary complexity; `"any"` handles it natively.

---

### Question 3: Validation-Retry Effectiveness

**Stem:** Extraction of an invoice returned: stated_total = 1500, calculated_total (sum of line items) = 1480, conflict_detected = true. You retry with the error message: "Your calculated total ($1480) does not match the stated total ($1500). Please correct the discrepancy." Why will this retry likely FAIL to fix the issue?

A) The model is confident in its line-item extraction; it won't second-guess itself.

B) The discrepancy is in the source document, not the model's extraction. The source data is inconsistent; retry cannot fix that.

C) The error message is not specific enough; add the original invoice text.

D) The model needs higher temperature to explore alternative interpretations.

**Correct answer: B**

**Reasoning:** If the source document genuinely has inconsistent totals, retrying the model won't change the source data. The model extracted correctly; the problem is upstream. You should flag this as conflict_detected=true and route to human review rather than retry. (A) assumes the model is stubborn, but the issue is source data. (C) adding text helps with FORMAT errors but not SOURCE data errors. (D) higher temperature increases hallucination.

---

### Question 4: Aggregate vs Segment Accuracy

**Stem:** Your extraction system reports 93% accuracy across 10,000 extracted documents. You segment results: invoices (7000 docs, 97% accuracy), contracts (2000 docs, 82% accuracy), receipts (1000 docs, 91% accuracy). You want to reduce human review. Which decision is SAFEST?

A) Reduce human review across all document types to 20% random sampling (aggregate accuracy supports it).

B) Continue 100% review on contracts (82% accuracy unacceptable); reduce to 30% sampling on invoices (97% accuracy high); reduce to 50% on receipts.

C) Remove contracts from automated extraction and route all to human pre-review; scale back sampling on invoices and receipts per per-segment accuracy.

D) Increase model temperature and retrain the extraction prompt to improve contract accuracy, then revisit.

**Correct answer: B**

**Reasoning:** Segment by document type; validate per-segment before reducing review. Contracts at 82% = 1 in 5 documents incorrect - too high to automate at 30% sampling. Invoices at 97% = 1 in 33 documents incorrect - can reduce to sampling. Receipts at 91% = 1 in 11 documents incorrect - moderate risk, 50% sampling reasonable. (A) relies on aggregate (hides segment failures). (C) over-corrects contracts (maybe fixable with prompt improvements). (D) temperature changes don't reliably improve accuracy; prompt refinement is more effective.

---

### Question 5: tool_choice forced selection to guarantee structured output

**Stem:** You're extracting key facts from legal documents using a single `extract_facts` tool. Your downstream pipeline requires structured JSON output for every document. With `tool_choice: "auto"`, the model occasionally returns conversational text such as "I cannot extract facts because this document is in an unusual language" instead of calling the tool. Which change most reliably guarantees structured output for every document?

A) Keep `"auto"` and add a few-shot example showing extraction from unusual-language documents.

B) Change to `tool_choice: "any"` so the model must call a tool but can still pick which one.

C) Change to forced tool selection: `tool_choice: {"type": "tool", "name": "extract_facts"}`.

D) Increase `max_tokens` so the model has room to call the tool after explaining its reasoning.

**Correct answer: C**

**Reasoning:** Task 4.3 says forced tool selection (`{"type": "tool", "name": "..."}`) is the canonical mechanism for guaranteeing the model calls a specific named tool. Since there is only one extraction tool here and structure is mandatory, forced selection is the most precise mechanism. (B) `"any"` happens to produce the same result when only one tool exists, but it is the wrong mechanism for "must call THIS tool." If extra tools were added later (e.g. for retries or audits), `"any"` would silently allow the model to choose a different tool while forced selection would not. (A) few-shot does not address the root cause - `"auto"` is permitted to return text regardless of examples. (D) `max_tokens` is unrelated to whether the model must call a tool.

---

### Question 6: Batch vs Sync API

**Stem:** You need to extract data from 50,000 invoices. The results are needed for nightly reconciliation at 2 AM, with a 30-minute SLA (results must be available by 2:30 AM). Which approach minimizes cost while meeting the SLA?

A) Use sync API to ensure results complete within 30 minutes.

B) Use Message Batches API; submit at 1 PM the previous day to guarantee 24-hour window before 2 AM deadline.

C) Use sync API for a sample of 500 invoices; batch the rest.

D) Use Message Batches API with a 2-hour timeout fallback to sync API.

**Correct answer: B**

**Reasoning:** Batch API provides 50% cost savings and a 24-hour window. Submitting at 1 PM gives 13 hours of buffer before the 2 AM deadline (well within 24-hour SLA). The workload is non-blocking (nightly, not real-time), so batch is appropriate. (A) sync API is more expensive and unnecessary for non-blocking. (C) hybrid approach is over-complex. (D) timeouts on batch don't exist; batch has no guaranteed latency SLA.

---

### Question 7: Few-Shot for Format Variance

**Stem:** Your extraction system struggles with different invoice layouts: some have inline descriptions, some have tables, some have embedded line items in narrative prose. Extraction accuracy varies by format. Which approach is MOST EFFECTIVE?

A) Increase model temperature to encourage creative parsing across formats.

B) Add few-shot examples explicitly covering each format variance (inline, tabular, narrative) to show extraction for each.

C) Refine the prompt to include detailed format-parsing instructions for each variant.

D) Use separate extraction models fine-tuned for each format; route documents by format first.

**Correct answer: B**

**Reasoning:** Few-shot examples are the most effective technique for handling format variance. Showing concrete examples of "here is an inline invoice → here is extraction" teaches generalization better than instructions alone. (A) temperature doesn't help; it increases randomness. (C) detailed instructions help but are less effective than few-shot. (D) over-engineers; few-shot solves it without fine-tuning or routing.

---

### Question 8: Confidence Calibration and Routing

**Stem:** You've labeled 200 invoices for validation. Extractions marked "high confidence" had 3 errors; "medium confidence" had 40 errors out of 50; "low confidence" had 45 errors out of 50. You want to minimize human review cost while keeping error rate under 5%. What's the right calibrated routing policy?

A) Route all "low" and "medium" to human review; auto-accept "high" (3 errors out of 100 = 3% error rate, under the 5% threshold).

B) Route only "low" to human review; sample "medium" at 50% (too high error rate to auto-accept).

C) Auto-accept "high" and "medium"; route "low" (sample sizes are too small to calibrate).

D) Route all extractions to human review; confidence scores are not reliable signals.

**Correct answer: A**

**Reasoning:** Calibrate thresholds to your labeled data. "High" confidence = 3% error rate (< 5% acceptable). "Medium" = 80% error rate (way above threshold). "Low" = 90% error rate. Route "low" and "medium" to humans; auto-accept "high." (B) is safer but misses the calibration of medium (80% error is unacceptable). (C) is wrong - "medium" clearly has high error rate. (D) abandons calibration prematurely.

---

### Question 9: Provenance and Conflict Attribution

**Stem:** You extract annual revenue from three credible sources: earnings report says $10M, audited financials say $9.8M, investor presentation says $10.2M. How should you report this?

A) Pick the audited figure ($9.8M) as the most authoritative; use that as the extracted value.

B) Average the three ($10M) as a compromise; record extraction confidence as "medium."

C) Annotate all three values with their sources, publication dates, and methodologies; note the conflict; let downstream systems decide reconciliation.

D) Flag as "conflict detected"; discard all three and manually investigate.

**Correct answer: C**

**Reasoning:** Preserve provenance and uncertainty. Don't arbitrarily pick one (loses information). Annotate all with source attribution and dates; let humans/business logic decide. (A) loses uncertainty and explanation. (B) invents a value not in any source (introduces hallucination). (D) over-escalates; the conflict is informative, not an error.

---

### Question 10: Detection Patterns and False-Positive Analysis

**Stem:** Your extraction system marks 5% of extracted fields as "unclear" or "low confidence," routing them to human review. Humans review a sample and find that 95% of these flagged extractions are actually correct. The system is over-flagging. To improve, what should you prioritize?

A) Increase model temperature to reduce conservatism.

B) Analyze detected_pattern fields to understand which constructs trigger dismissals; refine few-shot examples for those patterns.

C) Remove the confidence routing entirely; auto-accept all extractions.

D) Retrain the model with higher confidence thresholds.

**Correct answer: B**

**Reasoning:** Use `detected_pattern` field to understand WHY the model flagged something as unclear. Maybe certain formats or field types consistently trigger false dismissals. Refine few-shot examples for those patterns (e.g., "here is an invoice with embedded line items → here is correct extraction"). (A) temperature increases hallucination. (C) removes safety mechanism. (D) isn't practical without retraining.

---

## Quick-Reference Cheat Sheet

1. **tool_use with JSON schema** = guaranteed JSON syntax correctness (not semantic correctness).

2. **tool_choice "auto"** = may return text; use when conversational fallback acceptable.

3. **tool_choice "any"** = must call tool, model picks; use when document type unknown.

4. **tool_choice forced** = must call specific tool; use when ordering/schema mandatory.

5. **Required fields only for always-present info** - missing info + required = fabrication.

6. **Optional/nullable fields** prevent hallucination by allowing null instead of invention.

7. **Enum + "other" + detail string** = extensible without schema breakage.

8. **"unclear" enum value** signals ambiguity for human review instead of forced guessing.

9. **calculated_total vs stated_total** + `conflict_detected` flag data quality issues without picking.

10. **detected_pattern field** enables analysis of false-positive dismissals.

11. **Validation-retry with error feedback** = effective for format/parsing errors only.

12. **Retry is futile when info is absent** (model returns null) - check before retrying.

13. **Aggregate accuracy hides per-segment failures** - always segment by doc type and field.

14. **Stratified random sampling** detects drift and novel patterns post-deployment.

15. **Field-level confidence calibrated on labeled validation data** - don't use generic thresholds.

16. **Batch API (50% cost, 24h max) for non-blocking; sync for blocking** - never swap them.

17. **custom_id correlates batch pairs** - resubmit only failed IDs.

18. **Sample-refine before bulk batch** on 50-100 docs first.

19. **Claim-source mappings preserved through extraction and synthesis** - provenance critical.

20. **Conflicting values annotated with attribution, not picked arbitrarily** - preserve uncertainty.

21. **Publication/collection dates required** to distinguish temporal from data errors.

22. **Format normalization rules in prompt** reduce validation errors.

23. **Few-shot examples covering varied source structures** enable generalization.

24. **No multi-turn tool calling in batch API** - design for single-turn extraction.

25. **Render content type appropriately** (financials as tables, news as prose) preserve semantics.

