---
name: Taste Profiler
description: This skill should be used when the user asks to "create a taste profile", "analyze writing style", "profile this author", "build a style profile", "compound my profile", "update the profile", or wants to create, refine, or compound taste profiles from writing samples or feedback history.
version: 1.0.0
---

# Taste Profiler

Create and compound taste profiles. This skill handles both initial profile creation (from writing samples) and profile compounding (refining profiles based on feedback patterns from write/review cycles).

## Purpose

Two modes:

1. **Create** — Analyze writing samples to build a new taste profile
2. **Compound** — Refine an existing taste profile based on learnings from write/review cycles

## Mode 1: Create a Taste Profile

### Input Requirements

**Minimum**: 1 writing sample (500+ words)
**Recommended**: 3-5 samples across different contexts (2,000+ words total)
**Ideal**: 10+ samples covering various topics and formats (5,000+ words)

### Analysis Framework

Start with the **12 core dimensions**, then add custom dimensions as needed.

#### Core Dimensions

1. **Voice Architecture** — Pronouns, perspective, narrative distance, persona
2. **Tonal Signature** — Baseline tone, range, humor, formality
3. **Structural Patterns** — Openings, paragraphs, transitions, closings
4. **Vocabulary Fingerprint** — Lexical level, signature phrases, avoided words
5. **Rhythm & Cadence** — Sentence length, punctuation, pacing
6. **Rhetorical Devices** — Metaphors, analogies, repetition, questions
7. **Cognitive Patterns** — Argument structure, evidence style, abstraction
8. **Emotional Register** — Vocabulary range, vulnerability, enthusiasm
9. **Authority Stance** — Confidence, hedging, opinion framing
10. **Reader Relationship** — Direct address, assumed knowledge, pedagogy
11. **Topic Treatment** — Depth, examples, context, tangent handling
12. **Distinctive Markers** — Signature moves, unique expressions, style tells

#### Custom Dimensions

The 12 core dimensions are a starting point, not a ceiling. Every writer and every taste has aspects that don't fit neatly into the standard framework. When you notice something important about the voice that the core dimensions don't capture, create a custom dimension for it.

**When to add a custom dimension:**
- The samples reveal a strong pattern that doesn't map to any core dimension
- The user explicitly calls out something they care about that isn't covered
- During compounding, recurring feedback points to a preference outside the 12 dimensions

**Examples of custom dimensions:**
- **Metaphor Domains** — A writer who exclusively draws metaphors from architecture and gardening
- **Humor Timing** — Not just frequency, but the specific beat pattern of setup-punchline
- **Intellectual Generosity** — How much the writer explains vs. assumes, and the emotional stance toward the reader's knowledge gaps
- **Argument Texture** — Whether the writer builds arguments like a lawyer (sequential), a scientist (hypothesis-test), or a storyteller (narrative arc)
- **Cultural Register** — Code-switching patterns, multilingual tendencies, cultural references
- **Compression Ratio** — How much meaning gets packed per sentence; some writers are dense, some are spacious, but it's not just about sentence length

**Format for custom dimensions:**
Add them as additional `##` sections in the profile, after the 12 core dimensions but before Writing Instructions. Use the same pattern — a clear name, a description of what it captures, and concrete values/examples from the samples.

**Custom dimensions compound too.** When `/review` identifies a structural feedback pattern that doesn't fit an existing dimension, propose a new custom dimension during `/profile compound`.

### Analysis Process

#### Phase 1: Sample Ingestion

For each writing sample:
1. Record source, context, and purpose
2. Note word count and format type
3. Identify intended audience

#### Phase 2: First-Pass Analysis

Read all samples holistically to identify:
- Immediate voice impression
- Obvious patterns and habits
- Standout characteristics

#### Phase 3: Dimensional Deep Dive

Analyze each dimension systematically. See `references/analysis-dimensions.md` for detailed methodology.

#### Phase 4: Cross-Sample Validation

Compare patterns across all samples:
- Identify consistent patterns (core style)
- Note context-dependent variations
- Calculate confidence scores

#### Phase 5: Profile Synthesis

Compile findings into the taste profile format.

### Output: Taste Profile

