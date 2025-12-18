---
description: Validate an MCP server implementation against OpenAI Apps SDK best practices
allowed-tools: Read, Glob, Grep
---

Validate the MCP server implementation in the current directory against OpenAI Apps SDK best practices.

## Validation Process

1. **Detect Server Type**
   - Look for `server.py` or files with FastMCP imports → Python server
   - Look for `server.ts` or files with @modelcontextprotocol/sdk imports → TypeScript server
   - If neither found, report that no MCP server was detected

2. **Check Project Structure**

   Required files:
   - [ ] Main server file (server.py or server.ts)
   - [ ] Dependencies file (requirements.txt or package.json)
   - [ ] README.md with setup instructions

   Recommended files:
   - [ ] .env.example for environment variables
   - [ ] .gitignore to exclude secrets and build artifacts

3. **Analyze Tool Definitions**

   For each tool found, check:
   - [ ] Has descriptive name (verb_noun pattern like `get_user`, `search_products`)
   - [ ] Has clear description explaining what it does
   - [ ] Has properly defined inputSchema with descriptions
   - [ ] Uses appropriate annotations:
     - `readOnlyHint: true` for read-only operations
     - `destructiveHint: true` for delete/modify operations
     - `openWorldHint: true` for external publishing

4. **Check Response Patterns**

   Verify tools return proper structure:
   - [ ] Uses `structuredContent` for model-readable data
   - [ ] Uses `content` array for display text
   - [ ] Uses `_meta` for widget-only data
   - [ ] Widget tools have `_meta.openai/outputTemplate`

5. **Security Review**

   Check for security best practices:
   - [ ] No hardcoded API keys or secrets
   - [ ] Uses environment variables for configuration
   - [ ] Has .gitignore excluding .env files
   - [ ] Validates inputs before processing
   - [ ] Uses appropriate tool annotations for safety

6. **Widget Analysis** (if widgets present)

   For each widget/resource:
   - [ ] Uses `text/html+skybridge` mime type
   - [ ] Handles both light and dark themes
   - [ ] Calls `notifyIntrinsicHeight` after render
   - [ ] Handles missing data gracefully
   - [ ] CSP configured if loading external resources

7. **Documentation Check**

   README should include:
   - [ ] Project description
   - [ ] Setup/installation instructions
   - [ ] How to run the server
   - [ ] List of available tools
   - [ ] Testing instructions

## Output Format

Generate a validation report with:

### Summary
- Server type detected
- Overall assessment (Ready / Needs Work / Critical Issues)

### Checklist Results
Show each check with ✅ (pass), ⚠️ (warning), or ❌ (fail)

### Issues Found
List specific issues with:
- File and line number
- Description of the issue
- Suggested fix

### Recommendations
Prioritized list of improvements:
1. Critical (must fix before deployment)
2. Important (should fix for production)
3. Nice to have (best practices)

### Example Tools Review
For each tool, provide:
- Name and purpose
- Schema quality assessment
- Annotation recommendations
