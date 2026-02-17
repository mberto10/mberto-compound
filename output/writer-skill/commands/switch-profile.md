---
description: Switch to a specific writer voice profile for the session
argument-hint: [profile name]
---

# Switch Voice Profile

Activate a specific writer profile: $ARGUMENTS

## Steps

1. Parse the profile name from $ARGUMENTS
2. Search `profiles/` for matching profile:
   - Try exact match first (case-insensitive)
   - Then partial match on filename
   - Then search executive summaries for author name

3. If profile found:
   - Load the full profile
   - Display confirmation with key voice elements
   - Apply profile to all subsequent writing in this session

4. If profile not found:
   - List available profiles
   - Suggest closest match if applicable

## Confirmation Format

```
═══════════════════════════════════════════
VOICE ACTIVATED: [Author Name]
═══════════════════════════════════════════

[Executive summary]

**Key elements now active:**
- Voice: [pronoun_default, narrative_distance]
- Tone: [baseline_tone, formality]
- Rhythm: [sentence length pattern]
- Signature: [2-3 distinctive markers]

**Avoid (anti-patterns):**
- [Anti-pattern 1]
- [Anti-pattern 2]

═══════════════════════════════════════════

Ready to write. What would you like me to create?
═══════════════════════════════════════════
```

## Profile Not Found Format

```
═══════════════════════════════════════════
PROFILE NOT FOUND
═══════════════════════════════════════════

No profile for "[requested name]" exists.

Available profiles:
[List all available profile names]

Options:
1. Choose from available profiles
2. Describe the voice you want (I can approximate)
3. Provide sample text to create a new profile

═══════════════════════════════════════════
```
