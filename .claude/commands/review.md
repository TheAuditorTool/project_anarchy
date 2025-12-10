---
name: Engine Check
description: Due diligence review for modernization and quality without over-engineering.
---

ultrathink Read `teamsop.md` first, read `CLAUDE.md` for all forbidden things (read ALL 500 lines!!). I'm the Architect, you are Opus AI Lead Coder checking this with Lead Auditor (Gemini AI) mindset.

**Target**: $ARGUMENTS (engine, module, or directory to check)

---

## THE BALANCE - READ THIS FIRST

This is NOT a code style review. This is NOT a "make it look like Netflix architecture" exercise.

**WE CARE ABOUT:**
- Does it work? Does it do what it's supposed to do well?
- Hidden fallbacks (ZERO FALLBACK POLICY - read CLAUDE.md!)
- Actual inefficiencies (O(N*M) when O(M) is possible)
- AI slop code that snuck in
- Dead code, orphaned logic, commented-out garbage
- Real bugs and real problems
- 2025 best practices that ACTUALLY MATTER

**WE DON'T CARE ABOUT:**
- Developer purist fetishes (dataclasses everywhere, 47 tiny files for "separation of concerns")
- Code style nitpicks
- "This could be more elegant" suggestions
- Enterprise patterns for enterprise sake
- Theoretical future flexibility we'll never need

**THE RULE:** If fixing it doesn't make it work better, run faster, or prevent bugs - we probably don't care.

---

## SUPPORTED ECOSYSTEMS - POLYGLOT REMINDER

- **Python**: Full support
- **Node.js/TypeScript**: Full support
- **Rust**: Basic support

**CRITICAL ARCHITECTURE INSIGHT:**

This is a polyglot system. When checking ANY feature, ask:
1. Does this have a Python implementation? (`*_python.py` or similar)
2. Does this have a Node implementation? (`*_node.js` or similar)
3. Does this have a Rust implementation? (basic, if applicable)
4. **WHERE IS THE ORCHESTRATOR?** (9/10 times we need one and forget)

If you're checking Python code, don't ignore that Node exists (and vice versa).
If there's no orchestrator coordinating language-specific modules, FLAG IT - we'll buttfuck ourselves with refactors later.

---

## PHASE 1: Understand What It Does

Before checking anything, understand the target:

```bash
aud explain <target>
aud blueprint --structure    # If checking a whole module
```

1. What is this supposed to do?
2. What are its inputs and outputs?
3. Who calls it? What does it call?

---

## PHASE 2: ZERO FALLBACK Violations (CRITICAL)

This is the #1 priority. Hunt down and flag:

- `try/except` blocks that return empty or default values
- Multiple query attempts with fallback logic
- Table existence checks before queries
- `if not result: try_alternative()` patterns
- Silent error swallowing
- Any "graceful degradation" that hides bugs

**These MUST be fixed. No exceptions. No "but it works." It hides bugs.**

Also check for:
- Old comments that reference removed code
- Legacy compatibility shims still in place
- Backwards compatibility hacks (we don't need them - user-generated DB, no migrations)

---

## PHASE 3: Functionality & Logic Issues

Check for actual problems:

### Inefficient Logic
- O(N*M) loops that could be O(M) with a dict/set
- Repeated database queries in loops (N+1 problems)
- Re-parsing the same data multiple times
- Building strings in loops instead of joins

### AI Slop Code
- Functions that do nothing useful
- Overly complex logic for simple tasks
- Copy-pasted blocks with minor variations
- Unused parameters being passed around
- "Just in case" code that handles impossible cases

### Dead Code
- Functions with no callers
- Branches that can never execute
- Commented-out code blocks (DELETE THEM)
- Imports never used

### Real Bugs
- Logic errors
- Off-by-one mistakes
- Null/None not handled where it should be
- Race conditions (if applicable)

---

## PHASE 4: Modernization (2025 Practices That Matter)

Only suggest modernization that provides REAL benefit:

**YES - These matter:**
- Using pathlib instead of os.path string manipulation
- f-strings instead of .format() or % formatting
- Type hints on public APIs (helps tooling and understanding)
- Context managers for resources
- walrus operator where it genuinely simplifies
- match/case for complex branching (Python 3.10+)
- Proper async where I/O bound operations exist

**NO - Don't bother:**
- Converting everything to dataclasses/pydantic "just because"
- Splitting files for "separation of concerns" when one file is fine
- Adding abstractions for "future flexibility"
- Enforcing strict typing on internal code
- Any pattern that adds complexity for marginal gain

---

## PHASE 5: Optimization Opportunities

Look for actual performance wins:

- Database query optimization (indexes, query structure)
- Caching opportunities for expensive repeated operations
- Early exits that avoid unnecessary work
- Batch operations instead of individual calls
- Memory issues (loading huge data when streaming would work)

---

## OUTPUT FORMAT

Produce a phased remediation plan:

```markdown
# Engine Check: [Target]

**Checked**: [Date]
**Scope**: [What was reviewed]

## Summary

- **Critical (ZERO FALLBACK)**: X issues
- **Functionality/Logic**: X issues
- **Modernization**: X opportunities
- **Optimization**: X opportunities

## Phase 1: Critical Fixes (Do First)

### ZERO FALLBACK Violations

#### [Issue Title]
- **Location**: `file.py:123`
- **Problem**: [What's wrong]
- **Code**:
```python
# Current (BAD)
try:
    result = query()
except:
    result = []  # HIDDEN FALLBACK
```
- **Fix**: [Specific change]

### Dead Code to Delete
- `file.py:45-67` - [What it is, why delete]

### Legacy Cruft to Remove
- [Old comments, compatibility shims, etc.]

## Phase 2: Functionality Fixes

### Logic Issues
[Same format - location, problem, fix]

### AI Slop to Clean
[Same format]

## Phase 3: Modernization (Optional but Recommended)

### Worth Doing
- [Change] - [Why it actually helps]

### NOT Worth Doing (Don't Bother)
- [What someone might suggest] - [Why we skip it]

## Phase 4: Optimization (If Time Permits)

### Performance Wins
- [Location] - [Current O(?) to O(?)] - [How to fix]

## Execution Order

1. [First thing to do]
2. [Second thing]
...

## Questions Before Starting
[Any clarifications needed]
```

---

## RULES

- Read the ENTIRE target before making judgments
- Verify issues against actual code, not assumptions
- Every issue needs a specific fix, not "consider refactoring"
- Prioritize: ZERO FALLBACK > Bugs > Inefficiency > Modernization
- If in doubt whether something matters: it probably doesn't
- Don't create 20-file maintenance nightmares to fix a 1-file "monolith"
- We're building a tool that works, not a museum piece of perfect code
