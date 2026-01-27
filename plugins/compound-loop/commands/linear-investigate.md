# Linear Issue Investigation & Implementation Planning

You are investigating a Linear issue to create a comprehensive implementation plan.

## Step 1: Retrieve the Linear Issue

Fetch the Linear issue and extract all relevant information:
- Title, description, and acceptance criteria
- Priority, labels, and status
- Linked issues, parent/child relationships
- Comments and team discussion
- Assignee and reporter context

Summarize the core problem and desired outcome in 2-3 sentences.

## Step 2: Deep Codebase Exploration

Thoroughly explore the codebase to build comprehensive context. Investigate:

**Architecture & Affected Areas**
- Which files, modules, and systems are relevant to this issue?
- What is the data flow through these areas?
- What are the entry points and boundaries?

**Existing Patterns & Conventions**
- How are similar problems solved elsewhere in the codebase?
- What naming conventions, file structures, and architectural patterns should you follow?
- Are there utilities, helpers, or abstractions you should reuse?

**Dependencies & Impact**
- What code depends on the areas you'll modify?
- What external services, APIs, or packages are involved?
- Could changes here break other functionality?

**Test Coverage & Validation**
- What tests exist for the affected areas?
- What testing patterns and frameworks are used?
- What would comprehensive test coverage look like?

**Git History & Context**
- Have relevant files changed recently? Why?
- Are there related PRs or commits that provide context?
- Has this problem been attempted before?

## Step 3: Identify & Resolve Uncertainties

For EACH uncertainty or ambiguity, use the AskUserQuestion tool with this format:

1. **State the uncertainty clearly** - What exactly is unclear?
2. **Provide your recommendation** - Based on your codebase exploration, what do you think is the best approach and why?
3. **Offer concrete options** - Give 2-4 specific choices (not vague alternatives)
4. **Explain tradeoffs** - What are the pros/cons of each option?

Example:
```
Uncertainty: The issue says "improve error handling" but doesn't specify the scope.

My recommendation: Focus on the API layer (`src/api/`) based on recent error-related commits
and existing error handling patterns in `src/api/middleware/errorHandler.ts`.

Options:
A) API layer only - Matches existing patterns, lowest risk, addresses most user-facing errors
B) API + service layer - More comprehensive but larger scope, may surface edge cases
C) Full stack including client - Maximum coverage but significantly more work

Tradeoffs: Option A is safest and delivers value quickly. Option B is better long-term but
doubles the scope. Option C should probably be a separate issue.
```

Do not proceed past uncertainties that significantly impact the implementation approach. Get clarity first.

## Step 4: Propose Implementation Plan

Create a detailed implementation plan with:

**Tasks/Tickets**
Break the work into atomic, committable tasks. Each task must have:
- Clear, specific title (action verb + what)
- Description of what exactly to do
- Acceptance criteria / definition of done
- Validation method (tests, manual verification, etc.)
- Estimated complexity (S/M/L)
- Dependencies on other tasks

**Task Sequencing**
- Order tasks by dependencies (what must come first?)
- Group into logical phases if applicable
- Identify what can be parallelized vs. must be sequential

**Risk Areas & Edge Cases**
- Flag anything that needs extra review
- Note potential edge cases to test
- Identify areas where the implementation might need adjustment

**Validation Strategy**
- What tests will you write/modify?
- How will you verify the fix works end-to-end?
- What could you demo to show completion?

## Output Format

Write your complete analysis and plan to a markdown file at:
`.context/linear-{ISSUE_ID}-plan.md`

Structure:
1. Issue Summary
2. Codebase Analysis (key findings)
3. Resolved Uncertainties (questions asked + answers received)
4. Implementation Plan (tasks with full details)
5. Risk Assessment
6. Validation Checklist
