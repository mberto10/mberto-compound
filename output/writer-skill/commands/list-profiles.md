---
description: List all available writer voice profiles
---

# List Writer Profiles

Display all available voice profiles with their key characteristics.

## Steps

1. Read all `.md` files in `profiles/` directory
2. For each profile, extract:
   - Profile name (from `# Writer Profile:` heading)
   - Executive summary
   - 2-3 key distinctive markers/signature moves
   - Confidence score

3. Present in this format:

```
═══════════════════════════════════════════
AVAILABLE VOICE PROFILES
═══════════════════════════════════════════

[For each profile:]

**[Author Name]** (Confidence: [score]/100)
> [Executive summary - 2 sentences max]

Signature moves:
- [Move 1]
- [Move 2]

---

═══════════════════════════════════════════

Use /write to start a writing session with any profile.
Use /switch-profile [name] to activate a specific voice.
═══════════════════════════════════════════
```
