# Compound Loop Plugin

This plugin provides a structured improvement cycle for Claude Code workflows, centered on the loop:
**Plan → Work → Review → Compound**. The goal is to convert session learnings into reusable, testable
knowledge so each iteration becomes more capable than the last. The plugin focuses on skills,
commands, and references (hooks are intentionally out of scope here). See
`references/compounding-methodology.md` for the underlying philosophy and decision gates.

## Commands

### `/compound:reflect`
Capture learnings from the current session into a structured artifact. This produces 1-line,
testable learnings with source references and a prioritized list of proposed changes.

### `/compound:discover`
Extract repeatable patterns from recent work and generate specifications for new components
(skills, commands, agents). This is for creating *new* modular capabilities.

### `/compound:consolidate`
Review pending learning artifacts, get explicit approval, and implement the approved changes into
the plugin source.

## Skills

- **Improvement Cycle Setup**: The in-the-moment mindset for noticing friction and encoding
  learnings while you work.
- **Reflection Craft**: A structured workflow for converting session outcomes into actionable,
  testable learnings.
- **Discovery Craft**: A pattern-extraction workflow that selects the right component type and
  produces implementation-ready specs.
- **Consolidation Craft**: The review and implementation workflow that turns learnings into
  permanent improvements.

## References

- **Compounding Methodology**: The philosophy, heuristics, and decision gates for what to encode
  and how to keep improvements high-signal.
