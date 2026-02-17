# Claude XLSX Skill — Complete Reference Handbook

> **Source**: Anthropic's official `anthropics/skills` repository  
> **GitHub**: https://github.com/anthropics/skills/tree/main/skills/xlsx  
> **License**: Proprietary (source-available for reference)  
> **Compiled**: February 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Skill Trigger Logic](#2-skill-trigger-logic)
3. [Directory Structure & Files](#3-directory-structure--files)
4. [SKILL.md — Full Annotated Instructions](#4-skillmd--full-annotated-instructions)
5. [Libraries & Dependencies](#5-libraries--dependencies)
6. [Core Workflow (6-Step Pipeline)](#6-core-workflow-6-step-pipeline)
7. [Code Patterns — Creating Files](#7-code-patterns--creating-files)
8. [Code Patterns — Editing Existing Files](#8-code-patterns--editing-existing-files)
9. [Code Patterns — Reading & Analyzing Data](#9-code-patterns--reading--analyzing-data)
10. [Formula Recalculation System](#10-formula-recalculation-system)
11. [Quality Standards & Output Requirements](#11-quality-standards--output-requirements)
12. [Financial Model Standards](#12-financial-model-standards)
13. [Tool Call Sequences in Claude.ai](#13-tool-call-sequences-in-claudeai)
14. [API Usage via Skills API](#14-api-usage-via-skills-api)
15. [Common Pitfalls & Verification Checklist](#15-common-pitfalls--verification-checklist)
16. [Replicating This Skill in Your Own Setup](#16-replicating-this-skill-in-your-own-setup)

---

## 1. Architecture Overview

The xlsx skill follows Anthropic's **progressive disclosure** pattern:

```
User message arrives
       │
       ▼
┌─────────────────────────────┐
│  Metadata Scan (~100 tokens)│  ← Claude reads YAML frontmatter
│  name: xlsx                 │    (name + description only)
│  description: "Use this..." │
└──────────┬──────────────────┘
           │ relevant?
           ▼
┌─────────────────────────────┐
│  Full SKILL.md loaded       │  ← ~5K tokens of instructions
│  (instructions, patterns,   │
│   code examples, rules)     │
└──────────┬──────────────────┘
           │ needs scripts?
           ▼
┌─────────────────────────────┐
│  Bundled Resources loaded   │  ← scripts/recalc.py
│  (on-demand, only if needed)│    scripts/office/soffice.py
└─────────────────────────────┘
```

This means Claude doesn't load the full skill for every conversation — only when it determines xlsx work is relevant. Token cost is minimal until activation.

---

## 2. Skill Trigger Logic

### DOES Trigger

- User wants to open, read, edit, or fix `.xlsx`, `.xlsm`, `.csv`, `.tsv` files
- User wants to create a new spreadsheet from scratch or other data sources
- User references a spreadsheet file by name or path (even casually: "the xlsx in my downloads")
- User wants to clean/restructure messy tabular data files
- User wants to convert between tabular file formats
- The **deliverable is a spreadsheet file**

### Does NOT Trigger

- Primary deliverable is a Word document, HTML report, standalone Python script
- Database pipeline or Google Sheets API integration
- Tabular data is involved but output is not a spreadsheet

---

## 3. Directory Structure & Files

```
/mnt/skills/public/xlsx/
├── SKILL.md                          # 12KB — Main instructions (292 lines)
├── LICENSE.txt                       # 1.5KB — Proprietary license
└── scripts/
    ├── recalc.py                     # 6KB — Formula recalculation via LibreOffice
    └── office/
        ├── soffice.py                # 5.5KB — LibreOffice sandbox helper
        ├── pack.py                   # 5KB — OOXML packing
        ├── unpack.py                 # 4KB — OOXML unpacking
        ├── validate.py               # 4KB — OOXML validation
        ├── helpers/
        │   ├── __init__.py
        │   ├── merge_runs.py         # 5.5KB
        │   └── simplify_redlines.py  # 6KB
        ├── validators/
        │   ├── __init__.py
        │   ├── base.py               # 32KB
        │   ├── docx.py               # 16KB
        │   ├── pptx.py               # 10KB
        │   └── redlining.py          # 9KB
        └── schemas/                  # ~928KB — OOXML validation schemas
            ├── ISO-IEC29500-4_2016/
            ├── ecma/
            ├── mce/
            └── microsoft/
```

Key insight: the `office/` directory is **shared infrastructure** across xlsx, docx, and pptx skills. The xlsx-specific file is really just `SKILL.md` + `recalc.py`.

---

## 4. SKILL.md — Full Annotated Instructions

The SKILL.md has two major sections:

### Section A: Output Requirements (Lines 7–64)

These are **mandatory quality standards** that apply to every generated Excel file:

1. **Professional Font**: Arial or Times New Roman unless user specifies otherwise
2. **Zero Formula Errors**: Every file MUST have zero `#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`, `#NAME?`
3. **Preserve Existing Templates**: When editing, match existing format exactly; never impose new formatting

Plus **financial model standards** (detailed in Section 12 below).

### Section B: Workflows & Patterns (Lines 66–292)

This covers the actual code patterns, library selection, formula rules, recalculation, verification checklists, and best practices.

---

## 5. Libraries & Dependencies

### Primary Libraries

| Library | Use Case | Install |
|---------|----------|---------|
| **openpyxl** | Complex formatting, formulas, Excel-specific features | `pip install openpyxl` |
| **pandas** | Data analysis, bulk operations, simple data export | `pip install pandas` |

### Decision Matrix

```
Need formulas?           → openpyxl
Need formatting/styling? → openpyxl
Need data analysis?      → pandas
Need bulk operations?    → pandas
Need simple CSV→XLSX?    → pandas
Need charts?             → openpyxl (openpyxl.chart)
Need both?               → Use pandas for data processing,
                           openpyxl for final formatting
```

### Supporting Infrastructure

| Component | Purpose |
|-----------|---------|
| **LibreOffice** (soffice) | Formula recalculation (headless mode) |
| **recalc.py** | Orchestrates LibreOffice recalc + error scanning |
| **soffice.py** | Handles sandboxed environments (AF_UNIX socket workaround) |

---

## 6. Core Workflow (6-Step Pipeline)

This is the **mandatory workflow** Claude follows for every xlsx task:

```
Step 1: Choose Tool
  │  pandas → data analysis, bulk ops
  │  openpyxl → formulas, formatting
  ▼
Step 2: Create/Load
  │  Workbook() for new
  │  load_workbook() for existing
  ▼
Step 3: Modify
  │  Add/edit data, formulas, formatting
  │  CRITICAL: Use Excel formulas, NOT hardcoded Python calculations
  ▼
Step 4: Save
  │  wb.save('output.xlsx')
  ▼
Step 5: Recalculate (MANDATORY if formulas used)
  │  python scripts/recalc.py output.xlsx
  ▼
Step 6: Verify & Fix
  │  Parse JSON output from recalc.py
  │  If errors_found → fix → re-run recalc
  │  Loop until status: "success"
```

---

## 7. Code Patterns — Creating Files

### Basic New File

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

wb = Workbook()
sheet = wb.active

# Add data
sheet['A1'] = 'Hello'
sheet['B1'] = 'World'
sheet.append(['Row', 'of', 'data'])

# Add formula (NEVER hardcode calculated values)
sheet['B2'] = '=SUM(A1:A10)'

# Formatting
sheet['A1'].font = Font(bold=True, color='FF0000')
sheet['A1'].fill = PatternFill('solid', start_color='FFFF00')
sheet['A1'].alignment = Alignment(horizontal='center')

# Column width
sheet.column_dimensions['A'].width = 20

wb.save('output.xlsx')
```

### The Cardinal Rule: Formulas, Not Hardcodes

```python
# ❌ WRONG — Hardcoding calculated values
total = df['Sales'].sum()
sheet['B10'] = total           # Hardcodes 5000

growth = (df.iloc[-1]['Revenue'] - df.iloc[0]['Revenue']) / df.iloc[0]['Revenue']
sheet['C5'] = growth           # Hardcodes 0.15

avg = sum(values) / len(values)
sheet['D20'] = avg             # Hardcodes 42.5

# ✅ CORRECT — Using Excel formulas
sheet['B10'] = '=SUM(B2:B9)'
sheet['C5'] = '=(C4-C2)/C2'
sheet['D20'] = '=AVERAGE(D2:D19)'
```

**Why this matters**: The spreadsheet must remain dynamic. When source data changes, formulas recalculate automatically. Hardcoded values create dead spreadsheets.

---

## 8. Code Patterns — Editing Existing Files

```python
from openpyxl import load_workbook

# Load existing file (preserves formulas and formatting)
wb = load_workbook('existing.xlsx')
sheet = wb.active  # or wb['SheetName'] for specific sheet

# Working with multiple sheets
for sheet_name in wb.sheetnames:
    sheet = wb[sheet_name]
    print(f"Sheet: {sheet_name}")

# Modify cells
sheet['A1'] = 'New Value'
sheet.insert_rows(2)      # Insert row at position 2
sheet.delete_cols(3)       # Delete column 3

# Add new sheet
new_sheet = wb.create_sheet('NewSheet')
new_sheet['A1'] = 'Data'

wb.save('modified.xlsx')
```

### Critical Warning: data_only Mode

```python
# Reading calculated values (for analysis only!)
wb = load_workbook('file.xlsx', data_only=True)

# ⚠️ WARNING: If you save after opening with data_only=True,
# ALL FORMULAS are permanently replaced with their last calculated values.
# The formulas are GONE FOREVER.
```

---

## 9. Code Patterns — Reading & Analyzing Data

```python
import pandas as pd

# Read Excel
df = pd.read_excel('file.xlsx')                         # First sheet
all_sheets = pd.read_excel('file.xlsx', sheet_name=None) # All sheets as dict

# Analyze
df.head()       # Preview data
df.info()       # Column info
df.describe()   # Statistics

# Write Excel
df.to_excel('output.xlsx', index=False)
```

### Pandas Best Practices

```python
# Avoid type inference issues
pd.read_excel('file.xlsx', dtype={'id': str})

# Large files — read specific columns only
pd.read_excel('file.xlsx', usecols=['A', 'C', 'E'])

# Handle dates properly
pd.read_excel('file.xlsx', parse_dates=['date_column'])
```

---

## 10. Formula Recalculation System

### The Problem

openpyxl writes formulas as **strings** — it does NOT evaluate them. When you open a file created by openpyxl, the formula cells show `0` or are blank until Excel/LibreOffice recalculates.

### The Solution: recalc.py

```bash
python scripts/recalc.py <excel_file> [timeout_seconds]

# Example
python scripts/recalc.py output.xlsx 30
```

### How recalc.py Works (Internally)

1. **Setup Phase**: Installs a LibreOffice Basic macro (`RecalculateAndSave`) into `~/.config/libreoffice/4/user/basic/Standard/Module1.xba`

2. **Recalculation Phase**: Runs LibreOffice headless with the macro:
   ```
   soffice --headless --norestore \
     "vnd.sun.star.script:Standard.Module1.RecalculateAndSave?language=Basic&location=application" \
     /absolute/path/to/file.xlsx
   ```
   The macro calls `ThisComponent.calculateAll()`, then `store()`, then `close()`.

3. **Verification Phase**: Reopens the file with openpyxl (`data_only=True`), scans ALL cells for error strings: `#VALUE!`, `#DIV/0!`, `#REF!`, `#NAME?`, `#NULL!`, `#NUM!`, `#N/A`

4. **Reporting**: Returns JSON:
   ```json
   {
     "status": "success",
     "total_errors": 0,
     "total_formulas": 42,
     "error_summary": {}
   }
   ```

   Or on errors:
   ```json
   {
     "status": "errors_found",
     "total_errors": 2,
     "total_formulas": 42,
     "error_summary": {
       "#REF!": {
         "count": 2,
         "locations": ["Sheet1!B5", "Sheet1!C10"]
       }
     }
   }
   ```

### The Sandbox Helper (soffice.py)

In sandboxed environments (like Claude's container), Unix sockets may be blocked. `soffice.py` handles this by:

1. Detecting if `AF_UNIX` sockets fail
2. Compiling a C shim (`lo_socket_shim.c`) that intercepts `socket()` calls and falls back to `socketpair()`
3. Injecting it via `LD_PRELOAD`
4. Also sets `SAL_USE_VCLPLUGIN=svp` (headless rendering)

---

## 11. Quality Standards & Output Requirements

### All Excel Files

| Requirement | Detail |
|-------------|--------|
| Professional Font | Arial or Times New Roman (unless user specifies) |
| Zero Formula Errors | Must pass recalc.py with `status: "success"` |
| Preserve Templates | When editing, EXACTLY match existing format/style/conventions |

### Code Style

- Write **minimal, concise** Python code
- **No** unnecessary comments in code
- **No** verbose variable names or redundant operations
- **No** unnecessary print statements

### But IN the Excel File

- **DO** add comments to cells with complex formulas
- **DO** document data sources for hardcoded values
- **DO** include notes for key calculations and model sections

---

## 12. Financial Model Standards

### Color Coding (Industry Standard)

| Color | RGB | Meaning |
|-------|-----|---------|
| **Blue text** | (0,0,255) | Hardcoded inputs, scenario-changeable numbers |
| **Black text** | (0,0,0) | ALL formulas and calculations |
| **Green text** | (0,128,0) | Links from other worksheets in same workbook |
| **Red text** | (255,0,0) | External links to other files |
| **Yellow background** | (255,255,0) | Key assumptions needing attention |

### Number Formatting

| Type | Format | Example |
|------|--------|---------|
| Years | Text string | "2024" not "2,024" |
| Currency | `$#,##0` | Always specify units: "Revenue ($mm)" |
| Zeros | Dash display | `$#,##0;($#,##0);-` |
| Percentages | One decimal | `0.0%` |
| Multiples | `0.0x` | EV/EBITDA, P/E ratios |
| Negatives | Parentheses | `(123)` not `-123` |

### Formula Rules

- Place ALL assumptions in **separate assumption cells**
- Use **cell references** instead of hardcoded values: `=B5*(1+$B$6)` not `=B5*1.05`
- Verify no off-by-one errors, no circular references
- Test with edge cases (zero, negative, very large values)

### Documentation for Hardcodes

Format: `"Source: [System/Document], [Date], [Specific Reference], [URL if applicable]"`

Examples:
- `"Source: Company 10-K, FY2024, Page 45, Revenue Note, [SEC EDGAR URL]"`
- `"Source: Bloomberg Terminal, 8/15/2025, AAPL US Equity"`

---

## 13. Tool Call Sequences in Claude.ai

When a user asks for an Excel file in Claude.ai, here's the exact sequence of tool calls Claude makes:

### Sequence for Creating a New Spreadsheet

```
1. view /mnt/skills/public/xlsx/SKILL.md     ← Read skill instructions
2. bash: python3 script.py                    ← Execute Python to generate .xlsx
3. bash: python /mnt/skills/.../recalc.py ... ← Recalculate formulas (if any)
4. bash: cp output.xlsx /mnt/user-data/outputs/ ← Move to output directory
5. present_files ["/mnt/user-data/outputs/output.xlsx"] ← Share with user
```

### Sequence for Editing an Uploaded File

```
1. view /mnt/skills/public/xlsx/SKILL.md      ← Read skill instructions
2. view /mnt/user-data/uploads/               ← Check uploaded files
3. bash: cp /mnt/user-data/uploads/file.xlsx /home/claude/ ← Copy to workspace
4. bash: python3 edit_script.py               ← Execute edit operations
5. bash: python /mnt/skills/.../recalc.py ... ← Recalculate if formulas changed
6. bash: cp modified.xlsx /mnt/user-data/outputs/ ← Move to output
7. present_files ["/mnt/user-data/outputs/modified.xlsx"]
```

### Sequence for Data Analysis

```
1. view /mnt/skills/public/xlsx/SKILL.md
2. bash: python3 -c "import pandas as pd; ..."  ← Analyze with pandas
3. [Response with analysis in chat, no file output needed]
```

### Key Path Conventions

| Path | Purpose |
|------|---------|
| `/mnt/user-data/uploads/` | User's uploaded files (read-only) |
| `/home/claude/` | Working directory (temporary scratchpad) |
| `/mnt/user-data/outputs/` | Final deliverables (user can download) |
| `/mnt/skills/public/xlsx/` | Skill files (read-only) |

---

## 14. API Usage via Skills API

### Via Anthropic API (Programmatic)

```python
from anthropic import Anthropic

client = Anthropic(api_key="your-api-key")

response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=[
        "code-execution-2025-08-25",
        "files-api-2025-04-14",
        "skills-2025-10-02"
    ],
    container={
        "skills": [
            {
                "type": "anthropic",
                "skill_id": "xlsx",
                "version": "latest"
            }
        ]
    },
    tools=[
        {
            "type": "code_execution_20250825",
            "name": "code_execution"
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "Create a monthly budget Excel spreadsheet with formulas"
        }
    ]
)
```

### Multiple Skills in One Call

```python
container={
    "skills": [
        {"type": "anthropic", "skill_id": "xlsx", "version": "latest"},
        {"type": "anthropic", "skill_id": "pptx", "version": "latest"},
        {"type": "anthropic", "skill_id": "pdf", "version": "latest"},
    ]
}
```

Claude intelligently selects which skill to use based on the request.

### Via Claude Code (CLI)

```bash
# Install the skill from Anthropic's repo
npx skills add https://github.com/anthropics/skills --skill xlsx

# Or via plugin marketplace
/plugin marketplace add anthropics/skills
```

---

## 15. Common Pitfalls & Verification Checklist

### Essential Verification

- [ ] **Test 2–3 sample references**: Verify they pull correct values before building full model
- [ ] **Column mapping**: Confirm Excel columns match (column 64 = BL, not BK)
- [ ] **Row offset**: Remember Excel rows are 1-indexed (DataFrame row 5 = Excel row 6)

### Common Pitfalls

- [ ] **NaN handling**: Check for null values with `pd.notna()`
- [ ] **Far-right columns**: FY data often in columns 50+
- [ ] **Multiple matches**: Search all occurrences, not just first
- [ ] **Division by zero**: Check denominators before using `/` in formulas
- [ ] **Wrong references**: Verify all cell references point to intended cells
- [ ] **Cross-sheet references**: Use correct format `Sheet1!A1`

### Formula Testing Strategy

- [ ] **Start small**: Test formulas on 2–3 cells before applying broadly
- [ ] **Verify dependencies**: Check all cells referenced in formulas exist
- [ ] **Test edge cases**: Include zero, negative, and very large values

### openpyxl Gotchas

- Cell indices are **1-based** (row=1, column=1 = cell A1)
- `data_only=True` + save = **permanently destroys all formulas**
- For large files: use `read_only=True` / `write_only=True`
- Formulas are preserved but NOT evaluated — must use `recalc.py`

---

## 16. Replicating This Skill in Your Own Setup

### Minimal Reproduction

To replicate what Claude does internally, you need:

```
my-xlsx-skill/
├── SKILL.md              # Copy from anthropics/skills repo
├── recalc.py             # Copy from scripts/
└── requirements.txt      # openpyxl, pandas
```

### Requirements

```
# requirements.txt
openpyxl>=3.1.0
pandas>=2.0.0
```

Plus **LibreOffice** installed:
```bash
# Ubuntu/Debian
sudo apt-get install -y libreoffice

# macOS
brew install libreoffice
```

### Custom SKILL.md Template

```yaml
---
name: my-xlsx-skill
description: "Your trigger description here — be specific about when to activate"
---

# Your Skill Title

## Requirements for Outputs
[Your quality standards]

## Workflows
[Your step-by-step instructions with code patterns]

## Common Workflow
1. Choose tool: pandas for data, openpyxl for formulas/formatting
2. Create/Load file
3. Modify
4. Save
5. Recalculate formulas
6. Verify and fix errors
```

### Using as Claude Code Plugin

```bash
# Register your custom skill directory
/plugin add /path/to/my-xlsx-skill

# Or from a Git repo
npx skills add https://github.com/your-repo --skill my-xlsx-skill
```

---

## Quick Reference Card

```
┌────────────────────────────────────────────────────────┐
│  XLSX SKILL — QUICK REFERENCE                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  LIBRARIES                                             │
│    openpyxl  → formulas, formatting, Excel features    │
│    pandas    → data analysis, bulk ops, CSV convert    │
│                                                        │
│  CARDINAL RULE                                         │
│    NEVER hardcode calculated values                    │
│    ALWAYS use Excel formulas: =SUM(), =AVERAGE(), etc  │
│                                                        │
│  WORKFLOW                                              │
│    1. Choose tool → 2. Create/Load → 3. Modify         │
│    4. Save → 5. Recalc → 6. Verify                     │
│                                                        │
│  RECALCULATION                                         │
│    python scripts/recalc.py output.xlsx [timeout]      │
│    Returns JSON: {status, total_errors, error_summary} │
│                                                        │
│  FINANCIAL MODELS                                      │
│    Blue text  = inputs    Black text = formulas        │
│    Green text = cross-sheet links                      │
│    Yellow bg  = key assumptions                        │
│    Negatives in parentheses: (123) not -123            │
│                                                        │
│  PATHS (Claude.ai)                                     │
│    Uploads:  /mnt/user-data/uploads/                   │
│    Work:     /home/claude/                              │
│    Output:   /mnt/user-data/outputs/                   │
│    Skill:    /mnt/skills/public/xlsx/                   │
│                                                        │
│  SOURCE                                                │
│    github.com/anthropics/skills/tree/main/skills/xlsx  │
│                                                        │
└────────────────────────────────────────────────────────┘
```