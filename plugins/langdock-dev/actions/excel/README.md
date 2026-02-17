# Excel Generation Action

This action enables Langdock assistants to generate Excel-compatible spreadsheets using the **XML Spreadsheet 2003** format. This format is natively supported by Excel and allows for features like multiple sheets, cell formulas, and basic styling, all without requiring external binaries or Python.

## Usage

### Action: `generate_excel.js`

**Parameters:**

*   `filename` (optional): The name of the output file. Defaults to `export.xml`.
*   `workbookData` (required): A JSON object (or stringified JSON) describing the workbook structure.

### `workbookData` Structure

```json
{
  "sheets": [
    {
      "name": "Sheet1",
      "rows": [
        ["Header 1", "Header 2"],
        [100, 200],
        [{ "value": 300, "style": "boldStyle" }, { "formula": "=A2+B2" }]
      ]
    }
  ],
  "styles": [
    {
      "id": "boldStyle",
      "font": { "bold": true, "color": "#FF0000" },
      "interior": { "color": "#FFFF00" }
    }
  ]
}
```

### Features

1.  **Multiple Sheets**: Define as many sheets as needed in the `sheets` array.
2.  **Formulas**: Use the `formula` property in a cell object, or start a string with `=` (e.g., `"=SUM(A1:A5)"`).
3.  **Styling**: Define styles in the `styles` array and reference them by `id` in cells.
    *   **Font**: Bold, Color.
    *   **Interior**: Background Color.
4.  **Data Types**:
    *   **String**: Default text.
    *   **Number**: Integers and floats.
    *   **DateTime**: JS Date objects (converted to Excel serial dates).
    *   **Boolean**: `TRUE` / `FALSE`.

### Example

To generate a simple financial summary:

### Helper for Assistants

Add this to your Assistant's system instructions to ensure it generates valid JSON:

```typescript
// Type definition for the workbookData input
type WorkbookData = {
  sheets: {
    name: string;      // e.g., "Q1 Financials"
    rows: (string | number | boolean | CellObject)[][];
    columns?: { width: number }[]; // Optional column widths
  }[];
  styles?: {
    id: string;        // Referenced by CellObject.style
    font?: { bold?: boolean; color?: string }; // Color in hex "#FF0000"
    interior?: { color: string };
  }[];
};

type CellObject = {
  value?: string | number | boolean;
  formula?: string;    // e.g., "=SUM(A1:B1)"
  style?: string;      // e.g., "headerStyle"
};
```
