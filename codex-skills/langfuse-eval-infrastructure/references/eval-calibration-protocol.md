# Eval Calibration Protocol

This protocol keeps LLM-judge scores aligned with human judgment while preserving canonical `0-1` thresholds.

## 1. Build Calibration Set

Create a compact set of 20-30 examples with human labels:
- 8-10 high quality examples
- 8-10 low quality examples
- 4-10 borderline examples

Include annotation comments so evaluators capture failure reasons, not only numeric labels.

## 2. Judge Prompt Validation

For each `judge-*` prompt:

1. Run the judge against calibration examples.
2. Compare judge normalized scores (`0-1`) against human expectations.
3. Inspect mismatches and update rubric language.
4. Promote prompt revision only after mismatch reduction.

## 3. Threshold Tuning

Thresholds in `dimensions[].threshold` must be tuned with observed distributions:
- Start at `0.8` for quality dimensions.
- Raise/lower by small increments (`0.05`) based on false pass/fail balance.
- Mark truly blocking dimensions as `critical=true`.

## 4. Regression Gate Check

Before adopting a new judge version:
- Compare old vs new scores on the same calibration set.
- Verify no high-confidence regressions on critical cases.
- Capture calibration notes in run descriptions.

## 5. Ongoing Drift Monitoring

Weekly or per major release:
- Re-run calibration set.
- Check trend drift in score analytics.
- Recalibrate if drift exceeds acceptable range.

## Output Expectations

Each calibration cycle should produce:
- Prompt versions tested
- Agreement summary (human vs judge)
- Updated thresholds (if changed)
- Decision (`keep`, `update`, `rollback`)
