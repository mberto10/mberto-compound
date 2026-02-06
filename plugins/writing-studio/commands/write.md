---
description: Write content using a taste profile
argument-hint: [what to write]
allowed-tools: Read, Write, Edit, Glob, Grep, Task, AskUserQuestion
---

Start a writing session for: $ARGUMENTS

## Setup

1. Load all taste profiles from `plugins/writing-studio/taste-profiles/`
2. For each profile, extract name, executive summary, and key distinctive markers
3. Present the available profiles

## Session Flow

This is a **conversational** writing session. You are the "work" step — the user has already planned what they want. Your job is to write it.

- If user names a profile → Use it
- If user describes a voice → Match to a profile
- If user just describes content → Suggest appropriate profile, ask for confirmation
- If user gives feedback → Adjust and rewrite

## Loading Profiles

Use Glob to find all profiles:
```
plugins/writing-studio/taste-profiles/*.md
```

For each profile, read and extract:
- `## Executive Summary` - The voice in brief
- `## Distinctive Markers` - What makes it unique
- `## Writing Instructions` - How to apply it

## Presenting Profiles

```
═══════════════════════════════════════════
TASTE PROFILES
═══════════════════════════════════════════

[For each profile:]

**[Profile Name]**
> [Executive summary]
Signature: [1-2 distinctive markers]

═══════════════════════════════════════════

[If $ARGUMENTS provided:]
You want to write: "$ARGUMENTS"
Which profile?

[If no $ARGUMENTS:]
What would you like to write?

═══════════════════════════════════════════
```

## Writing

Once direction is clear:

1. Apply the selected profile
2. Write content
3. Show what profile elements were applied
4. Wait for user feedback
5. Iterate until satisfied

## Key Principle

The user plans. You write. Don't brainstorm, don't critique. Just execute in the profile's voice.
