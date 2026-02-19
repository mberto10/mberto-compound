# Universal Hub (Antigravity & Codex)

This directory (`.agents`) makes `mberto-compound` a **Universal Hub** for both Antigravity and Codex skills and workflows.

## Structure

- **workflows/**: Contains reusable workflows (ported from Claude Code commands). These are automatically discovered by Antigravity when you open this repo.
- **skills/**: Contains symlinks to the compound-engineering skills. These can be symlinked into *other* projects to share the skills.

## How to use this Hub in other projects

To use these skills and workflows in another project (Antigravity or Codex), you don't need to copy them. You can simply **symlink** them.

### Option 1: Symlink the entire Hub (Recommended)

Run this in your other project's root:

```bash
# Create the local .agents directory if it doesn't exist
mkdir -p .agents

# Symlink the skills directory from the Hub
ln -s /Users/maximilianbruhn/mberto-compound-6/.agents/skills .agents/skills

# Symlink the workflows directory from the Hub (optional, if you want the commands too)
ln -s /Users/maximilianbruhn/mberto-compound-6/.agents/workflows .agents/workflows
```

*Replace `/path/to/mberto-compound-6` with the actual absolute path to this repo.*

### Option 2: Symlink specific skills

```bash
mkdir -p .agents/skills
ln -s /Users/maximilianbruhn/mberto-compound-6/.agents/skills/strategic-planner .agents/skills/strategic-planner
```

## Available Workflows

- **/plan**: Dependency-aware planning
- **/work**: Execute planned work with verification
- **/review**: Verify work against subsystem contracts
- **/consolidate**: Implement discovered patterns
- **/strategic-plan**: Decompose vision into Linear hierarchy
- **/explore-subsystem**: Document a new subsystem
- **/discover**: Find reusable patterns in recent work
- **/harness**: Execute the engineering loop

## Available Skills

- **strategic-planner**: Methodology for breaking down complex work
- **harness-protocol**: Rules for the autonomous engineering loop
- **discovery-craft**: How to identify reusable patterns
- **consolidation-craft**: How to implement patterns into the system
- **reflection-craft**: How to learn from work
- **improvement-cycle**: The Plan-Work-Review-Compound loop
