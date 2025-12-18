# Claude Marketplace

Personal collection of Claude Code plugins, commands, agents, skills, and configurations.

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

## Installation in Another Project

### Step 1: Clone the Marketplace

```bash
git clone https://github.com/MB9012/claude-marketplace.git ~/.claude-marketplace
```

### Step 2: Link Plugins to Your Project

Navigate to your project directory and create symlinks:

```bash
# Create .claude directory if it doesn't exist
mkdir -p .claude

# Link specific plugin components
ln -s ~/.claude-marketplace/plugins/example-plugin/commands .claude/commands
ln -s ~/.claude-marketplace/plugins/example-plugin/agents .claude/agents
```

### Step 3: Alternative - Copy Plugin Configuration

If you prefer copying instead of symlinking:

```bash
# Copy entire plugin to your project
cp -r ~/.claude-marketplace/plugins/example-plugin/.claude-plugin .claude-plugin
cp -r ~/.claude-marketplace/plugins/example-plugin/commands .claude/commands
cp -r ~/.claude-marketplace/plugins/example-plugin/agents .claude/agents
```

### Step 4: Merge MCP Configuration

Add MCP servers from plugin to your project's `.mcp.json`:

```bash
# If you don't have .mcp.json yet
cp ~/.claude-marketplace/plugins/example-plugin/.mcp.json .mcp.json

# Or manually merge the mcpServers from the plugin
```

## Creating New Plugins

1. Create a new directory under `plugins/`:
   ```bash
   mkdir -p plugins/my-plugin/{commands,agents,skills,hooks,.claude-plugin}
   ```

2. Add `plugin.json`:
   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "My custom plugin",
     "author": "Your Name"
   }
   ```

3. Add components as needed:
   - **Commands**: `.md` files in `commands/`
   - **Agents**: `.md` files in `agents/`
   - **Skills**: Directories in `skills/` with `SKILL.md`
   - **Hooks**: `hooks.json` in `hooks/`

4. Register in `marketplace.json`:
   ```json
   {
     "plugins": [
       {
         "name": "my-plugin",
         "source": "./plugins/my-plugin",
         "description": "My custom plugin"
       }
     ]
   }
   ```

## Quick Start Script

Create this script in your target project to quickly load marketplace plugins:

```bash
#!/bin/bash
# load-marketplace.sh

MARKETPLACE=~/.claude-marketplace
PLUGIN=${1:-example-plugin}

mkdir -p .claude

# Link commands if they exist
if [ -d "$MARKETPLACE/plugins/$PLUGIN/commands" ]; then
    ln -sf "$MARKETPLACE/plugins/$PLUGIN/commands" .claude/commands
    echo "Linked commands from $PLUGIN"
fi

# Link agents if they exist
if [ -d "$MARKETPLACE/plugins/$PLUGIN/agents" ]; then
    ln -sf "$MARKETPLACE/plugins/$PLUGIN/agents" .claude/agents
    echo "Linked agents from $PLUGIN"
fi

# Copy MCP config if it exists
if [ -f "$MARKETPLACE/plugins/$PLUGIN/.mcp.json" ]; then
    cp "$MARKETPLACE/plugins/$PLUGIN/.mcp.json" .mcp.json
    echo "Copied MCP configuration"
fi

echo "Plugin $PLUGIN loaded!"
```

Usage: `./load-marketplace.sh example-plugin`

## License

MIT
