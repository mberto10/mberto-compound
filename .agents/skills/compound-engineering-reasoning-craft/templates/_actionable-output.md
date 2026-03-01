## Actionable Output Format (Optional)

If your analysis produces actionable work — issues to create, specs to update, or architectural decisions to record — use the formats below. This enables automated processing into Linear issues and subsystem spec updates. **Include only the sections that are relevant to your analysis.** Not every question needs a work breakdown.

### `## Linear Hierarchy`

Proposed work breakdown as a Linear hierarchy:

```
Initiative: {title}
  Project: {title}
    Milestone: {title} — {what is true after}
      - [S] {issue title} | Subsystems: {list} | {one-line description}
      - [M] {issue title} | Subsystems: {list} | {one-line description}
      - [L] {issue title} | Subsystems: {list} | {one-line description}
```

**Complexity markers:**
- `[S]` — Small: 1-2 change groups, single subsystem, straightforward
- `[M]` — Medium: 3-5 change groups, 1-2 subsystems, some complexity
- `[L]` — Large: 5+ change groups, multiple subsystems, consider splitting

Each issue line must include: complexity marker, concise imperative title, `Subsystems:` with comma-separated IDs, and a one-line description after the pipe.

### `## Subsystem Updates`

Proposed changes to subsystem YAML specs:

```
Subsystem: {id}
  Update: {section} — {what to add/change}
  Reason: {why this is needed}
```

### `## ADR: {title}`

Architecture Decision Record for significant technical decisions:

- **Status:** Proposed
- **Context:** Why this decision is needed
- **Decision:** What we decided
- **Consequences:** Trade-offs, what changes, what we gain/lose
- **Rollback Plan:** (if applicable) How to revert

### `## Immediate Plan`

Top 3-5 concrete next steps, ordered by dependency. Each step should reference a specific subsystem or Linear item.
