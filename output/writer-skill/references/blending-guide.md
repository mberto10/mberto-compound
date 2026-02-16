# Profile Blending Guide

How to combine multiple writer profiles effectively.

## The 12 Dimensions

Writer profiles contain 12 dimensions that can be blended:

| # | Dimension | Blendable | Notes |
|---|-----------|-----------|-------|
| 1 | Voice Architecture | Partially | Pronouns mix poorly; persona can blend |
| 2 | Tonal Signature | Yes | Baseline tone, formality blend well |
| 3 | Structural Patterns | Yes | Can mix opening/closing strategies |
| 4 | Vocabulary Fingerprint | Partially | Power words blend; signature phrases conflict |
| 5 | Rhythm & Cadence | Yes | Sentence length, punctuation blend well |
| 6 | Rhetorical Devices | Yes | Can combine metaphor styles |
| 7 | Cognitive Patterns | Partially | Argument structure should come from one source |
| 8 | Emotional Register | Yes | Can calibrate between profiles |
| 9 | Authority Stance | Partially | Confidence level blends; hedging patterns conflict |
| 10 | Reader Relationship | Partially | Direct address can blend; assumed knowledge should be consistent |
| 11 | Topic Treatment | Yes | Depth, examples, tangents all blend |
| 12 | Distinctive Markers | No | Signature moves are profile-specific |

## Compatibility Matrix

When blending two profiles, check dimension compatibility:

### High Compatibility (blend freely)
- Tonal Signature + Rhythm & Cadence
- Structural Patterns + Topic Treatment
- Rhetorical Devices + Emotional Register
- Cognitive Patterns + Authority Stance

### Medium Compatibility (blend with care)
- Voice Architecture + Reader Relationship
- Vocabulary Fingerprint + Tonal Signature
- Distinctive Markers + Rhetorical Devices

### Low Compatibility (choose one)
- Voice Architecture pronouns (I vs. we vs. you)
- Distinctive Markers signature phrases
- Cognitive Patterns argument structure

## Blending Strategies

### Strategy 1: Primary + Accent

Use one profile as base, add specific elements from another.

```yaml
primary: blake-crouch-recursion
  # Use all dimensions
secondary: hemingway-sparse
  # Use only:
  - rhythm_cadence.sentence_length
  - structural_patterns.paragraph_density
```

**Best for:** Maintaining coherent voice while adjusting specific qualities.

### Strategy 2: Dimension Split

Assign different dimensions to different profiles.

```yaml
profile_a: blake-crouch-recursion
  dimensions:
    - cognitive_patterns
    - rhetorical_devices
    - topic_treatment

profile_b: hemingway-sparse
  dimensions:
    - rhythm_cadence
    - structural_patterns
    - vocabulary_fingerprint
```

**Best for:** Creating genuinely hybrid voices.

### Strategy 3: Section Switching

Use different profiles for different sections.

```yaml
opening:
  profile: blake-crouch-recursion
  # Hook with wonder

body:
  profile: hemingway-sparse
  # Deliver information cleanly

closing:
  profile: blake-crouch-recursion
  # Land on philosophical note
```

**Best for:** Long-form content with varied requirements.

## Conflict Resolution

When dimensions conflict between profiles:

### Pronoun Conflicts

If Profile A uses "you" and Profile B uses "we":
- Ask user which relationship to maintain
- Default to primary profile's choice
- Note: mixing pronouns in same piece feels inconsistent

### Formality Conflicts

If Profile A is formal (8/10) and Profile B is casual (3/10):
- Calculate midpoint if blending (5.5/10)
- Or ask user which end to favor
- Consider content type (technical → more formal)

### Rhythm Conflicts

If Profile A uses long sentences and Profile B uses short:
- Can create intentional variation pattern
- Long-short-long-short rhythm
- Or favor one profile's pattern with occasional breaks

### Signature Phrase Conflicts

Never blend signature phrases—they're identity markers:
- Choose one profile's phrases OR
- Use neither (create neutral voice)
- Using both feels like impersonation collision

## Blend Documentation

Always document the blend in output:

```yaml
voice_blend:
  primary: blake-crouch-recursion
  primary_elements:
    - cognitive_patterns.science_to_wonder
    - rhetorical_devices.metaphor_usage
    - distinctive_markers.reality_dissolution
  secondary: hemingway-sparse
  secondary_elements:
    - rhythm_cadence.short_sentences
    - structural_patterns.sparse_paragraphs
  conflicts_resolved:
    - formality: "favored primary (7/10)"
    - pronouns: "used primary (you/your)"
  custom_adjustments:
    - "reduced metaphor density by 30%"
```

## Common Blend Recipes

### "Accessible Philosophy"
- Primary: philosophical/wonder profile
- Add: accessible vocabulary, shorter sentences
- Remove: jargon, complex clauses

### "Warm Technical"
- Primary: technical/precise profile
- Add: direct address, enthusiasm markers
- Remove: cold distance, pure objectivity

### "Punchy Depth"
- Primary: deep/thorough profile
- Add: short sentence rhythm, active voice
- Remove: clause nesting, passive constructions

### "Authoritative Warmth"
- Primary: authoritative/expert profile
- Add: emotional register warmth, reader inclusion
- Remove: excessive hedging, cold distance
