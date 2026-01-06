# Claude Marketplace (mberto-compound)

## Overview
This is a personal collection of Claude Code plugins, commands, agents, skills, and configurations. It serves as a Claude Code plugin marketplace that users can add to access various plugins.

## Project Type
Documentation/Content repository with a simple Node.js server to display the plugin catalog.

## Structure
- `plugins/` - Contains all plugin directories with commands, agents, skills, and hooks
- `essays/` - Personal essays and writing
- `ideas/` - Ideas and concept documentation
- `specs/` - Specification documents
- `.claude-plugin/` - Marketplace configuration
- `server.js` - Simple documentation server for viewing the plugin catalog

## Running Locally
The project runs a simple Node.js HTTP server on port 5000 that displays the plugin catalog and README documentation.

## Available Plugins
- **mberto-core** - Core infrastructure with MCP servers
- **langfuse-analyzer** - Langfuse trace retrieval and debugging
- **langdock-dev** - Langdock integration actions
- **writing-studio** - Writing assistant with style learning
- **work-toolkit** - Personal management and productivity
- **thinking-studio** - Personal thinking patterns and ideas
- **openai-apps-sdk** - MCP server building toolkit
- **compound-loop** - Structured feedback loop for improvements
- **continuous-compound** - Long-running agent continuity
- **daily-metrics** - Personal tracking and goal management

## Deployment
Configured for autoscale deployment running `node server.js`.
