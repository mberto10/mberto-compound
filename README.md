# Claude Marketplace

Personal collection of Claude Code plugins, commands, agents, skills, and configurations.

## Installation

### Add the Marketplace

In Claude Code, run:

/plugin marketplace add /home/runner/workspace/plugins 


/plugin marketplace add mberto10/mberto-compound
```

### Install Plugins

After adding the marketplace, install plugins with:

```
/plugin install example-plugin@mberto-compound
```

### Other Commands

```bash
# Browse all plugins
/plugin

# List known marketplaces
/plugin marketplace list

# Update marketplace
/plugin marketplace update mberto-compound

# Remove marketplace
/plugin marketplace remove mberto-compound
```

## Available Plugins

| Plugin | Description | Category |
|--------|-------------|----------|
| `example-plugin` | Example plugin demonstrating structure for commands, agents, skills, and hooks | utility |

## Structure

```
claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace configuration
└── plugins/
    └── example-plugin/       # Example plugin (template)
        ├── .claude-plugin/
        │   └── plugin.json   # Plugin metadata
        ├── .mcp.json         # MCP server configuration
        ├── agents/           # Custom agents
        ├── commands/         # Slash commands
        ├── hooks/            # Lifecycle hooks
        └── skills/           # Autonomous skills
```

## Universal Hub (Antigravity & Codex)

This repository serves as a **Universal Hub** for [Antigravity](https://gemini.google.com) and **Codex** skills and workflows. It uses the standardized `.agents` format compatible with both environments.

### How to use these skills in your project

You can reference the skills and workflows in this repo from any other project by creating a symbolic link.

**One-liner setup (run in your project root):**

```bash
# Replace /path/to/mberto-compound with the actual path to this repo
HUB_PATH="/Users/maximilianbruhn/mberto-compound-6"

mkdir -p .agents
ln -s "$HUB_PATH/.agents/skills" .agents/skills
ln -s "$HUB_PATH/.agents/workflows" .agents/workflows

echo "Linked Antigravity skills and workflows from $HUB_PATH"
```

Once linked, Antigravity will automatically discover:
- `/compound-plan`, `/compound-work`, `/compound-review` etc.
- Skills like `compound-strategic-planner` and `compound-improvement-cycle`

## Creating New Plugins

1. Create a new directory under `plugins/`:
   ```bash
   mkdir -p plugins/my-plugin/{commands,agents,skills,hooks,.claude-plugin}
   ```

2. Add `.claude-plugin/plugin.json`:
   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "My custom plugin",
     "author": {
       "name": "Your Name"
     },
     "license": "MIT"
   }
   ```

3. Add components as needed:
   - **Commands**: `.md` files in `commands/`
   - **Agents**: `.md` files in `agents/`
   - **Skills**: Directories in `skills/` with `SKILL.md`
   - **Hooks**: `hooks.json` in `hooks/`
   - **MCP Servers**: `.mcp.json` in plugin root

4. Register in `.claude-plugin/marketplace.json`:
   ```json
   {
     "plugins": [
       {
         "name": "my-plugin",
         "source": "./plugins/my-plugin",
         "description": "My custom plugin",
         "version": "1.0.0",
         "author": {
           "name": "Your Name"
         },
         "category": "utility"
       }
     ]
   }
   ```

## Using in Team Projects

Add to your project's `.claude/settings.json` for automatic installation:

```json
{
  "extraKnownMarketplaces": {
    "mberto-compound": {
      "source": {
        "source": "github",
        "repo": "mberto10/mberto-compound"
      }
    }
  },
  "enabledPlugins": [
    "example-plugin@mberto-compound"
  ]
}
```

## License

MIT
