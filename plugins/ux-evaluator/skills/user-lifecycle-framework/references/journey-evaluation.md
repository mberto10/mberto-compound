# Journey Evaluation Guide

What to observe and document at each stage of the user journey during dogfooding.

---

## The User Mindset

Before evaluating, adopt the user's mindset completely:

```
┌─────────────────────────────────────────────────────────────────────┐
│  "I am [target user] trying to [accomplish goal].                   │
│   I expect this product to help me [value proposition].             │
│   I will be satisfied if I can [success criteria]."                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle:** React authentically. Don't make excuses for the product. If something confuses you, it will confuse real users.

---

## Journey Stages

### DISCOVER Stage

**User question:** "Why should I care about this?"

**What to observe:**

| Aspect | Questions to Ask Yourself |
|--------|---------------------------|
| First Impression | What do I think this product does? (within 5 seconds) |
| Value Clarity | Do I understand how this helps me? |
| Relevance | Does this seem made for someone like me? |
| Trust | Do I trust this enough to try it? |
| Next Step | Is it obvious what to do next? |

**Common issues to watch for:**
- Value proposition is vague or jargon-heavy
- Benefits are stated as features
- No clear call to action
- Looks outdated or untrustworthy
- Can't tell who this is for

**Document:**
```
First impression: [What I thought in first 5 seconds]
Value understood: [Yes/Partial/No - what I think it does]
Relevant to me: [Yes/No - why]
Trust level: [High/Medium/Low - why]
Clear next step: [Yes/No - what I think I should do]
```

---

### SIGN UP Stage

**User question:** "Let me in - is this going to be painful?"

**What to observe:**

| Aspect | Questions to Ask Yourself |
|--------|---------------------------|
| Friction | How much effort does this require? |
| Trust | Am I comfortable giving this information? |
| Clarity | Do I understand what I'm signing up for? |
| Options | Can I use a method I prefer? (social, email) |
| Errors | If something goes wrong, can I recover? |

**Common issues to watch for:**
- Too many required fields
- Asking for information I don't want to give
- Password requirements unclear until I fail
- No social sign-up options
- Confusing error messages
- Terms/privacy buried or scary

**Test scenarios:**
1. Happy path - complete signup normally
2. Error path - enter invalid email, weak password
3. Edge case - try to go back, refresh mid-signup

**Document:**
```
Field count: [N required, M optional]
Effort level: [Low/Medium/High]
Social options: [List available]
Error clarity: [Good/Okay/Poor - example]
Trust concerns: [Any hesitations]
Time to complete: [Approximate]
```

---

### ONBOARD Stage

**User question:** "Help me get started - don't overwhelm me"

**What to observe:**

| Aspect | Questions to Ask Yourself |
|--------|---------------------------|
| Progress | Do I know where I am in the process? |
| Purpose | Do I understand why each step matters? |
| Control | Can I skip things I don't want to do now? |
| Guidance | Is it clear what I should do at each step? |
| Confidence | Do I feel like I'm learning, not struggling? |

**Common issues to watch for:**
- No progress indicator
- Steps that feel mandatory but shouldn't be
- Asking for information I don't have yet
- No explanation of terms/concepts
- Can't skip or come back later
- Overwhelming amount of information

**Test scenarios:**
1. Complete path - go through all steps
2. Skip path - try to skip optional steps
3. Abandon path - leave mid-onboard, return later

**Document:**
```
Steps: [N total]
Progress visibility: [Yes/No - type]
Skip options: [Available/Not available]
Blocking points: [Any place I got stuck]
Concepts unclear: [Terms or ideas I didn't understand]
Time to complete: [Approximate]
```

---

### ACTIVATE Stage

**User question:** "Show me this is useful - give me my aha moment"

**What to observe:**

| Aspect | Questions to Ask Yourself |
|--------|---------------------------|
| Time to Value | How long until I get something useful? |
| Clarity | Do I understand what I just accomplished? |
| Satisfaction | Does this feel like a win? |
| Next Steps | Do I know what to do next? |
| Hook | Do I want to do this again? |

**Common issues to watch for:**
- Too much setup before first value
- First success feels trivial or unclear
- No celebration or acknowledgment
- Dead end after success
- Value doesn't match expectation set in DISCOVER

**This is the most critical stage.** The "aha moment" is where users become believers or abandon.

**Document:**
```
Time from signup to first value: [Duration]
First meaningful action: [What I did]
Result quality: [Did it meet expectations?]
Aha moment: [Yes/No - what was it?]
Emotional response: [How I felt]
Want to continue: [Yes/No - why]
```

---

### ADOPT Stage

**User question:** "This is how I use it - is the workflow smooth?"

**What to observe:**

| Aspect | Questions to Ask Yourself |
|--------|---------------------------|
| Efficiency | Can I do the main thing quickly? |
| Consistency | Are interactions predictable? |
| Learning | Am I getting faster with practice? |
| Shortcuts | Are there ways to speed up common tasks? |
| Reliability | Does it work every time? |

**Common issues to watch for:**
- Core workflow requires too many steps
- Inconsistent UI patterns
- No keyboard shortcuts or bulk actions
- Frequent errors in main workflow
- Features hidden or hard to find
- Slow performance during main tasks

**Test scenarios:**
1. Core loop - complete the main workflow 3 times
2. Efficiency - try to find faster ways to do things
3. Error recovery - make a mistake, try to fix it

**Document:**
```
Core workflow steps: [N steps to complete main task]
Time per completion: [Average]
Consistency: [Same patterns throughout?]
Shortcuts available: [Yes/No - which]
Errors encountered: [Any in main flow?]
Learning curve: [Getting easier?]
```

---

### ENGAGE Stage

**User question:** "I check this regularly - is there a reason to come back?"

**What to observe:**

| Aspect | Questions to Ask Yourself |
|--------|---------------------------|
| Return Trigger | What would make me come back tomorrow? |
| New Content | Is there something new/fresh when I return? |
| Notifications | Are alerts valuable or annoying? |
| Progress | Can I see my progress over time? |
| Habit | Does this fit into my routine? |

**Common issues to watch for:**
- No reason to return regularly
- Notifications are spammy or irrelevant
- Dashboard shows stale content
- No sense of progress or achievement
- Product feels "done" after first use

**Document:**
```
Return trigger: [What would bring me back]
Notification value: [Helpful/Neutral/Annoying]
Fresh content: [Yes/No - what changes]
Progress visibility: [Can I see growth?]
Habit potential: [Could this become routine?]
```

---

## Observation Template

Use this for each step of the journey:

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP: [Number] - [Name/Location]                                    │
│ URL: [Current URL]                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ WHAT I SEE:                                                         │
│ [Describe the screen objectively]                                   │
│                                                                     │
│ WHAT I UNDERSTAND:                                                  │
│ [What's clear to me]                                                │
│                                                                     │
│ WHAT CONFUSES ME:                                                   │
│ [What's unclear or ambiguous]                                       │
│                                                                     │
│ WHAT I WANT TO DO:                                                  │
│ [My intended action]                                                │
│                                                                     │
│ WHAT I TRY:                                                         │
│ [The action I take]                                                 │
│                                                                     │
│ WHAT HAPPENS:                                                       │
│ [The actual result]                                                 │
│                                                                     │
│ HOW I FEEL:                                                         │
│ [Emotional state: confident, confused, frustrated, delighted]       │
│                                                                     │
│ FINDING (if any):                                                   │
│ [Issue to document]                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Finding Severity Guide

**Critical** - Journey blocker
- I cannot continue without resolving this
- My data is lost or at risk
- Core functionality completely broken
- Example: Form won't submit, can't create account

**High** - Significant obstacle
- I can continue but experience is badly degraded
- Major confusion that might cause abandonment
- Important feature doesn't work
- Example: Save works but no confirmation (anxiety-inducing)

**Medium** - Noticeable friction
- Slows me down but doesn't block
- Requires extra effort or thought
- Minor feature broken
- Example: Extra click required, unclear label

**Low** - Polish issue
- Minor annoyance
- Aesthetic issue
- Nice-to-have missing
- Example: Typo, slightly slow loading

---

## Value Assessment Questions

After completing the journey, answer honestly:

| Question | Answer | Evidence |
|----------|--------|----------|
| Did I understand what this product is for? | Yes/Partial/No | [Why] |
| Could I accomplish the core workflow? | Yes/Partial/No | [What happened] |
| Did I experience an "aha" moment? | Yes/No | [What was it] |
| Does it deliver the stated value proposition? | Yes/Partial/No | [Gap if partial] |
| Would I come back and use this again? | Yes/No | [Why] |
| Would I recommend this to a colleague? | Yes/No | [Why] |

---

## Production Readiness Scoring

Calculate based on journey completion:

```
DISCOVER completed smoothly:     +15 points
SIGN UP completed smoothly:      +15 points
ONBOARD completed smoothly:      +20 points
ACTIVATE - aha moment achieved:  +25 points
ADOPT - core loop works:         +25 points

Deductions:
- Critical finding: -20 points each
- High finding: -10 points each
- Medium finding: -5 points each
- Low finding: -1 point each

TOTAL: [X]/100
```

**Readiness levels:**
- 90-100: Ready for public launch
- 75-89: Ready for beta users
- 60-74: Ready for alpha/internal testing
- Below 60: Not ready - critical gaps exist
