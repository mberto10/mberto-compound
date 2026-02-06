---
description: Create or compound a taste profile from writing samples or feedback
argument-hint: <file-path, folder-path, or "compound">
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

Create or compound a taste profile: $ARGUMENTS

## Mode Detection

If argument contains "compound" or names an existing profile → **Compound mode**
If argument is a file/folder path or no argument → **Create mode**

## Create Mode

### Input Handling

If argument is provided ($ARGUMENTS):
1. Check if it's a file path → analyze that single file
2. Check if it's a folder path → find all .md, .txt files in that folder
3. If glob pattern → find matching files

If no argument provided:
1. Ask user to provide file paths or folder
2. Use Glob to help locate writing samples

### Analysis Process

Follow the Taste Profiler skill methodology:

1. **Ingest samples** — Read all, calculate word count, identify types
2. **First-pass analysis** — Holistic read for immediate impressions
3. **Dimensional deep dive** — Analyze all 12 dimensions
4. **Cross-sample validation** — Identify consistent patterns vs. variations
5. **Synthesize profile** — Generate complete taste profile

### Delivery

Present profile and ask:
```
═══════════════════════════════════════════
TASTE PROFILE COMPLETE
═══════════════════════════════════════════

Confidence: [X]/100

**Key findings:**
- Voice: [summary]
- Tone: [summary]
- Distinctive features: [list]

**Options:**
1. Save to taste-profiles/ folder
2. Review findings in detail
3. Refine specific areas

═══════════════════════════════════════════
```

## Compound Mode

### Process

1. **Identify the profile** to compound (ask if unclear)
2. **Gather evidence** — What feedback patterns has the user noticed?
3. **Diagnose gaps** — Which profile dimensions need updating?
4. **Propose updates** — Show specific changes with reasoning
5. **Apply on approval** — Update the profile file with changes and compound history

### Compound Output

```
═══════════════════════════════════════════
COMPOUND: [Profile Name]
═══════════════════════════════════════════

Proposed updates:

1. **[Dimension]**: [Current] → [Proposed]
   Reason: [Based on feedback]

2. **[Dimension]**: [Current] → [Proposed]
   Reason: [Based on feedback]

Apply? (yes/no/adjust)
═══════════════════════════════════════════
```

## Key Principles

- Creating profiles: be thorough, use examples from actual samples
- Compounding profiles: small updates, preserve what works, refine what doesn't
- Always save to `plugins/writing-studio/taste-profiles/`
