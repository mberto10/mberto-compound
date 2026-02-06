# Direction Parsing Guide

How to parse user direction into taste profile adjustments.

## Input Categories

### 1. Explicit Profile References

**Pattern recognition:**
- "Use [profile name]"
- "Write like [author]"
- "In the style of [name]"
- "[Profile name] style"

**Matching logic:**
1. Extract the profile/author name from input
2. Search taste-profiles/ for exact match (case-insensitive)
3. If no exact match, search for partial match in profile names
4. If no partial match, search executive summaries for author name
5. If still no match, ask user to clarify

### 2. Dimension Targeting

**Pattern recognition:**
- "More [dimension]" / "Less [dimension]"
- "[Dimension]-er" (shorter, longer, warmer, etc.)
- "Add [quality]" / "Remove [quality]"

**Dimension mapping:**

| User Term | Profile Dimension | Adjustment |
|-----------|------------------|------------|
| philosophical | cognitive_patterns.abstraction | increase abstraction |
| technical | vocabulary_fingerprint.jargon | increase technical vocabulary |
| formal | tonal_signature.formality | increase formality |
| casual | tonal_signature.formality | decrease formality |
| dense | structural_patterns.paragraph_style | increase density |
| sparse/spacious | structural_patterns.paragraph_style | decrease density |
| short sentences | rhythm_cadence.sentence_length | shift to shorter |
| long sentences | rhythm_cadence.sentence_length | shift to longer |
| punchy | rhythm_cadence + tonal_signature | short sentences, direct |
| flowing | rhythm_cadence | longer sentences, more connectors |
| warm | emotional_register + reader_relationship | increase warmth |
| cold/distant | emotional_register + narrative_distance | increase distance |
| authoritative | authority_stance.confidence | increase confidence |
| humble | authority_stance.hedging | increase hedging |
| wonder | cognitive_patterns + rhetorical_devices | philosophical, metaphors |
| direct | authority_stance + structural_patterns | reduce hedging, lead with claims |

### 3. Mood/Outcome Descriptions

**Pattern recognition:**
- "Something [mood]"
- "I want it to feel [quality]"
- "Make it [adjective]"

**Mood-to-profile matching:**

| Mood | Likely Profile Traits |
|------|----------------------|
| contemplative | high abstraction, philosophical, moderate pace |
| urgent | short sentences, active voice, direct address |
| playful | humor present, informal tone, varied rhythm |
| serious | no humor, formal tone, authority stance |
| accessible | low jargon, concrete examples, direct address |
| inspiring | emotional register high, enthusiasm, vision-oriented |
| analytical | evidence-based, logical structure, restrained emotion |

### 4. Compound Directions

Users may give multiple directions at once:

```
"Use Blake Crouch but shorter sentences and less dense"
```

**Parsing order:**
1. Identify base profile first
2. Parse modifiers in sequence
3. Apply each modifier to the base profile
4. Note all adjustments in output

## Ambiguity Resolution

When direction is unclear, ask directly. Don't guess.
