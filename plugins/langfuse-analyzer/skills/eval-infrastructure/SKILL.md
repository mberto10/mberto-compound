---
name: langfuse-eval-infrastructure
description: This skill should be used when the user asks to "set up evaluation infrastructure", "bootstrap evals", "prepare dataset and judges", "define eval dimensions", "export eval snapshot", "check eval readiness", or needs Langfuse-first evaluation setup for agent optimization loops.
---

# Langfuse Eval Infrastructure

Establish and maintain a Langfuse-first evaluation infrastructure contract for agent improvement workflows.

## Purpose

This skill is the bridge between evaluation setup and the optimization loop. It produces the **eval contract** — the structured document that the optimization loop consumes as its preflight gate before any iteration begins.

Three responsibilities:

1. **Define dimensions and thresholds** — the quality facets against which every agent change is measured.
2. **Store canonical state in Langfuse** — dataset metadata and judge prompts live in Langfuse as the source of truth (dataset-backed mode) or in local contract files (live-trace mode).
3. **Export local snapshots** — the optimization loop reads `.claude/eval-infra/<agent>.yaml|json`; this skill writes those files.

> **Why it matters:** The optimization loop refuses to start without a valid contract. Dimensions become quality facets tracked in the optimization journal. The baseline is the keep/rollback comparison target — every iteration's scores are compared against it. If a `critical` dimension regresses, the loop triggers an immediate rollback regardless of weighted-average performance.

## Contract Schema — Annotated Example

The JSON below is an **annotated example**, not a literal template. Adapt names, thresholds, and dimensions to your agent.

```json
{
  "schema_version": "eval_infra_v1",
  "agent": {
    "name": "my-agent",
    "entry_point": "python app.py"
  },
  "score_scale": "0-1",
  "dimensions": [
    {
      "name": "accuracy",
      "judge_prompt": "judge-accuracy",
      "threshold": 0.8,
      "weight": 1.0,
      "critical": true
    },
    {
      "name": "relevance",
      "judge_prompt": "judge-relevance",
      "threshold": 0.75,
      "weight": 1.0,
      "critical": false
    }
  ],
  "judge_prompts": ["judge-accuracy", "judge-relevance"],
  "baseline": {
    "run_name": "baseline-20260212-173000",
    "created_at": "2026-02-12T17:30:00Z",
    "metrics": {
      "accuracy": 0.74,
      "relevance": 0.81
    }
  },
  "status": {
    "dataset_ready": true,
    "judges_ready": true,
    "baseline_ready": false
  }
}
```

### Field Reference

| Field | Description |
|-------|-------------|
| `schema_version` | Version gate — must be `eval_infra_v1`. The loop rejects unknown versions. |
| `agent.name` | Key used for snapshot filenames, journal entries, and run names. |
| `agent.entry_point` | Shell command to invoke the agent (used by `baseline` and experiment runner). |
| `score_scale` | Always `0-1`. Judge prompts may internally use 0–10; runtime normalizes before threshold comparison. |
| `dimensions[].name` | Becomes the score name in Langfuse and the metric key in the optimization journal. Use lowercase kebab-case. |
| `dimensions[].judge_prompt` | Name of the Langfuse prompt used to evaluate this dimension. Convention: `judge-<name>`. |
| `dimensions[].threshold` | Minimum acceptable score (0–1). Iteration fails if the dimension score falls below this. |
| `dimensions[].weight` | Relative importance when computing weighted-average pass/fail. Default `1.0`. |
| `dimensions[].critical` | `true` = immediate rollback on regression vs. baseline, no weighted-average escape. |
| `judge_prompts` | Derived list — all `judge_prompt` values from `dimensions`. Used for idempotent prompt creation. |
| `baseline.run_name` | Name of the Langfuse dataset run holding baseline scores. |
| `baseline.created_at` | ISO-8601 timestamp of the baseline run. |
| `baseline.metrics` | Per-dimension baseline scores. Every iteration is compared against these values. |
| `status.dataset_ready` | `true` when the Langfuse dataset exists and contains items. |
| `status.judges_ready` | `true` when all `judge_prompts` exist in the Langfuse prompt registry. |
| `status.baseline_ready` | `true` when `baseline.run_name` references a real run with populated metrics. |

