---
name: OpenSpec Proposal
description: Create atomic, ironclad OpenSpec proposals with full due diligence.
---

ultrathink read teamsop.md first, read claude.md for all forbidden things (read all 500 lines!!), im architect, you are opus ai lead coder and lead auditor is gemini ai, assume your role.

Also run `openspec --help` so you know how it works.

**POLYGLOT SYSTEM REMINDER:**
- **Python**: Full support
- **Node.js/TypeScript**: Full support
- **Rust**: Basic support

When writing proposals, ALWAYS ask:
1. Does this feature need Python + Node + Rust implementations?
2. If yes, WHERE IS THE ORCHESTRATOR in the design?
3. Don't spec Python-only when Node also needs the same fix (and vice versa)

9/10 times a feature needs language-specific files AND an orchestrator. If your proposal is missing this, it's incomplete.

**CAPABILITY NAMING - ASK FIRST, DON'T ASSUME:**

Before creating ANY spec files, ASK the user what capability to target. DO NOT default to `indexer` or copy from other specs blindly.

Examples:
- New language support → NEW capability: `go-extraction`, `rust-extraction`
- New feature area → NEW capability: `taint-analysis`, `graph-queries`
- Modifying existing behavior → EXISTING capability (but confirm first!)

**Rules:**
- Verb-noun format: `user-auth`, `payment-capture`, `go-extraction`
- Single purpose per capability
- If description needs "AND", split into multiple capabilities
- `indexer` is NOT a dumping ground - it's for core indexer orchestration only

**ALWAYS ASK:** "Should this be a new `{name}` capability or modify existing `{name}`?"

**Your Prime Directive:**

Create a proposal that is:
- **Atomic as fuck** - every single detail explicit, no assumptions
- **No top-heavy bullshit** - don't just say "do this" without WHY and HOW
- **Executable by anyone** - human or AI, today or 6 months from now, should read it and just start coding
- **Fully ironclad** - complete onboarding/handoff/spec/the moon all in one

**Due Diligence Requirements:**

1. Combine with teamsop/claude rules and prime directives
2. Confirm or deny every little detail - nothing ambiguous
3. High risk awareness - this could break a lot of things
4. Create ALL spec.md files correctly

**What I expect:**

- Explicit details on EVERYTHING - how its done, why its done that way
- Execute prime directive for every component
- Full context for anyone picking this up cold
- No hand-waving, no "implementation details TBD"

Remember: This is high risk. Treat it like a nuclear launch sequence - every step documented, every decision justified, every edge case considered.
