---
name: OpenSpec Due Diligence
description: Due diligence review for OpenSpec proposals - ironclad verification.
---

ultrathink Read ALL .md files for the entire openspec proposal you just created, fully, no partial read or dumbass grep. Full file reads only!! And then due diligence check it everything... It should be ironclad... No top heavy things like "do this" but no why or how... Should be zero detective work, everything needed to know from schemas to code reference to architecture should all be in proposal, make sure the spec.md files are created correctly following openspec rules. Any future AI or human should just be able to read it and run with it. No ticket for the ticket investigations... A complete ticket that covers everything the ticket needs to know from why, how, what, the moon...

**Target**: $ARGUMENTS (OpenSpec proposal or directory to check)

---

## THE STANDARD - IRONCLAD SPECS

This is NOT a casual review. This is verification that the spec is COMPLETE and ACTIONABLE.

**A GOOD SPEC HAS:**
- WHY: Clear problem statement and motivation
- WHAT: Explicit scope, deliverables, and acceptance criteria
- HOW: Detailed implementation approach with code references
- CONTEXT: Schema snippets, architecture notes, relevant existing code
- DEPENDENCIES: What needs to exist first, what this affects
- EDGE CASES: Handled explicitly, not left to "figure it out"

**A BAD SPEC HAS:**
- "Implement feature X" with no implementation details
- References to code without file:line citations
- Assumptions about existing architecture not verified
- Missing schema definitions
- "TBD" or "figure out later" sections
- Requires reading 10 other files to understand

---

## PHASE 1: Full Read (NO SHORTCUTS)

1. Read EVERY .md file in the proposal directory
2. Read the main spec.md completely
3. Read any referenced architecture docs
4. Read any schema files mentioned
5. **NO GREP. NO PARTIAL READS. FULL FILES ONLY.**

---

## PHASE 2: Completeness Check

### Does it explain WHY?
- [ ] Problem statement is clear
- [ ] Motivation explains business/technical value
- [ ] Current state is documented
- [ ] Desired end state is explicit

### Does it explain WHAT?
- [ ] Scope boundaries are defined (what's in, what's out)
- [ ] Deliverables are listed
- [ ] Acceptance criteria are measurable
- [ ] Breaking changes are flagged

### Does it explain HOW?
- [ ] Implementation approach is detailed
- [ ] Code locations are cited (file:line)
- [ ] Database schema changes are specified
- [ ] API changes are documented
- [ ] Migration path is clear (if applicable)

### Is context embedded?
- [ ] Relevant schema snippets are IN the spec
- [ ] Architecture decisions are explained
- [ ] Existing code patterns are referenced
- [ ] Dependencies are listed with versions

---

## PHASE 3: Actionability Check

**The Test**: Could a developer who has NEVER seen this codebase implement this spec by reading ONLY the spec files?

Check for:
- Detective work required? **FAIL**
- Need to grep around to find things? **FAIL**
- Assumptions about "obvious" architecture? **FAIL**
- References to "see code" without file:line? **FAIL**
- Missing schema definitions? **FAIL**
- Unclear execution order? **FAIL**

---

## PHASE 4: OpenSpec Compliance

Verify against openspec rules:
- [ ] Follows directory structure
- [ ] Has required sections
- [ ] Status is correct
- [ ] Links are valid
- [ ] No orphaned references

---

## OUTPUT FORMAT

```markdown
# Due Diligence: [Spec Name]

**Reviewed**: [Date]
**Verdict**: PASS / NEEDS WORK / FAIL

## Summary

| Category | Status | Issues |
|----------|--------|--------|
| WHY | PASS/FAIL | X |
| WHAT | PASS/FAIL | X |
| HOW | PASS/FAIL | X |
| Context | PASS/FAIL | X |
| Actionability | PASS/FAIL | X |
| OpenSpec Compliance | PASS/FAIL | X |

## Critical Gaps

### Missing Information
- [What's missing, why it matters]

### Unclear Sections
- [Section] - [What's unclear, what it should say]

### Detective Work Required
- [What would someone need to hunt down]

## Specific Fixes Required

### 1. [Fix Title]
- **Location**: [spec file:section]
- **Current**: [What it says now]
- **Required**: [What it should say]
- **Why**: [Why this matters]

## Files Read
- [List every file you read completely]

## Verdict Reasoning
[Why PASS/NEEDS WORK/FAIL]
```

---

## RULES

- **FULL READS ONLY** - No grep, no partial reads, no skimming
- Every gap needs a specific fix, not "add more detail"
- The spec should be self-contained
- If you need to check external files to understand the spec, IT'S INCOMPLETE
- Zero detective work means ZERO
- A human/AI should read spec and execute, not read spec then investigate
