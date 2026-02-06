# Writing Studio

A writing assistant built around the **plan-work-review-compound** loop with taste profiles that evolve through use.

## The Loop

```
YOU PLAN → WRITE (skill) → YOU REVIEW → REVIEW (skill) → COMPOUND (profile evolves)
```

1. **Plan** (you) — Look at a text, decide what to write, give direction
2. **Work** (`/write`) — The taste-writer skill writes in the active profile's voice
3. **Review** (`/review`) — You give feedback, the taste-reviewer proposes profile-aligned rewrites
4. **Compound** (`/profile compound`) — Feedback patterns get absorbed into the taste profile itself

Over time, your taste profiles get sharper because they absorb your preferences.

## Commands

| Command | Description |
|---------|-------------|
| `/write [topic]` | Write content using a taste profile |
| `/review [file]` | Review writing against a taste profile, propose rewrites |
| `/profile [samples]` | Create a new taste profile from writing samples |
| `/profile compound` | Refine an existing taste profile based on feedback patterns |

## Taste Profiles

Taste profiles live in `taste-profiles/` and capture 12 dimensions of a writing voice:

1. Voice Architecture
2. Tonal Signature
3. Structural Patterns
4. Vocabulary Fingerprint
5. Rhythm & Cadence
6. Rhetorical Devices
7. Cognitive Patterns
8. Emotional Register
9. Authority Stance
10. Reader Relationship
11. Topic Treatment
12. Distinctive Markers

### Creating Profiles

```bash
# From writing samples
/profile path/to/samples/

# From a single file
/profile my-writing.md
```

### Compounding Profiles

After write/review cycles, when you notice the profile consistently misses something:

```bash
/profile compound
```

This captures your feedback patterns into the profile itself.

## Skills

| Skill | Role in Loop |
|-------|-------------|
| **taste-writer** | Writes content in the active profile's voice |
| **taste-reviewer** | Translates your feedback into profile-aligned rewrites |
| **taste-profiler** | Creates and compounds taste profiles |

## License

MIT
