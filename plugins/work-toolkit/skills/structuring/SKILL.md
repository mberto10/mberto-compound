---
name: Content Structuring
description: This skill should be used when the user asks to "structure this", "prepare a presentation", "create an outline", "organize content", "write a spec", "plan a document", "generate milestones", "project breakdown", "timeline planning", or needs help with content architecture, presentation structure, documentation organization, or project milestone planning.
version: 0.2.0
---

# Content Structuring

Organize and structure content for presentations, documentation, and communication.

## Slash Commands

### `/structure <type> <topic>`
Structure content:
- `presentation` / `pres` - Slide deck
- `doc` - Technical documentation
- `outline` - General outline

Example: `/structure presentation RAG Architecture Overview`

## Core Frameworks

### Pyramid Principle (Minto)

Start with conclusion, then support:

1. **Lead with the answer** - Main point first
2. **Group supporting ideas** - Cluster related arguments
3. **Logical order** - Sequence matters
4. **Evidence** - Back up with data

### SCQA Framework

For narratives and proposals:

- **Situation**: Current state, context
- **Complication**: Problem or change
- **Question**: Key question raised
- **Answer**: Your solution

## Presentation Structures

### Standard Flow

```
1. Opening (1-2 slides)
   - Title + key message
   - Agenda

2. Context (1-2 slides)
   - Why are we here?
   - Background

3. Main Content (5-8 slides)
   - 3-5 key points
   - One idea per slide

4. Implications (1-2 slides)
   - What does this mean?
   - What action needed?

5. Close (1 slide)
   - Key takeaways
   - Call to action
```

### Technical Demo/POC

```
1. Problem Statement
   - What problem?
   - Why it matters?

2. Solution Overview
   - High-level approach
   - Key components

3. Demo/Walkthrough
   - Live demo or screenshots

4. Technical Details
   - Architecture
   - Trade-offs

5. Results/Metrics
   - What we learned
   - Performance

6. Next Steps
   - Recommendations
```

### Status Presentation

```
1. TL;DR / Executive Summary
   - One slide: Status + highlights

2. Progress Since Last Update
   - Accomplishments
   - Metrics

3. Current Focus
   - What's being worked on
   - Expected completion

4. Risks & Blockers
   - Delays
   - Needs

5. Outlook
   - What's next
   - Milestones
```

## Documentation Structures

### Project Documentation

```markdown
# [Project Name]

## Overview
[2-3 sentences: What and why]

## Goals
- [Goal 1]
- [Goal 2]

## Current Status
[Status: In Progress / Complete / On Hold]
[Last updated: Date]

## Key Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| ... | ... | ... |

## Architecture / Approach
[Technical approach]

## Progress Log
### [Date]
- [What happened]

## Open Questions
- [ ] [Question]

## Links & Resources
- [Links]
```

### Decision Record (ADR)

```markdown
# [Decision Title]

## Status
[Proposed / Accepted / Deprecated]

## Context
[Situation requiring decision]

## Decision
[What was decided]

## Consequences
- Positive: [...]
- Negative: [...]

## Alternatives Considered
1. [Alt 1] - [Why not]
2. [Alt 2] - [Why not]
```

### Technical Specification

```markdown
# [Feature Name]

## Summary
[One paragraph]

## Requirements
### Functional
- [FR1]
- [FR2]

### Non-Functional
- [NFR1]

## Design
### Overview
[High-level approach]

### Components
[Key components]

### Data Flow
[How data moves]

## API / Interface
[Endpoints, contracts]

## Testing Strategy
[How to test]

## Rollout Plan
[Deployment]

## Open Questions
- [ ] [Question]
```

## Visual Design Tips

### Slides
- One key message per slide
- 6x6 rule: Max 6 bullets, 6 words each
- Visuals over text
- Consistent formatting

### Documents
- Clear hierarchy with headings
- Bullets for lists
- Tables for comparisons
- White space is your friend

## Anti-Patterns

| Problem | Fix |
|---------|-----|
| Wall of text | Break into sections |
| Buried lede | Move conclusion to top |
| Missing context | Answer "why does this matter?" |
| No clear ask | End with explicit next steps |
| Too detailed | Start high-level, drill down |

## Project & Milestone Planning

### `/generate-milestones <project>`
Generate milestones from project scope with optional Linear issue creation.

### Project Breakdown

```
Epic (Project Goal)
├── Milestone (Shippable increment, 1-3 weeks)
│   ├── Task (1-3 days)
│   └── Task
└── Milestone
    └── Task
```

### Standard Phases

| Phase | % Time | Focus |
|-------|--------|-------|
| Discovery | 10-15% | Requirements, design |
| Implementation | 40-50% | Core development |
| Testing | 20-25% | QA, integration |
| Launch | 15-20% | Docs, deployment |

### Milestone Template

```markdown
### M1: [Name]
**Goal:** [One sentence outcome]
**Duration:** [X weeks]
**Owner:** [Name]

**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Definition of Done:**
- [ ] [Criterion]

**Dependencies:**
- Requires: [What]
- Blocks: [What]
```

### Timeline Estimation

**T-Shirt Sizing:**
| Size | Days |
|------|------|
| S | 1-2 |
| M | 3-5 |
| L | 5-10 |
| XL | 10+ (break down) |

**Buffer:** Add 20-30% for unknowns

## Reference Files

- **`references/presentation-templates.md`** - More presentation formats
- **`references/milestone-patterns.md`** - Project breakdown and estimation
