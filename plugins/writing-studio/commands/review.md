---
description: Review a completed writing session — analyze feedback patterns and diagnose taste profile gaps
argument-hint: [optional focus or profile name]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

Review the writing session: $ARGUMENTS

## Purpose

This runs **after** a writing session is done. You look back at the conversation — where the writing started, what feedback the user gave, where it ended — and diagnose whether the taste profile needs updating.

## Workflow

### 1. Load the Taste Profile

1. Determine which taste profile was used in the writing session
2. If $ARGUMENTS names a profile, use that
3. If unclear, ask the user
4. Read the full profile from `plugins/writing-studio/taste-profiles/`

### 2. Analyze the Session

Read back through the conversation history and trace:

- **Starting point:** What was the initial direction and first draft?
- **Feedback given:** Every correction, adjustment, or direction change from the user
- **End result:** What the final draft looks like
- **The delta:** What changed and why

### 3. Classify Feedback

For each piece of user feedback, determine:

- **Which profile dimension** it maps to
- **Whether it aligned, contradicted, or wasn't covered** by the profile
- **Whether it's situational** (specific to this piece) or **structural** (a recurring preference)

### 4. Diagnose Gaps

For structural feedback only, identify:
- What the profile currently says
- What the user actually wants
- Whether it's miscalibrated, missing, or wrong

### 5. Recommend

One of three outcomes:

1. **Compound now** — High-confidence structural patterns found. Recommend `/profile compound`.
2. **Note for later** — Patterns found but not enough evidence. Watch in future sessions.
3. **No changes** — All feedback was situational. Profile is working.

## Key Principle

Most feedback is situational. Be conservative about recommending profile changes. Only compound what you're confident is a real, recurring pattern.
