# Universal Hub (Antigravity & Codex)

This directory (`.agents`) makes `mberto-compound` a **Universal Hub** for both Antigravity and Codex skills and workflows.

## Structure

- **workflows/**: Contains reusable workflows (ported from Claude Code commands). These are automatically discovered by Antigravity when you open this repo.
- **skills/**: Contains symlinks to the compound-engineering skills. These can be symlinked into *other* projects to share the skills.

## How to use this Hub in other projects

Agent platforms (like Antigravity or Codex) heavily sandbox their file visibility for security reasons. They will **ignore any absolute symlinks** or symlinks that point outside of the project's workspace `root`.

To share these skills globally while keeping them "live" and properly discoverable by the platforms, you should use **Git Submodules**.

### Option 1: Live-link via Git Submodules (Recommended)

By adding the Hub as a submodule inside your project, the files physically exist within your workspace. You can then use *relative* symlinks, which bypasses the security sandbox restrictions entirely because the symlinks never leave the repository folder.

Run this in your target project's root:

```bash
# 1. Add the Hub as a submodule
# Replace the URL with the actual git remote URL of the mberto-compound-6 repository
git submodule add <git-url-for-mberto-compound-6> .agents-hub

# 2. Create the target directories
mkdir -p .agents/skills .agents/workflows

# 3. Create relative symlinks to the submodule
for f in .agents-hub/.agents/skills/*; do
  [ -e "$f" ] || continue
  ln -sfn "../../$f" .agents/skills/$(basename "$f")
done

for f in .agents-hub/.agents/workflows/*; do
  [ -e "$f" ] || continue
  ln -sfn "../../$f" .agents/workflows/$(basename "$f")
done
```

When you want to update to the latest skills in the future, just run `git submodule update --remote` inside your project.

### Option 2: Copy the Hub using `rsync`

If you don't want to use submodules, the only other reliable way to share the Hub is to physically copy the files. You can keep it updated using `rsync`.

Run this in your other project's root whenever you want to pull the latest skills and workflows:

```bash
# Set the path to the Hub repository
export HUB_PATH="/Users/maximilianbruhn/mberto-compound-6"

# Sync the workflows and skills (this resolves symlinks in the hub into actual files/folders)
rsync -avL "$HUB_PATH"/.agents/skills/ .agents/skills/
rsync -avL "$HUB_PATH"/.agents/workflows/ .agents/workflows/
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
