---
name: Start Ticket
description: Load a ticket, verify everything, and brief before implementation.
---

ultrathink Read `teamsop.md` first, read `CLAUDE.md` for all forbidden things (read all 500 lines!!). I'm the Architect, you are Opus AI Lead Coder, Lead Auditor is Gemini AI - assume your role.

**Target Ticket**: $ARGUMENTS

**PHASE 1: Full Ticket Ingestion (NO PARTIAL READS)**

Read ALL files in the ticket directory. Every single one:
- `proposal.md` - the full proposal
- `design.md` - technical design
- `tasks.md` - implementation tasks
- `spec.md` - specifications
- Any other `.md` files present

No grep. No sampling. No "I'll read this part later." Read the entire contents of every file NOW.

**POLYGLOT SYSTEM REMINDER:**
- **Python**: Full support
- **Node.js/TypeScript**: Full support
- **Rust**: Basic support

When reviewing tickets, CHECK:
1. Does this touch Python? Does Node need the same change?
2. Is there an orchestrator? If not, FLAG IT.
3. Don't start Python work if Node will be left broken (and vice versa).

---

**PHASE 2: Cross-Reference Against Reality**

Sanity check the ticket against:
1. **Current source code** - Does the proposal match what actually exists?
2. **Database schema** - Run `aud blueprint --structure` if needed
3. **Existing functionality** - Will this break anything? Conflicts?
4. **Dependencies** - Are all referenced modules/functions real?

Execute the Prime Directive from teamsop.md:
- List your hypotheses about what needs to happen
- Verify each against the actual codebase
- Document any discrepancies between ticket and reality

**PHASE 3: Soundness Check**

Verify the proposal is ready to build:
- [ ] No top-heavy vague bullshit - everything has explicit HOW and WHY
- [ ] Tasks are atomic and actionable
- [ ] No missing steps or hand-waved implementation details
- [ ] Edge cases considered
- [ ] No conflicts with existing code
- [ ] Rollback path clear if things go wrong

If something is wrong or unclear, FLAG IT. Don't proceed with broken specs.

**PHASE 4: Pre-Implementation Brief**

Provide a briefing covering:

```markdown
## Ticket Brief: [Ticket Name]

### What We're Doing
[One paragraph summary of the change]

### Why
[Business/technical reason this matters]

### How (High Level)
[Approach and key decisions]

### Risk Assessment
- **Breaking changes**: [Yes/No - what]
- **Dependencies**: [What this touches]
- **Rollback**: [How to undo if needed]

### Discrepancies Found
[Any mismatches between ticket and reality - or "None"]

### First Step
[Exact first task to execute, with file:line if applicable]

### Full Task Sequence
1. [Task 1]
2. [Task 2]
...

### Questions Before Starting
[Any clarifications needed - or "None, ready to proceed"]
```

**Rules:**
- NO implementation until briefing is acknowledged
- NO skipping files in the ticket
- NO assumptions - verify everything against source code
- FLAG problems immediately, don't paper over them
- If ticket is broken, say so - don't try to "make it work"
