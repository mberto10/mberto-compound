---
name: generate-milestones
description: Generate project milestones from scope and optionally create Linear issues
allowed-tools:
  - Bash
  - Read
  - Write
argument-hint: "<project_name> [--create-issues]"
---

# Generate Milestones Command

Generate structured milestones for a project based on scope, then optionally create them as Linear issues.

## Workflow

### 1. Understand Project Scope

Ask for or gather:
- Project name and goal
- High-level deliverables
- Timeline constraints
- Team size/capacity

### 2. Apply Milestone Framework

Break down into phases:

```
Phase 1: Discovery & Planning (10-15%)
Phase 2: Core Implementation (40-50%)
Phase 3: Integration & Testing (20-25%)
Phase 4: Polish & Launch (15-20%)
```

### 3. Generate Milestones

Output format:

```markdown
# Milestones: [Projektname]

## Übersicht
- **Ziel:** [Projektziel]
- **Timeline:** [Start] - [Ende]
- **Team:** [Größe]

## Meilensteine

### M1: [Name] 📋
**Phase:** Discovery & Planning
**Zieldatum:** [Datum]
**Dauer:** [X Wochen]

**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Definition of Done:**
- [Kriterium 1]
- [Kriterium 2]

**Dependencies:**
- [Abhängigkeit]

---

### M2: [Name] 🔨
**Phase:** Core Implementation
**Zieldatum:** [Datum]
**Dauer:** [X Wochen]

**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Definition of Done:**
- [Kriterium]

**Dependencies:**
- Depends on: M1

---

### M3: [Name] 🧪
**Phase:** Integration & Testing
**Zieldatum:** [Datum]

...

### M4: [Name] 🚀
**Phase:** Polish & Launch
**Zieldatum:** [Datum]

...

## Timeline Visualisierung

```
KW01 |████████| M1: Discovery
KW02 |████████|
KW03 |        ████████████████| M2: Core Implementation
KW04 |        ████████████████|
KW05 |        ████████████████|
KW06 |                        ████████| M3: Testing
KW07 |                                ████| M4: Launch
```

## Risiken
| Risiko | Impact | Mitigation |
|--------|--------|------------|
| [R1] | [I1] | [M1] |
```

### 4. Offer to Create Issues

If `--create-issues` flag:

```bash
# Create milestone as Linear issue
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py create "[M1] Discovery & Planning"
```

Or ask: "Soll ich diese Meilensteine als Linear Issues anlegen?"

## Milestone Templates by Project Type

### Feature Development
```
M1: Requirements & Design (2w)
M2: Core Implementation (3-4w)
M3: Testing & QA (1-2w)
M4: Documentation & Launch (1w)
```

### POC / Prototype
```
M1: Research & Spike (1w)
M2: Prototype Build (2w)
M3: Demo & Feedback (0.5w)
M4: Decision & Next Steps (0.5w)
```

### Infrastructure / Platform
```
M1: Architecture Design (2w)
M2: Core Infrastructure (4w)
M3: Migration & Integration (2w)
M4: Monitoring & Hardening (1w)
M5: Rollout & Documentation (1w)
```

### AI/ML Project
```
M1: Problem Definition & Data (2w)
M2: Model Development (3-4w)
M3: Evaluation & Iteration (2w)
M4: Integration & API (2w)
M5: Monitoring & Launch (1w)
```

## Arguments

```
/generate-milestones "Customer Chatbot"
/generate-milestones "RAG Pipeline" --create-issues
```

## Tips

- **Be realistic**: Add 20-30% buffer for unknowns
- **Define done**: Clear criteria prevent scope creep
- **Dependencies**: Make blockers explicit
- **Review with team**: Validate estimates together
