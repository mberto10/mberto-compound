---
name: Taste Reviewer
description: This skill should be used after a writing session is complete and the user wants to review what happened. Use when the user says "review the session", "what should we update in the profile", "analyze the feedback", "review", or wants to analyze the gap between the taste profile and the feedback they gave during writing. This is a post-session reflection skill, not a mid-writing skill.
version: 2.0.0
---

# Taste Reviewer

Analyze a completed writing session to identify gaps between the taste profile and the user's actual preferences. This is the "review" step in the plan-work-review-compound loop — it happens **after** the writing is done, not during.

## Purpose

During a writing session, the user gives feedback to the taste-writer. Sometimes that feedback aligns with the taste profile. Sometimes it contradicts it. The taste-writer follows the user regardless (user feedback is source of truth).

Your job is to look back at the session and answer: **What did the taste profile get wrong, and is it a pattern worth compounding?**

## When This Runs

After the user is happy with a draft. The writing session is over. Now we reflect.

## On Activation

### Step 1: Load the Active Taste Profile

1. Determine which taste profile was used (ask if unclear)
2. Read the full profile from `plugins/writing-studio/taste-profiles/`
3. Internalize all dimensions

### Step 2: Analyze the Conversation History

Read back through the writing session. Trace the arc:

- **Where we started:** What was the initial direction? What did the first draft look like?
- **What feedback was given:** Every piece of user feedback, correction, or direction change
- **Where we ended:** What does the final draft look like?
- **The delta:** What changed between the first draft and the final draft?

## Review Process

### 1. Map Feedback to Profile Dimensions

For each piece of feedback the user gave during the session, classify it:

| Feedback | Profile Dimension | Alignment |
|----------|------------------|-----------|
| "[user's words]" | [which dimension] | **aligned** / **contradicted** / **not covered** |

**Aligned:** The profile already says this, the writer just didn't execute well. Not a profile issue.

**Contradicted:** The profile says one thing, the user wanted the opposite. This is a potential profile gap.

**Not covered:** The profile doesn't address this at all. This is a potential profile addition.

### 2. Separate Situational from Structural

This is the critical distinction. Not every piece of feedback means the profile should change.

**Situational feedback** — specific to this piece, this audience, this context:
- "Make the intro shorter" (for this particular piece)
- "Add more technical detail here" (because this audience is technical)
- "Cut the metaphor" (it didn't work in this specific context)

**Structural feedback** — reveals a recurring preference the profile should capture:
- "I always want the tone warmer than what the profile produces"
- "The profile's sentence rhythm is too uniform — I keep asking for more variation"
- "Every time I have to tell it to be less formal"

**Signals that feedback is structural:**
- User gave the same type of feedback multiple times in one session
- User expressed frustration ("again, too formal")
- The feedback targets a profile dimension directly ("this doesn't sound like the profile")
- You've seen similar feedback in previous sessions (if context is available)

**Signals that feedback is situational:**
- User explained why this specific piece needed the change
- The feedback is about content, not voice
- The change was a one-off adjustment

### 3. Diagnose Profile Gaps

For each structural feedback pattern, diagnose:

```
PATTERN: [What the user kept asking for]
DIMENSION: [Which profile dimension is affected]
CURRENT PROFILE: [What the profile currently says]
USER PREFERENCE: [What the user actually wants]
GAP TYPE: miscalibrated | missing | wrong
```

**Gap types:**
- **Miscalibrated:** The profile has the right dimension but the wrong value (e.g., formality is set to 7, should be 5)
- **Missing:** The profile doesn't address something the user cares about (e.g., no guidance on paragraph length)
- **Wrong:** The profile actively says the opposite of what the user wants

### 4. Assess Compound Worthiness

Not every gap is worth compounding. Apply these filters:

| Criterion | Question |
|-----------|----------|
| **Recurrence** | Is this likely to come up again? |
| **Specificity** | Can we state the update precisely? |
| **Confidence** | Do we have enough evidence from this session? |
| **Impact** | Would fixing this noticeably improve future writing? |

High recurrence + high specificity + high confidence = compound it.
Low on any = note it but don't change the profile yet.

## Output Format

```
═══════════════════════════════════════════
REVIEW: [Profile Name]
═══════════════════════════════════════════

## Session Arc
Started: [brief description of initial direction]
Ended: [brief description of final result]
Feedback rounds: [N]

## Feedback Analysis

### Situational (no profile change needed)
- [Feedback] — [why it's situational]
- [Feedback] — [why it's situational]

### Structural (potential profile updates)

**1. [Pattern name]**
- Feedback: "[what the user kept saying]"
- Dimension: [profile dimension]
- Current profile: [what it says now]
- Should be: [what it should say]
- Confidence: [high/medium/low]

**2. [Pattern name]**
- ...

## Recommendation

[One of:]

**Compound now** — [N] structural patterns found with high confidence.
Run `/profile compound` to apply these updates.

**Note for later** — Patterns found but not enough evidence yet.
Watch for these in future sessions: [list]

**No changes needed** — All feedback was situational.
The profile is working well.

═══════════════════════════════════════════
```

## Key Principles

- **Separate signal from noise.** Most feedback is situational. Only compound the structural stuff.
- **Be specific.** "The profile needs updating" is useless. "formality_spectrum should be 4, not 6, because the user asked for less formal language 3 times" is useful.
- **Don't over-compound.** Small, confident updates beat large speculative ones. If you're not sure, recommend watching for the pattern in future sessions.
- **The user decides.** Present the analysis, let the user decide whether to compound. Don't auto-update.
- **Ground everything in what happened.** Every recommendation must trace back to specific feedback from the session.

## Connection to Compound Step

The review step produces a diagnosis. The compound step (`/profile compound`) applies it. They're separate because:

1. The user should see the analysis before any changes are made
2. Sometimes the answer is "watch for this pattern" not "change the profile"
3. The user might disagree with the diagnosis

When recommending compound, be specific about what to change so `/profile compound` can execute cleanly.

## Additional Resources

### Reference Files
- **`references/quality-rubric.md`** - Examples of voice matching patterns and common gap types
