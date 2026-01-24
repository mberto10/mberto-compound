# Optimization Target (Layer 2)

Purpose: define the goal, constraints, and optimization surface.

## Minimal Spec

```yaml
optimization_target:
  goal:
    metric: "<metric>"
    current: <value>
    target: <value>
    direction: maximize | minimize
  constraints:
    hard:
      boundaries:
        - path: "<frozen path>"
      regressions:
        - metric: "<metric>"
          threshold: <value>
  optimization_surface:
    main_knob:
      type: config | prompt | grader | code | architecture
      location: "<path>"
    frozen:
      - "<path>"
```

## Notes

- Main knob must be within scope and able to affect the goal metric
- Hard boundaries stop the loop if violated
- Regression guards must be checked after every change
