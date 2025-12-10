---
name: SOP Completion Report
description: Generate teamsop.md-compliant completion report with actual code evidence.
---

ultrathink Generate a teamsop.md Template C-4.20 compliant completion report for work done this session.

**CRITICAL RULES:**

1. **SHOW THE CODE** - Every change needs Before/After/New snippets. No "I updated the function" without showing WHAT changed.

2. **NO TRUST-ME CLAIMS** - If you say you fixed something, PROVE IT with the actual code diff. The Architect doesn't want "fixed the bug" - they want to SEE the fix.

3. **SKIP THE FLUFF** - No HTML dividers, no fancy formatting, no bracket decorations. Plain markdown, actual content.

4. **BALANCE** - Show the relevant 5-15 lines around each change, not entire 500-line files. Context matters, but so does readability.

5. **FILE:LINE ALWAYS** - Every code reference needs `path/to/file.py:123` format.

---

## REPORT STRUCTURE (Template C-4.20)

```markdown
# Completion Report

**Phase**: [What was being worked on]
**Objective**: [The goal]
**Status**: COMPLETE | PARTIAL | COMPLETE_WITH_WARNINGS | BLOCKED

---

## 1. Verification Phase (What We Found)

### Initial Hypotheses vs Reality

| Hypothesis | Verification | Evidence |
|------------|--------------|----------|
| [What we assumed] | CONFIRMED/REFUTED | [File:line that proves it] |

### Discrepancies Found
- [Any mismatches between expectations and reality]

---

## 2. Root Cause Analysis

**Surface Symptom**: [What was broken/needed]

**Problem Chain**:
1. [First domino]
2. [Second domino]
3. [Root cause]

**Why This Happened**: [Technical reason]

---

## 3. Implementation Details

### Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `path/to/file.py` | N changes | [Brief description] |

### Change #1: [Title]

**Location**: `file.py:123-145`

**Before**:
```python
# The broken/old code (5-15 lines of context)
def old_function():
    broken_logic_here()
```

**After**:
```python
# The fixed/new code (5-15 lines of context)
def fixed_function():
    correct_logic_here()
```

**Why**: [1-2 sentence explanation]

### Change #2: [Title]
[Same format...]

---

## 4. Edge Cases Considered

- **Empty/Null**: [How handled]
- **Boundaries**: [Min/max behavior]
- **Error States**: [What happens on failure]

---

## 5. Post-Implementation Audit

**Files Re-read**: [List files verified after changes]

**Result**: SUCCESS/ISSUES_FOUND

**Verification**:
```bash
# Command run to verify
$ aud full --offline
# Result summary
```

---

## 6. Impact & Reversion

**Immediate Impact**: [What's affected]
**Downstream Impact**: [Ripple effects]

**Reversion**:
```bash
git revert <commit>  # or specific steps
```

---

## Summary

**What was broken**: [1 line]
**What we fixed**: [1 line]
**How we know it works**: [1 line]
**Confidence**: High/Medium/Low
```

---

## EXECUTION INSTRUCTIONS

1. **Gather Evidence** - Use `git diff` to see actual changes made this session
2. **Extract Code Snippets** - Pull the Before/After directly from diffs or file reads
3. **Verify Claims** - Re-read modified files to confirm changes are correct
4. **Generate Report** - Fill in Template C-4.20 with ACTUAL evidence

---

## ANTI-PATTERNS TO AVOID

**BAD** (Trust-me report):
```
Fixed the schema mismatch issue in FCE.
- Updated the query
- Changed column names
- Works now
```

**GOOD** (Evidence-based report):
```
### Change #1: Fix GraphQL findings query schema mismatch

**Location**: `theauditor/fce.py:348-374`

**Before**:
```python
cursor.execute("""
    SELECT finding_type, schema_file, field_path, line, severity
    FROM graphql_findings_cache
""")
```

**After**:
```python
cursor.execute("""
    SELECT fc.rule, gt.schema_path,
           gt.type_name || '.' || gf.field_name as field_path,
           gf.line, fc.severity, fc.details_json
    FROM graphql_findings_cache fc
    LEFT JOIN graphql_fields gf ON fc.field_id = gf.field_id
    LEFT JOIN graphql_types gt ON gf.type_id = gt.type_id
""")
```

**Why**: Schema uses normalized tables (rule, details_json) not denormalized columns (finding_type, description). Query now JOINs to reconstruct field paths.
```

---

## NOW GENERATE THE REPORT

Look at what was done this session and produce the Template C-4.20 report with real code evidence.