```yaml
---
profile_version: "1.0"
generated_from:
  sample_count: [N]
  total_words: [N]
  sample_types: ["type1", "type2"]
confidence_score: [0-100]
compound_history: []
---

# Taste Profile: [Name/Identifier]

## Executive Summary
[2-3 sentence encapsulation of the voice]

## Voice Architecture
pronoun_default: [I/we/you/one/they]
perspective: [first/second/third]
narrative_distance: [intimate/conversational/professional/distant]
persona_type: [guide/peer/expert/storyteller/analyst]

## Tonal Signature
baseline_tone: [description]
tonal_range: [narrow/moderate/wide]
humor:
  type: [dry/playful/sardonic/absent]
  frequency: [rare/occasional/frequent]
  placement: [openings/asides/throughout]
formality_spectrum: [1-10 scale with description]

## Structural Patterns
opening_strategies:
  primary: [type]
  secondary: [type]
paragraph_style:
  typical_length: [sentences]
  density: [sparse/moderate/dense]
transition_style: [explicit/implicit/mixed]
closing_patterns:
  primary: [type]

## Vocabulary Fingerprint
lexical_level: [accessible/moderate/sophisticated/technical]
signature_phrases:
  - "[phrase]"
power_words:
  - "[word]"
avoided_constructions:
  - "[pattern]"

## Rhythm & Cadence
sentence_length:
  variation_pattern: [description]
clause_complexity: [simple/moderate/complex/varied]
punctuation_habits:
  em_dashes: [frequency and usage]
  semicolons: [frequency and usage]
  parentheticals: [frequency and usage]

## Rhetorical Devices
metaphor_usage:
  frequency: [rare/moderate/frequent]
  types: [concrete/abstract/mixed]
question_usage:
  rhetorical: [frequency]
  genuine: [frequency]

## Cognitive Patterns
argument_structure: [deductive/inductive/narrative/mixed]
evidence_style: [anecdotal/statistical/authoritative/experiential]
abstraction_preference: [concrete-first/abstract-first/balanced]

## Emotional Register
emotional_vocabulary: [restrained/moderate/expressive]
vulnerability_level: [guarded/selective/open]
enthusiasm_expression: [subtle/moderate/effusive]

## Authority Stance
confidence_level: [tentative/balanced/assertive/authoritative]
hedging_patterns:
  frequency: [rare/moderate/frequent]
opinion_framing: [direct/qualified/embedded]

## Reader Relationship
direct_address: [frequent/occasional/rare]
assumed_knowledge: [none/basic/intermediate/expert]
pedagogical_style: [didactic/collaborative/socratic/exploratory]

## Topic Treatment
depth_preference: [surface/moderate/deep]
example_frequency: [every point/key points/sparingly]
tangent_tolerance: [strict focus/occasional asides/exploratory]

## Distinctive Markers
signature_moves:
  - name: "[move name]"
    description: "[what it is]"
    example: "[example]"
unique_expressions:
  - "[expression]"
style_tells:
  - "[tell]"

## [Custom Dimension Name]
# Add any dimensions that don't fit the 12 core dimensions above.
# These emerge from sample analysis, user direction, or compounding.
# Use the same format: clear name, description, concrete values.
# Delete this placeholder section if no custom dimensions are needed.

## Writing Instructions

### To Write As This Voice
1. [Specific instruction]
2. [Specific instruction]
3. [Specific instruction]

### Anti-Patterns
Never do these:
- [Anti-pattern 1]
- [Anti-pattern 2]

### Voice Calibration Checklist
- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]
```

### Confidence Scoring

| Factor | Impact |
|--------|--------|
| Sample count | +10 per sample (max 30) |
| Word volume | +1 per 500 words (max 20) |
| Sample diversity | +5 per distinct type (max 20) |
| Pattern consistency | +0-30 based on cross-sample validation |

## Mode 2: Compound a Taste Profile

This is the key innovation. After write/review cycles, the user notices patterns in their feedback. Compounding captures those patterns into the profile itself.

### When to Compound

- The user repeatedly gives the same feedback ("always too formal")
- The review step reveals consistent gaps in the profile
- The user explicitly says "update the profile" or "compound this"

### Compound Process

#### Step 1: Gather Evidence

Collect from the current session or user's description:
- What feedback was given repeatedly?
- What profile elements were consistently off?
- What adjustments were always needed?

#### Step 2: Diagnose Profile Gaps

For each recurring feedback pattern:
- Identify which profile dimension is affected
- Determine if it's a missing element, a miscalibrated element, or a new pattern
- If the pattern doesn't fit any existing dimension (core or custom), propose a **new custom dimension**
- Draft the specific profile update

#### Step 3: Propose Updates

Present proposed changes to the user:

```
═══════════════════════════════════════════
COMPOUND: [Profile Name]
═══════════════════════════════════════════

Based on your feedback patterns, I propose these profile updates:

1. **[Dimension]**: [Current value] → [Proposed value]
   Reason: [Why, based on feedback]

2. **[Dimension]**: [Current value] → [Proposed value]
   Reason: [Why, based on feedback]

3. **New custom dimension:** [Name] — [What it captures]
   Reason: [Why this doesn't fit existing dimensions]

Apply these updates? (yes/no/adjust)
═══════════════════════════════════════════
```

#### Step 4: Apply Updates

On approval:
1. Read the current profile file
2. Apply the changes
3. Add entry to `compound_history` in frontmatter:
   ```yaml
   compound_history:
     - date: "YYYY-MM-DD"
       changes: ["brief description of each change"]
   ```
4. Write the updated profile

### Compound Philosophy

- Small, frequent updates beat large overhauls
- Each compound step should change 1-3 dimensions
- Always preserve what works; only refine what doesn't
- The profile gets sharper over time because it absorbs the user's taste

## Storage

Taste profiles location: `plugins/writing-studio/taste-profiles/`

## Additional Resources

### Reference Files
- **`references/analysis-dimensions.md`** - Detailed methodology for each dimension
- **`references/profile-interpretation.md`** - How to use profiles effectively

### Example Files
- **`examples/complete-taste-profile.md`** - Full example profile
