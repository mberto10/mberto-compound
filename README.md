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