## Designing Your Eval Contract

### Choosing Dimensions

Start with 2–4 dimensions. Common patterns:

- **Accuracy** — factual correctness of the agent output
- **Relevance** — response addresses the actual question/task
- **Safety** — absence of harmful, biased, or policy-violating content
- **Format compliance** — output matches expected structure (JSON, markdown, tool calls)

Litmus test for each candidate dimension: *"Would regression here break the agent for its users?"* If yes, include it. If not, defer it until you need finer-grained signal.

### Setting Thresholds

- Start at `0.80` for most dimensions.
- After the first baseline run, inspect the actual score distribution. If baseline accuracy is 0.74, setting threshold to 0.80 means every iteration must improve accuracy — this is intentional.
- Tighten by `0.05` increments as judges stabilize and the agent improves. Avoid tightening before you trust the judge calibration.

### Weight and Critical Flags

- Leave `weight: 1.0` unless one dimension is definitionally more important (e.g., accuracy 2× more important than format compliance → `weight: 2.0` vs. `1.0`).
- Reserve `critical: true` for **safety and data-integrity dimensions only**. A critical flag means any regression triggers immediate rollback — no weighted-average escape hatch. Overusing it makes the loop too conservative.

## Bootstrap Modes

### Dataset-Backed (`bootstrap`)

Use when you have (or will create) a Langfuse dataset with labeled examples.

- **Source of truth:** Langfuse dataset metadata
- **Flow:** `bootstrap` → `ensure-judges` → `baseline` → `export`
- **What it does:** Creates the dataset if missing, writes the `eval_infra_v1` metadata contract into dataset metadata, creates judge prompts idempotently, and optionally pulls dimensions from an existing agent config at `.claude/agent-eval/<agent>.yaml`.

```bash
$HELPER bootstrap --agent "my-agent" --dataset "my-agent-eval" \
  --dimensions '[{"name":"accuracy","threshold":0.8,"weight":1.0,"critical":true}]'
$HELPER baseline --agent "my-agent" --dataset "my-agent-eval" --task-script ./task.py
$HELPER export --agent "my-agent" --dataset "my-agent-eval"
```

### Live-Trace (`bootstrap-live`)

Use when there is no curated dataset — evaluation runs against recent production traces.

- **Source of truth:** Local contract files (`.claude/eval-infra/<agent>.json|yaml`)
- **No Langfuse dataset required** — the contract is written directly to disk.
- **Key flags:**
  - `--sample-size N` — number of recent traces to evaluate per iteration (default: 10)
  - `--skip-judges` — skip judge prompt creation when judges are managed externally

```bash
$HELPER bootstrap-live --agent "my-agent" \
  --dimensions '[{"name":"accuracy","threshold":0.8,"weight":1.0,"critical":true}]' \
  --sample-size 20
```

The resulting contract includes `"source": {"type": "live", "count": 20}` and `"status": {"live_mode": true}` so the optimization loop knows to fetch traces instead of iterating over a dataset.

## Downstream: Optimization Loop Integration

### What the loop reads

The optimization loop resolves the contract from:
- `.claude/eval-infra/<agent>.yaml` (primary)
- `.claude/eval-infra/<agent>.json` (fallback)

### How dimensions flow into the loop

- Each dimension becomes a key in `meta.target.dimensions` in the optimization journal.
- `baseline.metrics` provides the comparison target — every iteration's scores are diffed against these.
- A `critical: true` dimension that regresses below its baseline metric triggers an immediate rollback.
- Non-critical dimensions are aggregated via weighted average for the overall pass/fail decision.

