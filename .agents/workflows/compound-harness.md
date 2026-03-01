---
description: Autonomous engineering loop (plan -> work -> review -> commit)
---

# Harness Command

Execute an autonomous engineering loop: Plan → Work → Review → Commit.

**IMPORTANT:** Antigravity does not support the blocking `harness-stop-hook` used in Claude Code. This workflow runs the loop *sequentially* as a single long-running task or a set of manual steps. The user must manually re-trigger or approve steps if the agent pauses.

---

## Input

**Tasks:** The user's request or a list of Linear issue IDs.

---

## The Loop Structure

1. **Fetch Work** (from args or Linear)
2. **Plan** (create a plan for the work)
3. **Work** (execute the plan)
4. **Review** (verify the work)
5. **Commit** (save the work)
6. **Repeat** (next item)

---

## Step 1: Fetch Work

**If argument is provided:**
Treat it as a request description or Linear issue ID.

**If no argument:**
Fetch "In Progress" issues assigned to the user from Linear (if configured).

```
mcp request: linear-server/list_issues (assignee: me, state: In Progress)
```

Select the top priority item.

---

## Step 2: Plan

Run the `/compound-plan` workflow for the selected item.

```
/compound-plan {item description}
```

*Wait for user approval of the plan.*

---

## Step 3: Work

Run the `/compound-work` workflow to execute the plan.

```
/compound-work {plan reference}
```

*This step makes code changes.*

---

## Step 4: Review

Run the `/compound-review` workflow to verify changes.

```
/compound-review
```

*If review fails, go back to Step 3 (Work) to fix.*

---

## Step 5: Commit

If Review passes:

1. Generate a commit message based on the changes.
2. Commit the changes.

```
git add .
git commit -m "{message}"
```

3. Update Linear issue status (if applicable).

---

## Step 6: Loop or Exit

If there are more items to process, ask the user:
"Item complete. Proceed to next item: {next item}?"

If no more items, exit.

---

## Notes

- This is a **semi-autonomous** loop in Antigravity. The agent will stop for user confirmation at critical points (Plan approval, Review failure, Commit).
- Real "autonomy" requires the agent to be able to self-correct without user input, which is simulated here by the `If review fails` logic, but the user is the ultimate harness.
