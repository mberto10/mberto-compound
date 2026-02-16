# Operations Map

Map user intent to wrapper command:

```bash
bash /Users/max/mberto-compound/codex-skills/langdock-api-operations/scripts/langdock_ops.sh <domain> <operation> [args...]
```

## Agent API

- Create assistant:
  - `agent create --name "My Agent" --instruction "You are helpful." [--description "..."] [--emoji "🤖"] [--model <uuid>] [--creativity 0.3] [--web-search] [--image-generation] [--data-analyst] [--canvas] [--conversation-starters "a" "b"]`
- Get assistant:
  - `agent get --id <assistant-uuid>`
- Update assistant:
  - `agent update --id <assistant-uuid> [--name "..."] [--instruction "..."] [--description "..."] [--emoji "..."] [--model <uuid>] [--creativity 0.7]`
- Chat:
  - Existing assistant: `agent chat --id <assistant-uuid> --message "Hello"`
  - Temporary assistant: `agent chat --temp-name "Helper" --temp-instruction "Be concise." --message "Hello"`
- List models:
  - `agent models`
- Upload attachment:
  - `agent upload --file /absolute/path/to/file.pdf`

## Knowledge Folder API

- Upload:
  - `knowledge upload --folder <folder-uuid> --file /absolute/path/to/file.pdf [--url "https://source"]`
- Update:
  - `knowledge update --folder <folder-uuid> --attachment <attachment-uuid> [--file /absolute/path/to/new.pdf] [--url "https://source"]`
- List files:
  - `knowledge list --folder <folder-uuid> [--format json|table]`
- Delete:
  - `knowledge delete --folder <folder-uuid> --attachment <attachment-uuid>`
- Search:
  - `knowledge search --query "search terms" [--limit 10] [--format json|table]`

## Usage Export API

- Users export:
  - `export users --from YYYY-MM-DD --to YYYY-MM-DD [--timezone UTC] [--download] [-o output.csv]`
- Assistants export:
  - `export agents --from YYYY-MM-DD --to YYYY-MM-DD [--timezone UTC] [--download] [-o output.csv]`
- Workflows export:
  - `export workflows --from YYYY-MM-DD --to YYYY-MM-DD [--timezone UTC] [--download] [-o output.csv]`
- Projects export:
  - `export projects --from YYYY-MM-DD --to YYYY-MM-DD [--timezone UTC] [--download] [-o output.csv]`
- Models export:
  - `export models --from YYYY-MM-DD --to YYYY-MM-DD [--timezone UTC] [--download] [-o output.csv]`

## Notes

- The wrapper preserves stdout/stderr from Langdock CLI tools.
- `LANGDOCK_API_KEY` must be set for all operations.
- Use `LANGDOCK_PLUGIN_ROOT` to point to a non-default plugin checkout.