### Error classes

The loop will halt with one of these if the contract is invalid:

| Error | Cause |
|-------|-------|
| `CONTRACT_NOT_FOUND` | No snapshot file at the expected path. Run `export`. |
| `CONTRACT_PARSE_ERROR` | Snapshot file is not valid JSON/YAML. Re-export from Langfuse. |
| `CONTRACT_INVALID` | Required fields missing or `schema_version` mismatch. Re-bootstrap. |
| `CONTRACT_LIVE_VALIDATION_FAILED` | Live-mode references (judge prompts, trace source) could not be validated. Check Langfuse connectivity. |

## CLI Reference

```bash
HELPER="python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py"
```

### `assess` — Check infrastructure readiness

```bash
$HELPER assess --agent <name> --dataset <dataset>
```

Reports dataset existence, schema validity, dimension count, missing judge prompts, and baseline status.

### `bootstrap` — Dataset-backed setup

```bash
$HELPER bootstrap --agent <name> --dataset <dataset> \
  [--dimensions '<json-list>'] [--entry-point <cmd>] [--description <text>]
```

Creates dataset if missing, writes `eval_infra_v1` metadata, and creates judge prompts. Dimensions can be provided via `--dimensions` or auto-loaded from `.claude/agent-eval/<agent>.yaml`.

### `bootstrap-live` — Live-trace setup

```bash
$HELPER bootstrap-live --agent <name> \
  [--dimensions '<json-list>'] [--entry-point <cmd>] \
  [--sample-size <int>] [--skip-judges]
```

Writes a local contract file without creating a Langfuse dataset. Use `--skip-judges` when judge prompts are managed externally.

### `ensure-judges` — Create missing judge prompts

```bash
$HELPER ensure-judges --dataset <dataset> --dimensions '<json-list>'
```

Idempotently creates judge prompts in the Langfuse prompt registry for each dimension.

### `baseline` — Verify or run baseline

```bash
$HELPER baseline --agent <name> --dataset <dataset> \
  [--task-script <path>] [--run-name <name>] \
  [--sample-size <int>] [--max-concurrency <int>]
```

Without `--task-script`: reports current baseline status. With `--task-script`: executes a full baseline experiment run and updates dataset metadata with the resulting scores.

### `export` — Export local snapshots

```bash
$HELPER export --agent <name> --dataset <dataset> [--output-dir <path>]
```

Writes `.claude/eval-infra/<agent>.json`, `.claude/eval-infra/<agent>.yaml`, and `.claude/agent-eval/<agent>.yaml` (legacy compatibility).

## Operational Guidance

1. **Source of truth by mode:** In dataset-backed mode, Langfuse dataset metadata is canonical — local files are generated views. In live-trace mode, local contract files are the source of truth.
2. **Judge naming stability:** Keep judge prompt names stable (`judge-<dimension>`) across iterations. Renaming a judge prompt breaks the link between the contract and stored scores.
3. **Idempotency:** All setup commands are idempotent. Re-running `bootstrap` or `ensure-judges` will not duplicate resources.
4. **Re-export after changes:** If you update dimensions or baseline in Langfuse, re-run `export` to sync local snapshots before starting an optimization loop.
5. **Calibrate before tightening:** Do not raise thresholds until you have run at least 2–3 iterations and verified that judge scores are stable and meaningful. See `eval-calibration-protocol.md`.
6. **Score scale policy:** Canonical scale is `0-1`. Judge prompts may use 0–10 for readability; runtime normalizes raw scores before threshold comparison.
7. **One contract per agent:** Each agent gets its own contract file. Do not combine multiple agents into a single contract.

## References

- `references/eval-infra-schema.md` — full schema definition
- `references/eval-calibration-protocol.md` — judge calibration workflow
- `plugins/agentic-optimization-loop/references/eval-contract.md` — consumer contract (optimization loop side)
