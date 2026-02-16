# Direction Parsing Guide

Detailed logic for parsing user direction in voice-writer sessions.

## Input Categories

### 1. Explicit Profile References

**Pattern recognition:**
- "Use [profile name]"
- "Write like [author]"
- "In the style of [name]"
- "[Profile name] style"
- "Channel [author]"

**Matching logic:**
1. Extract the profile/author name from input
2. Search profiles/ for exact match (case-insensitive)
3. If no exact match, search for partial match in profile names
4. If no partial match, search executive summaries for author name
5. If still no match, trigger "Profile Not Found" flow

**Example parsing:**
```
Input: "Use Blake Crouch style"
→ Extract: "Blake Crouch"
→ Search: profiles/*blake*crouch* OR profiles containing "Blake Crouch"
→ Match: blake-crouch-recursion.md
→ Action: Load as primary profile
```

### 2. Dimension Targeting

**Pattern recognition:**
- "More [dimension]" / "Less [dimension]"
- "[Dimension]-er" (shorter, longer, warmer, etc.)
- "Increase/decrease [dimension]"
- "Add [quality]" / "Remove [quality]"

**Dimension mapping:**

| User Term | Profile Dimension | Adjustment |
|-----------|------------------|------------|
| philosophical | cognitive_patterns.abstraction | increase abstraction, add implications |
| technical | vocabulary_fingerprint.jargon | increase technical vocabulary |
| formal | tonal_signature.formality | increase formality score |
| casual | tonal_signature.formality | decrease formality score |
| dense | structural_patterns.paragraph_style | increase density |
| sparse/spacious | structural_patterns.paragraph_style | decrease density |
| short sentences | rhythm_cadence.sentence_length | shift to shorter |
| long sentences | rhythm_cadence.sentence_length | shift to longer |
| punchy | rhythm_cadence + tonal_signature | short sentences, direct statements |
| flowing | rhythm_cadence | longer sentences, more connectors |
| warm | emotional_register + reader_relationship | increase warmth indicators |
| cold/distant | emotional_register + narrative_distance | increase distance |
| authoritative | authority_stance.confidence | increase confidence |
| humble | authority_stance.hedging | increase hedging |
| wonder | cognitive_patterns + rhetorical_devices | add philosophical implications, metaphors |
| direct | authority_stance + structural_patterns | reduce hedging, lead with claims |

### 3. Blending Requests

**Pattern recognition:**
- "[Profile A]'s [quality] with [Profile B]'s [quality]"
- "Mix [A] and [B]"
- "Combine [A] with [B]"
- "[Quality] of [A], [quality] of [B]"
- "Like [A] but with [B]'s [quality]"

**Parsing steps:**
1. Identify profile references (see section 1)
2. Extract quality/dimension mentions
3. Map qualities to dimensions (see section 2)
4. Build blend specification

**Example parsing:**
```
Input: "Blake Crouch's philosophy with Hemingway's rhythm"
→ Profile A: blake-crouch-recursion
→ Quality A: "philosophy" → cognitive_patterns, signature_moves
→ Profile B: hemingway-sparse (hypothetical)
→ Quality B: "rhythm" → rhythm_cadence, sentence_length
→ Blend spec:
   primary: blake-crouch-recursion
   use: cognitive_patterns, signature_moves
   secondary: hemingway-sparse
   use: rhythm_cadence, sentence_length
```

### 4. Mood/Outcome Descriptions

**Pattern recognition:**
- "Something [mood]"
- "I want it to feel [quality]"
- "Make it [adjective]"
- "[Adjective] piece about..."

**Mood-to-profile matching:**

| Mood | Likely Profile Traits |
|------|----------------------|
| contemplative | high abstraction, philosophical implications, moderate pace |
| urgent | short sentences, active voice, direct address |
| playful | humor present, informal tone, varied rhythm |
| serious | no humor, formal tone, authority stance |
| accessible | low jargon, concrete examples, direct address |
| academic | high jargon, citation style, hedged claims |
| inspiring | emotional register high, enthusiasm, vision-oriented |
| analytical | evidence-based, logical structure, restrained emotion |

**Matching algorithm:**
1. Identify mood descriptors in input
2. Map to profile traits (table above)
3. Score each available profile against traits
4. Recommend top 1-2 matches
5. Ask user to confirm or adjust

## Ambiguity Resolution

When direction is ambiguous:

```
═══════════════════════════════════════════
📍 CLARIFICATION NEEDED
═══════════════════════════════════════════

The direction "[user input]" could mean:

**Option A:** [interpretation 1]
→ Would adjust: [dimensions]

**Option B:** [interpretation 2]
→ Would adjust: [dimensions]

Which interpretation fits the intent?
═══════════════════════════════════════════
```

## Compound Directions

Users may give multiple directions at once:

```
"Use Blake Crouch but shorter sentences and less dense"
```

**Parsing order:**
1. Identify base profile first
2. Parse modifiers in sequence
3. Apply each modifier to the base profile
4. Note all adjustments in output metadata
