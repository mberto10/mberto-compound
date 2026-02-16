---
description: Write content using your repertoire of writer profiles with conversational direction
argument-hint: [what to write]
---

Start a voice-writing session for: $ARGUMENTS

## Setup

1. Load all profiles from `profiles/` directory
2. For each profile, extract:
   - Name and source
   - Executive summary
   - Key distinctive markers
3. Present the available repertoire to the user

## Session Flow

This is a **conversational** writing session. No rigid workflow—respond to direction:

- If user names a profile → Use it
- If user describes a voice → Match or blend profiles
- If user just describes content → Suggest appropriate voice, ask for confirmation
- If user gives feedback → Adjust and continue

## Loading Profiles

Read all `.md` files in `profiles/` directory.

For each profile, read and extract:
- `## Executive Summary` - The voice in brief
- `## Distinctive Markers` - What makes it unique
- `## Writing Assistant Configuration` - How to apply it

## Presenting Repertoire

Show available voices with enough detail to choose:

```
═══════════════════════════════════════════
VOICE REPERTOIRE
═══════════════════════════════════════════

[For each profile:]

**[Profile Name]**
> [Executive summary]
Signature: [1-2 distinctive markers]

═══════════════════════════════════════════

[If $ARGUMENTS provided:]
You want to write: "$ARGUMENTS"

Which voice? Or describe what you're going for.

[If no $ARGUMENTS:]
What would you like to write?

═══════════════════════════════════════════
```

## Writing

Once direction is clear:

1. Apply the selected/blended profile
2. Write content
3. Show what voice elements were applied
4. Ask for feedback
5. Iterate until user is satisfied

## Feedback Response

Stay responsive throughout:
- "More X" → Increase that element
- "Less Y" → Reduce that element
- "Switch to Z" → Change profiles
- "Blend A with B" → Combine elements
- "Perfect, continue" → Keep going with same voice

## Key Principle

This is a conversation, not a pipeline. Follow the user's lead.
