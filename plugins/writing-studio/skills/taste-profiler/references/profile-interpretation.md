# Profile Interpretation Guide

How to use writer profiles effectively for building personalized writing assistants.

## Understanding Profile Sections

### Executive Summary

The 2-3 sentence encapsulation is the "elevator pitch" for the writer's voice. Use this for:
- Quick voice calibration checks
- Explaining the writer to others
- Grounding before any writing task

### Core Dimensions vs. Surface Features

**Core dimensions** (hard to change, fundamental):
- Voice Architecture
- Cognitive Patterns
- Authority Stance
- Reader Relationship

**Surface features** (can vary, context-dependent):
- Specific vocabulary choices
- Punctuation details
- Structural variations
- Topic-specific adaptations

When replicating voice, prioritize core dimensions over surface features.

## Using Profiles for Writing Assistants

### For "Write As" Mode

When an assistant should write AS the profiled author:

**Pre-writing checklist:**
1. Review Executive Summary for voice grounding
2. Check Voice Architecture for pronoun/perspective rules
3. Note Tonal Signature for emotional calibration
4. Review Distinctive Markers for authenticity details

**During writing:**
- Match sentence rhythm patterns
- Use signature phrases naturally (not forced)
- Follow structural patterns for openings/closings
- Apply vocabulary fingerprint (preferred words, avoid prohibited)

**Post-writing validation:**
- Run Voice Calibration Checklist
- Verify no Anti-Patterns present
- Check Distinctive Markers are evident but not overdone

### For "Edit For" Mode

When an assistant should edit TO MATCH the profiled style:

**Analysis phase:**
1. Compare draft against profile dimensions
2. Identify mismatches in voice, tone, vocabulary
3. Flag anti-pattern violations
4. Note missing signature elements

**Editing priorities (in order):**
1. Voice Architecture alignment (pronouns, perspective)
2. Tonal Signature matching
3. Structural pattern conformity
4. Vocabulary fingerprint application
5. Rhythm and cadence adjustment
6. Distinctive marker insertion (subtle)

**What NOT to edit:**
- Don't force signature phrases if unnatural
- Don't add distinctive markers artificially
- Don't override content expertise for style
- Don't make voice changes that obscure meaning

### For "Recommend" Mode

When an assistant should give writing advice matching the profile:

**Feedback framing:**
- Reference profile elements: "Your voice typically uses first-person plural—this draft uses 'I' throughout."
- Cite examples from profile: "Compare this to your signature opening style..."
- Suggest specific changes: "To match your rhythm pattern, try breaking this 45-word sentence into two."

**Prioritization:**
1. Voice consistency issues (highest priority)
2. Tone drift problems
3. Structural departures
4. Vocabulary mismatches
5. Minor style deviations (lowest priority)

## Profile Confidence Interpretation

### High Confidence (90-100)

The profile reliably captures the writer's style.

**Use freely for:**
- Full voice replication
- Detailed editing passes
- Automated style checking
- Training other assistants

**Limitations:**
- May miss rare context-specific variations
- Could over-specify preferences that are actually flexible

### Good Confidence (70-89)

The profile is reliable for most purposes.

**Use confidently for:**
- General voice guidance
- Editing major style issues
- Voice calibration checks

**Use cautiously for:**
- Subtle style distinctions
- Edge case judgments
- Novel contexts

**Recommend:**
- Verify unusual profile claims with writer
- Add samples for any low-confidence dimensions

### Moderate Confidence (50-69)

The profile captures main patterns but has gaps.

**Use for:**
- General direction guidance
- Identifying obvious mismatches
- Starting point for refinement

**Don't rely on for:**
- Detailed replication
- Subtle distinctions
- Confidence in edge cases

**Recommend:**
- Gather more samples
- Validate key findings with writer
- Mark uncertain dimensions

### Low Confidence (Below 50)

The profile is a rough sketch only.

**Use only for:**
- Initial hypotheses
- Starting conversation about style
- Identifying sample needs

**Don't use for:**
- Any definitive style judgments
- Voice replication
- Automated editing

**Required action:**
- Gather significantly more samples
- Include diverse sample types
- Re-analyze before using

## Context-Specific Adaptations

### Formal vs. Informal Contexts

If the profile is built from mixed samples, note which elements are context-dependent:

```yaml
context_variations:
  formal:
    formality_shift: +2 on scale
    humor_reduction: 50%
    hedge_increase: moderate
  informal:
    formality_shift: -1 on scale
    humor_increase: 25%
    directness_increase: moderate
```

### Topic-Specific Variations

Writers may have different patterns for different subjects:

```yaml
topic_variations:
  technical:
    depth_preference: deep
    example_frequency: high
    abstraction: concrete-first
  opinion:
    authority_stance: +1 assertiveness
    emotional_register: more expressive
    reader_relationship: more direct
```

### Audience-Specific Variations

Voice may shift based on intended reader:

```yaml
audience_variations:
  experts:
    assumed_knowledge: high
    jargon_comfort: embraces
    explanation_density: low
  general:
    assumed_knowledge: basic
    jargon_comfort: avoids
    explanation_density: high
```

## Common Interpretation Mistakes

### Over-Specification

**Mistake**: Treating every profile element as a hard rule
**Reality**: Profiles describe tendencies, not laws
**Fix**: Use "usually," "tends to," "often" when applying profile

### Under-Specification

**Mistake**: Ignoring profile nuances, only using broad strokes
**Reality**: Subtle details make voice authentic
**Fix**: Pay attention to Distinctive Markers and specific examples

### Static Interpretation

**Mistake**: Treating the profile as permanent and unchanging
**Reality**: Writers evolve; profiles are snapshots
**Fix**: Note profile generation date; update periodically

### Forced Application

**Mistake**: Inserting profile elements artificially
**Reality**: Authenticity comes from natural integration
**Fix**: Let profile inform choices, not dictate insertions

### Context Blindness

**Mistake**: Applying full profile regardless of context
**Reality**: Style adapts to situation
**Fix**: Use context_variations when known; ask when uncertain

## Profile Maintenance

### When to Update

- Writer provides new samples
- Writer explicitly changes style
- Profile predictions consistently miss
- 6+ months since last update

### How to Update

1. Analyze new samples against existing profile
2. Note confirmations (strengthen confidence)
3. Note contradictions (investigate)
4. Revise affected dimensions
5. Update confidence scores
6. Document changes

### Version Control

Maintain profile history:
- Date each version
- Note sample additions
- Document significant changes
- Keep previous versions accessible

## Integration with Writing Workflows

### Brainstorming

- Don't constrain ideas with style
- Style applies to expression, not ideation
- Note profile might influence topic treatment preferences

### Planning

- Consider structural patterns when outlining
- Opening/closing preferences inform structure
- Depth preference affects scope decisions

### Drafting

- Full profile application
- Voice Architecture is primary guide
- Rhythm and vocabulary shape sentences
- Distinctive markers add authenticity

### Editing

- Profile is the standard
- Systematic dimension checking
- Calibration checklist for final pass
- Anti-patterns as red flags
