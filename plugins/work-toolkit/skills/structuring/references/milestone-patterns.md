# Milestone Patterns

## Project Breakdown Framework

### Epic → Story → Task Hierarchy

```
Epic (Project Goal)
├── Story (Milestone/Feature)
│   ├── Task (Implementable unit)
│   ├── Task
│   └── Task
├── Story
│   ├── Task
│   └── Task
└── Story
    └── Task
```

### Sizing Guidelines

| Level | Duration | Deliverable |
|-------|----------|-------------|
| **Epic** | 1-3 months | Business outcome |
| **Story/Milestone** | 1-3 weeks | Shippable increment |
| **Task** | 1-3 days | Single piece of work |

## Phase Templates

### Standard Software Project

| Phase | % of Time | Activities |
|-------|-----------|------------|
| Discovery | 10-15% | Requirements, research, design |
| Implementation | 40-50% | Core development |
| Testing | 20-25% | QA, integration, fixes |
| Launch | 15-20% | Documentation, deployment, handoff |

### AI/ML Project

| Phase | % of Time | Activities |
|-------|-----------|------------|
| Problem & Data | 15-20% | Define problem, data assessment |
| Development | 30-40% | Model training, iteration |
| Evaluation | 15-20% | Testing, validation |
| Integration | 15-20% | API, pipeline |
| Operations | 10-15% | Monitoring, documentation |

### POC / Spike

| Phase | % of Time | Activities |
|-------|-----------|------------|
| Research | 20% | Assess options |
| Build | 50% | Prototype |
| Demo | 15% | Present findings |
| Decision | 15% | Recommend path |

## Milestone Definition Template

```markdown
### [Milestone Name]

**Goal:** [One sentence describing the outcome]
**Duration:** [X weeks]
**Owner:** [Name]

**Deliverables:**
- [ ] [Concrete deliverable 1]
- [ ] [Concrete deliverable 2]

**Definition of Done:**
- [ ] [Measurable criterion]
- [ ] [Acceptance test]

**Dependencies:**
- Requires: [Previous milestone/external]
- Blocks: [What this enables]

**Risks:**
- [Risk]: [Mitigation]
```

## Timeline Estimation

### Estimation Techniques

**T-Shirt Sizing:**
| Size | Days | Complexity |
|------|------|------------|
| XS | 0.5-1 | Trivial |
| S | 1-2 | Simple |
| M | 3-5 | Medium |
| L | 5-10 | Complex |
| XL | 10+ | Break it down |

**PERT Estimation:**
```
Expected = (Optimistic + 4×Likely + Pessimistic) / 6
```

### Buffer Guidelines

| Project Type | Buffer |
|--------------|--------|
| Known domain | +20% |
| New technology | +30-40% |
| External dependencies | +30% |
| First time doing X | +50% |

## Dependency Mapping

### Dependency Types

| Type | Example | Handling |
|------|---------|----------|
| **Finish-to-Start** | M2 needs M1 complete | Sequential |
| **Start-to-Start** | Can start together | Parallel |
| **External** | Waiting on other team | Track + escalate |
| **Resource** | Same person needed | Sequence or parallelize |

### Visualization

```
M1 ────────┐
           ├──► M3 ──► M4
M2 ────────┘
```

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| **Big bang milestone** | Too large to track | Break into 1-2 week chunks |
| **No definition of done** | Scope creep | Define measurable criteria |
| **Hidden dependencies** | Surprise blockers | Map dependencies explicitly |
| **No buffer** | Always late | Add 20-30% buffer |
| **Single owner** | Bus factor | Assign backup/reviewer |

## Status Tracking

### Milestone Status

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 On Track | Meeting goals | Continue |
| 🟡 At Risk | May miss deadline | Mitigate |
| 🔴 Blocked | Cannot progress | Escalate |
| ✅ Complete | Done, criteria met | Close out |
| ⏸️ On Hold | Intentionally paused | Document reason |

### Progress Metrics

```
Completion = Tasks Done / Total Tasks
Velocity = Tasks Done / Time Period
Burn Rate = Budget Used / Time Elapsed
```
