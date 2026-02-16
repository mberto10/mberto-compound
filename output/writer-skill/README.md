# Writer Skill for Claude Desktop

A writing assistant that switches between author voice profiles with conversational direction.

## Installation

1. Unzip this folder to your Claude Desktop plugins directory
2. The plugin will be available immediately

## Commands

| Command | Description |
|---------|-------------|
| `/write [topic]` | Start a writing session with profile selection |
| `/list-profiles` | View all available voice profiles |
| `/switch-profile [name]` | Activate a specific voice for the session |

## Available Profiles

- **Steven Pinker** - Lucid authority, data-grounded, accessible sophistication
- **Carl Sagan** - Cosmic wonder, poetic science, secular sacred
- **Richard Dawkins** - Combative clarity, rhetorical precision, evidence-first
- **Joshua Foer** - Narrative immersion, memory and expertise, curiosity-driven
- **Blake Crouch** - Reality dissolution, high-tension pacing, scientific wonder

## Usage Examples

```
/write an essay about artificial consciousness
→ Lists profiles, asks which voice to use

/switch-profile steven pinker
→ Activates Pinker voice for session

/write a blog post about why we procrastinate
→ Will write using the active profile
```

## Voice Blending

You can blend profiles conversationally:

- "Use Carl Sagan's wonder with Pinker's structure"
- "Write like Dawkins but warmer"
- "Blake Crouch style but shorter sentences"

## Feedback During Writing

Adjust the voice as you go:

- "More philosophical" → Increases abstraction
- "Shorter sentences" → Adjusts rhythm
- "Less dense" → Reduces paragraph density
- "Switch to Sagan" → Changes profile entirely

## Adding New Profiles

Add new `.md` files to the `profiles/` directory following the existing format:

1. Executive Summary
2. Voice Architecture
3. Tonal Signature
4. Structural Patterns
5. Vocabulary Fingerprint
6. Rhythm & Cadence
7. Rhetorical Devices
8. Cognitive Patterns
9. Emotional Register
10. Authority Stance
11. Reader Relationship
12. Topic Treatment
13. Distinctive Markers
14. Writing Assistant Configuration

## References

The `references/` directory contains:

- `direction-parsing.md` - How user direction is interpreted
- `blending-guide.md` - How to combine multiple profiles
- `feedback-patterns.md` - Common feedback and responses
