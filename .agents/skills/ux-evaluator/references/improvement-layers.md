# Improvement Layers

Categorize each improvement by the layer that needs to change.

| Layer | What Changes | Example |
|-------|-------------|---------|
| Tool Schema | Parameter definitions, required fields, defaults | Add `flexibility` param |
| Tool Output | Response structure, metadata, completeness | Include `recommended` flag |
| Widget | UI layout, controls, interaction patterns | Add filters and sorting |
| Flow | Screen sequence, confirmations, routing | Add review step before commit |

Rule of thumb: if the UI cannot fix it without new data, it is Tool Schema or Tool Output. If the data is fine but the UX is poor, it is Widget or Flow.
