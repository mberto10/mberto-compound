# Subsystem Knowledge Schema Reference

> Reference document for compound-engineering plugin. Describes the expected YAML schema for subsystem knowledge files.

## Overview

Subsystem knowledge files live at `subsystems_knowledge/{system}/{subsystem}.yaml` in the project root. Each file captures the contracts, dependencies, invariants, and current state of a subsystem. These files are the primary context source for all compound-engineering commands.

## File Location Convention

```
project-root/
└── subsystems_knowledge/
    ├── backend/
    │   ├── api.yaml
    │   ├── workflow.yaml
    │   └── data.yaml
    ├── frontend/
    │   ├── auth.yaml
    │   └── dashboard.yaml
    └── design-system/
        ├── components.yaml
        └── tokens.yaml
```

**Systems** are top-level directories (backend, frontend, design-system, infrastructure, etc.).
**Subsystems** are YAML files within each system directory.

## Full Schema

```yaml
# === IDENTITY ===
id: {subsystem-name}           # Unique identifier within the system
system: {system-name}          # Parent system (backend, frontend, etc.)
owners: []                     # Team members responsible for this subsystem

# === PURPOSE ===
description: |
  Brief description of the subsystem's purpose and responsibility.
  What does it do? What problem does it solve?

# === ARCHITECTURE ===
architecture:
  overview: |
    High-level ASCII diagram showing how this subsystem fits
    into the larger system. Use box-drawing characters.

    +----------+     +-----------+     +----------+
    |  Input   | --> | Subsystem | --> |  Output  |
    +----------+     +-----------+     +----------+

  components: |
    For each major component, show its internal structure.
    Optional but helpful for complex subsystems.

  data_flow: |
    Show a complete request/response flow through the subsystem.
    Optional but helpful for understanding behavior.

# === OWNERSHIP ===
paths:
  owned:                       # Glob patterns for files this subsystem owns
    - "src/api/**/*.py"
    - "src/api/**/*.ts"
  public_api:                  # Exported interfaces that other subsystems consume
    - "src/api/routes/index.ts"
    - "UserService.create()"
    - "AuthMiddleware.verify()"

# === DEPENDENCY GRAPH ===
dependencies:
  compile_time: []             # Subsystems imported at build time
  runtime: []                  # Subsystems called at runtime (APIs, services)
  data: []                     # Data stores accessed (databases, caches)
  config: []                   # Environment variables, feature flags

dependents: []                 # Subsystems that depend on THIS subsystem
                               # Format: ["system/subsystem", ...]

# === CONTRACTS ===
invariants:                    # Statements that MUST remain true
  - "All API routes require authentication middleware"
  - "User input is sanitized before database queries"
  - "Response format matches OpenAPI spec"

# === TESTING ===
tests:
  tier0: "pytest tests/unit/ -v"           # Fast unit tests (< 30s)
  tier1: "pytest tests/integration/ -v"    # Contract/integration tests (< 5m)
  tier2: "Manual: verify UI flow works"    # Manual/dogfooding checks

# === STATE ===
milestone:
  current: prototype           # concept | prototype | alpha | beta | production
  target: alpha                # What we're working toward

recently_fixed:                # Recent bug fixes in this area
  - id: FIX-001
    date: "2025-06-01"
    description: "Fixed race condition in auth token refresh"
    files: ["src/api/auth/refresh.ts"]

# === GAPS ===
gaps:                          # Known missing items
  - id: GAP-001
    type: feature              # feature | bugfix | optimization
    title: "Add rate limiting to API endpoints"
    priority: 2                # 1 (critical) to 5 (nice-to-have)
    blocks: ["frontend/dashboard"]  # What this blocks
    done_when: "Rate limiting middleware applied to all public endpoints"
    status: open               # open | in-progress | addressed

# === COMPOUND ENGINEERING BRIDGE ===
helpful_skills:                # Skills from local plugin that help with this subsystem
  - name: "api-patterns"
    plugin: "project-plugin"
    when: "Modifying or adding API endpoints"
  - name: "auth-flow"
    plugin: "project-plugin"
    when: "Changing authentication or authorization logic"
```

## Field Reference

### Required Fields

| Field | Purpose | Used By |
|-------|---------|---------|
| `id` | Unique subsystem identifier | All commands |
| `system` | Parent system grouping | All commands |
| `description` | What this subsystem does | /plan (Step 1: LOCATE) |
| `paths.owned` | File ownership patterns | /plan, /review, /work |
| `invariants` | Must-hold contracts | /plan, /work, /review |

### Recommended Fields

| Field | Purpose | Used By |
|-------|---------|---------|
| `paths.public_api` | Exported interfaces | /plan (Step 2: TRACE) |
| `dependencies` | What this depends on | /plan (Step 2: TRACE) |
| `dependents` | What depends on this | /plan (Step 2: TRACE) |
| `tests` | Test commands by tier | /work, /review |
| `milestone` | Current development state | /explore-subsystem |
| `gaps` | Known missing items | /plan, /discover |

### Optional Fields

| Field | Purpose | Used By |
|-------|---------|---------|
| `owners` | Responsible team members | Informational |
| `architecture` | Visual diagrams | Understanding |
| `recently_fixed` | Recent bug fixes | /plan (Step 6: RISKS) |
| `helpful_skills` | Skills from local plugin | /work (Step 2) |

## The helpful_skills Bridge

The `helpful_skills` field is the key integration point between the portable compound-engineering plugin and project-specific knowledge:

- **/work** reads `helpful_skills` to load project-specific skills during execution
- **/discover** proposes new skills that should be added to `helpful_skills`
- **/consolidate** writes new skills and updates `helpful_skills` references

### Format

```yaml
helpful_skills:
  - name: "{skill-name}"          # Name of the skill in the local plugin
    plugin: "{plugin-name}"       # Which local plugin contains it
    when: "{context description}" # When to apply this skill for this subsystem
```

### Example

```yaml
helpful_skills:
  - name: "migration-patterns"
    plugin: "my-project-plugin"
    when: "Creating or modifying database migrations"
  - name: "api-versioning"
    plugin: "my-project-plugin"
    when: "Adding new API endpoints or changing existing ones"
```

## Milestone Definitions

| Milestone | Definition | Evidence |
|-----------|------------|----------|
| **concept** | Spec exists, boundaries defined | Subsystem YAML created |
| **prototype** | Happy path works, can demo | Basic functionality demonstrated |
| **alpha** | Unit tests, basic error handling, API documented | tier0 tests pass |
| **beta** | Full coverage, all error paths, contract tests | tier0 + tier1 tests pass |
| **production** | Monitoring, runbook, performance benchmarked | All tiers pass + ops ready |

## Creating New Subsystem Specs

Use the `/explore-subsystem` command to create new specs. It will:
1. Analyze the codebase to identify boundaries
2. Map dependencies
3. Identify invariants
4. Generate the YAML spec

You can also create specs manually following this schema.

## Updating Subsystem Specs

Specs should be updated when:
- New dependencies are discovered (during /plan or /work)
- New invariants are identified (during /review)
- Gaps are addressed (during /consolidate)
- New helpful_skills are created (during /consolidate)
- Files are reorganized or ownership changes
- Milestones are reached

Keep specs as living documents. Stale specs are worse than no specs because they provide false confidence.
