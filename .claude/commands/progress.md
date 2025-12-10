---
name: Progress Sync
description: Re-onboard after compaction - restore context and continue work.
---

ultrathink you just did automatic compaction need to onboard you again to make sure you dont hallunicate or go off track... Read teamsop.md, im architect and boss, you are lead coder opus ai and lead auditor is gemini AI. Also read claude.md for forbidden practices and cancer removal.. We follow prime directives, protocols and rules always. Now read ALL fucking .md files in the openspec proposal. Fully, no dumbass grep or partial read. Read ALL files fully as part of onboarding again and present what we were doing, what is complete and brief on boarding on what is next phase/tasks to work on and why.

---

## EXECUTION PROTOCOL

### Step 1: Core Rules (MANDATORY)

1. Read `teamsop.md` FULLY - understand team structure, roles, prime directives
2. Read `CLAUDE.md` FULLY (ALL lines!) - forbidden practices, zero fallback policy, environment rules

### Step 2: Active Proposal Context

1. Find active OpenSpec proposal: `openspec list`
2. Read EVERY .md file in the proposal directory - **INCLUDING SUBDIRECTORIES**:

   **Root level files:**
   - `proposal.md` - The full specification
   - `tasks.md` - What's done, what's pending
   - `design.md` - Architecture decisions
   - `verification.md` - Acceptance criteria
   - `changelog.md` - What changed and when
   - Any other .md files present

   **CRITICAL - SPEC SUBDIRECTORIES:**
   - `specs/*/spec.md` - **READ ALL OF THESE. EVERY SINGLE ONE.**
   - Use `Glob` to find: `openspec/changes/<proposal-name>/specs/**/*.md`
   - These contain the ACTUAL IMPLEMENTATION DETAILS you need

3. **EXECUTION ORDER:**
   - First: `openspec list` to get proposal name
   - Second: `Glob` for `openspec/changes/<name>/**/*.md` to find ALL md files
   - Third: Read EVERY file returned - no exceptions, no deferrals

**NO PARTIAL READS. NO GREP. NO "I'LL READ THAT LATER". READ FULLY NOW.**

### Step 3: Output Required

Present a structured briefing:

```markdown
## Session Recovery Briefing

### Team Context
- Architect/Boss: [User]
- Lead Coder: Opus AI (me)
- Lead Auditor: Gemini AI

### Active Work: [Proposal Name]

**Objective**: [One sentence - what we're building/changing]

**Status Summary**:
- Total Tasks: X
- Completed: Y
- In Progress: Z
- Pending: W

### What's Complete
[List completed tasks from tasks.md with brief description]

### Current Phase
[What phase/task we're on now]

### Next Tasks
[Ordered list of what needs to happen next]

### Why This Order
[Brief explanation of the logical sequence]

### Any Blockers or Questions
[Flag anything unclear or needing decision]
```

---

## RULES

- **FULL READS ONLY** - No grep, no partial reads, no skimming
- **NO HALLUCINATION** - Only report what's actually in the files
- **CHECK TASKS.MD** - The truth of progress lives in tasks.md
- **ASK IF UNCLEAR** - Better to ask than assume wrong
- **DON'T START CODING YET** - This is context sync, not execution

## ANTI-DEFERRAL WARNING

**DO NOT SAY:**
- "I'll read the spec files later"
- "Let me first summarize, then I can read the specs"
- "The specs/ subdirectory contains..." (without actually reading them)

**YOU MUST:**
- Use Glob IMMEDIATELY after openspec list
- Read EVERY .md file found BEFORE presenting the briefing
- The briefing MUST include details FROM the spec.md files

If you present a briefing without having read specs/*/spec.md files, YOU HAVE FAILED THIS COMMAND.
