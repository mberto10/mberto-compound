# Technical Investigation Guide

How to trace user experience issues to their root causes in code.

---

## Investigation Mindset

You're translating user symptoms into technical diagnoses:

```
USER SYMPTOM                    TECHNICAL ROOT CAUSE
──────────────                  ────────────────────
"Nothing happens"          →    Handler not connected, async not awaited
"Data disappears"          →    Not persisted, wrong endpoint, auth issue
"Shows wrong info"         →    Stale cache, race condition, wrong query
"Slow/unresponsive"        →    N+1 queries, missing index, large payload
"Error message unclear"    →    Generic catch, error not propagated
```

---

## Investigation Flow

### Step 1: Understand the Symptom

From the dogfooding report, extract:
- What was the user trying to do?
- What action did they take?
- What happened (or didn't happen)?
- Where in the app? (URL, screen, component)

### Step 2: Locate the Entry Point

Find where this interaction starts in code:

```bash
# Search for visible text (button labels, headings)
Grep: "Save Profile"
Grep: "Submit"

# Search for routes
Grep: "/onboard"
Grep: "path.*profile"

# Search for component names (from URL or page structure)
Glob: "**/ProfileForm*"
Glob: "**/Onboard*"
```

### Step 3: Trace the Data Flow

Follow the action through the code:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI EVENT  │────▶│   HANDLER   │────▶│   SERVICE   │
│  (onClick)  │     │ (function)  │     │  (API call) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    STATE    │     │   BACKEND   │
                    │  (update)   │     │  (process)  │
                    └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  DATABASE   │
                                       │  (persist)  │
                                       └─────────────┘
```

At each step, verify:
- Is this step being reached?
- Is it doing what it should?
- Is the output correct?
- Is error handling present?

### Step 4: Identify the Break Point

Where in the flow does it fail?

```
UI Event     ✓ Triggered (verified in component)
Handler      ✓ Called (function exists)
API Call     ✗ FAILS HERE - not awaited, returns immediately
Backend      - Never reached
Database     - Never updated
```

### Step 5: Document Root Cause

Specify exactly what's wrong and where:

```
ROOT CAUSE: API call not awaited
LOCATION: src/components/ProfileForm.tsx:47
CODE: updateProfile(data) // missing await
EFFECT: Handler completes before API finishes, no error handling
```

---

## Common Issue Patterns

### Pattern: "Nothing Happens When I Click"

**Symptoms:**
- Button click has no visible effect
- No loading, no error, no success

**Investigation checklist:**
```
[ ] Button has onClick handler attached?
[ ] Handler function is defined?
[ ] Handler is being called? (add console.log)
[ ] Handler calls expected function?
[ ] Async operations are awaited?
[ ] State updates trigger re-render?
[ ] Errors are caught and shown?
```

**Common root causes:**
- Handler not connected to button
- Async function not awaited (fire and forget)
- Error swallowed in try/catch with no feedback
- State update doesn't trigger UI change

**Search patterns:**
```bash
Grep: "onClick" in component file
Grep: "async.*=>" for async handlers
Grep: "catch" for error handling
```

---

### Pattern: "Data Doesn't Persist"

**Symptoms:**
- Fill form, submit, refresh, data gone
- Changes not saved

**Investigation checklist:**
```
[ ] Form submission calls save function?
[ ] Save function calls API?
[ ] API endpoint exists and is correct?
[ ] API receives the data?
[ ] Backend processes and persists?
[ ] Database connection configured?
[ ] Auth token included in request?
```

**Common root causes:**
- API endpoint wrong or missing
- Auth header not included (401 error swallowed)
- Backend validation fails silently
- Database write fails (connection, permissions)
- Success but cache not invalidated

**Search patterns:**
```bash
Grep: "fetch.*api" or "axios" in service files
Grep: "POST.*profile" in backend routes
Grep: "save|create|insert" in database layer
```

---

### Pattern: "Shows Wrong/Stale Data"

**Symptoms:**
- Data is outdated
- Changes not reflected
- Shows other user's data

**Investigation checklist:**
```
[ ] Data fetch on correct event? (mount, route change)
[ ] Query includes correct filters? (user ID, etc.)
[ ] Cache being used? When invalidated?
[ ] State updated with new data?
[ ] Component re-renders on state change?
```

**Common root causes:**
- Data cached and not refreshed
- Query missing user filter
- useEffect dependencies wrong
- State mutation instead of replacement
- Race condition in async fetches

**Search patterns:**
```bash
Grep: "useEffect" for fetch timing
Grep: "cache|Cache" for caching logic
Grep: "query.*where|filter" for data filtering
```

---

### Pattern: "Feature Seems Half-Built"

**Symptoms:**
- Button exists but doesn't do much
- Placeholder content
- "Coming soon" or TODO visible

**Investigation checklist:**
```
[ ] Handler has implementation or just placeholder?
[ ] Backend endpoint implemented?
[ ] Feature behind feature flag?
[ ] TODO/FIXME comments in area?
[ ] Console warnings about incomplete feature?
```

**Common root causes:**
- Handler is empty or has `// TODO` comment
- Feature flag hiding functionality
- Backend returns mock data
- Implementation started but not finished

**Search patterns:**
```bash
Grep: "TODO|FIXME|XXX" in relevant files
Grep: "mock|placeholder|coming"
Grep: "featureFlag|feature_flag|FF_"
```

---

### Pattern: "Error Message Unhelpful"

**Symptoms:**
- "Something went wrong"
- "Error: undefined"
- Technical jargon shown to user

**Investigation checklist:**
```
[ ] Error caught at right level?
[ ] Error message extracted correctly?
[ ] User-friendly message mapping exists?
[ ] Toast/alert component shows errors?
[ ] Original error logged for debugging?
```

**Common root causes:**
- Generic catch with no message extraction
- API error format not parsed correctly
- Error boundary catches all, shows nothing
- Backend returns technical errors to frontend

**Search patterns:**
```bash
Grep: "catch.*error" for error handling
Grep: "toast|alert|notify" for error display
Grep: "error.*message" for message handling
```

---

### Pattern: "Slow/Unresponsive"

**Symptoms:**
- Long loading times
- UI freezes during operations
- Spinner never ends

**Investigation checklist:**
```
[ ] API response time reasonable?
[ ] Query efficient? (no N+1, has indexes)
[ ] Large payloads being transferred?
[ ] Heavy computation on main thread?
[ ] Loading state managed correctly?
```

**Common root causes:**
- N+1 database queries
- Missing database indexes
- Fetching more data than needed
- No pagination for large lists
- Synchronous heavy computation

**Search patterns:**
```bash
Grep: "await.*await" for sequential fetches
Grep: "include|join|eager" for query optimization
Grep: "limit|offset|page" for pagination
```

---

## Code Investigation Commands

### Finding Components

```bash
# By visible text
Grep: '"Save Profile"' --type tsx
Grep: '"Submit"' --type tsx

# By route
Grep: 'path.*"/profile"' --type tsx
Grep: '<Route.*profile' --type tsx

# By component name
Glob: "**/ProfileForm*"
Glob: "**/components/*Profile*"
```

### Finding Handlers

```bash
# Event handlers
Grep: "onClick.*=" in ComponentFile.tsx
Grep: "onSubmit.*=" in ComponentFile.tsx
Grep: "handle[A-Z]" for handler functions

# Form handlers
Grep: "useForm|formik|react-hook-form"
```

### Finding API Calls

```bash
# Frontend
Grep: "fetch\(|axios\." for HTTP calls
Grep: "api\.|/api/" for API references
Grep: "useMutation|useQuery" for react-query

# Backend
Grep: "router\.(get|post|put|delete)" for routes
Grep: "@(Get|Post|Put|Delete)" for decorators
```

### Finding Database Operations

```bash
# ORM queries
Grep: "prisma\.|\.findMany|\.create"
Grep: "db\.|pool\.|query\("
Grep: "INSERT|UPDATE|SELECT" for raw SQL
```

---

## Technical Analysis Template

```
┌─────────────────────────────────────────────────────────────────────┐
│ TECHNICAL ANALYSIS: [Finding Title]                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ USER SYMPTOM:                                                       │
│ [From dogfooding report - what user experienced]                    │
│                                                                     │
│ INVESTIGATION PATH:                                                 │
│ 1. Started at: [UI component]                                       │
│ 2. Traced to: [handler/service]                                     │
│ 3. Found issue in: [specific location]                              │
│                                                                     │
│ ROOT CAUSE:                                                         │
│ [Technical explanation of what's wrong]                             │
│                                                                     │
│ CODE LOCATIONS:                                                     │
│ ┌──────────────────────────────────┬──────────────────────────────┐ │
│ │ File                             │ Issue                        │ │
│ ├──────────────────────────────────┼──────────────────────────────┤ │
│ │ src/components/Form.tsx:47       │ Missing await                │ │
│ │ src/services/api.ts:23           │ No auth header               │ │
│ └──────────────────────────────────┴──────────────────────────────┘ │
│                                                                     │
│ DATA FLOW DIAGRAM:                                                  │
│                                                                     │
│   Button Click                                                      │
│       │                                                             │
│       ▼                                                             │
│   handleSubmit() ✓                                                  │
│       │                                                             │
│       ▼                                                             │
│   saveProfile() ✗ NOT AWAITED                                       │
│       │                                                             │
│       ▼                                                             │
│   POST /api/profile → 401 (no auth header)                          │
│                                                                     │
│ EVIDENCE:                                                           │
│ • Network tab: POST returns 401 Unauthorized                        │
│ • Code: `saveProfile(data)` without await                           │
│ • API client missing Authorization header                           │
│                                                                     │
│ RECOMMENDED FIX:                                                    │
│                                                                     │
│ ```typescript                                                       │
│ // src/services/api.ts:23                                           │
│ headers: {                                                          │
│   'Content-Type': 'application/json',                               │
│ + 'Authorization': `Bearer ${getToken()}`                           │
│ }                                                                   │
│                                                                     │
│ // src/components/Form.tsx:47                                       │
│ - saveProfile(data);                                                │
│ + await saveProfile(data);                                          │
│ ```                                                                 │
│                                                                     │
│ CATEGORY: Technical Bug                                             │
│ FIX COMPLEXITY: Medium                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Issue Categories

### Technical Bug
Code doesn't do what it's supposed to.
- Missing await, wrong endpoint, null check needed
- **Fix:** Code change

### Integration Gap
External service/dependency not properly connected.
- Database not wired, API keys missing, service not running
- **Fix:** Configuration + possibly code

### Implementation Gap
Feature started but not completed.
- Handler exists but empty, backend stub, TODO comments
- **Fix:** Complete the implementation

### UX Gap (note for design)
Works technically but missing user feedback.
- No loading state, no success toast, no error message
- **Fix:** Add UI feedback components

---

## Fix Complexity Guide

**Low** (< 1 hour)
- Single file change
- Clear what to do
- No architectural impact
- Examples: add await, fix typo, add header

**Medium** (1-4 hours)
- Multiple file changes
- Some design decisions needed
- Contained impact
- Examples: add error handling, implement loading state

**High** (> 4 hours)
- Significant changes across codebase
- Architectural considerations
- Potential for regressions
- Examples: refactor data flow, add new feature area

---

## Verification After Fix

After identifying fixes, suggest verification steps:

```
VERIFICATION STEPS:
1. Apply the recommended fix
2. Restart dev server
3. Navigate to [URL]
4. Perform [action]
5. Verify [expected result]
6. Check console for errors
7. Check network for failed requests
```
