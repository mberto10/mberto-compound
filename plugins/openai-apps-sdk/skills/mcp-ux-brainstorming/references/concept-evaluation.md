# MCP App Concept Evaluation Rubric

## Detailed Scoring Guide

Use this rubric to objectively evaluate ChatGPT app concepts.

## Criterion 1: Conversational Value (1-5)

Does the app leverage natural language or conversation context?

| Score | Description |
|-------|-------------|
| 5 | **Exceptional** - Natural language is core to the experience; couldn't work without conversation |
| 4 | **Strong** - Significantly enhanced by conversational context and multi-turn interaction |
| 3 | **Moderate** - Some benefit from conversation, but could work as traditional UI |
| 2 | **Limited** - Conversation is mostly for triggering; little contextual benefit |
| 1 | **None** - This would work better as a regular app/website |

**Questions to ask:**
- Would users naturally phrase this as a question to ChatGPT?
- Does the app benefit from remembering previous turns?
- Is natural language input easier than forms/buttons?

**Examples:**
- 5: "Help me write an email to decline this meeting politely" (needs context, tone, refinement)
- 3: "What's my account balance?" (simple lookup, but natural to ask)
- 1: "Browse our product catalog" (better as a website)

## Criterion 2: Unique Data/Action (1-5)

Does the app provide something ChatGPT cannot do alone?

| Score | Description |
|-------|-------------|
| 5 | **Essential** - Real-time data or actions that only you can provide |
| 4 | **Valuable** - Proprietary data that significantly enhances responses |
| 3 | **Useful** - Access to specific data, but ChatGPT could approximate |
| 2 | **Marginal** - Minimal unique value over base ChatGPT |
| 1 | **None** - ChatGPT can already do this without your app |

**Questions to ask:**
- Does this require real-time data (prices, availability, status)?
- Does this require actions (bookings, payments, sends)?
- Is this proprietary information ChatGPT doesn't have?

**Examples:**
- 5: Flight booking with real-time prices and seat availability
- 3: Restaurant recommendations (ChatGPT knows restaurants, but you have real-time reservations)
- 1: "Explain quantum physics" (ChatGPT already does this)

## Criterion 3: Atomic Actions (1-5)

Can tasks complete in 1-2 tool calls?

| Score | Description |
|-------|-------------|
| 5 | **Perfect** - Single tool call accomplishes the user's goal |
| 4 | **Clean** - 2 tool calls with clear progression |
| 3 | **Acceptable** - 3-4 calls, but each is meaningful |
| 2 | **Complex** - Multiple calls that feel like workarounds |
| 1 | **Fragmented** - Many calls required; feels like navigating menus |

**Questions to ask:**
- How many tool calls to complete the core task?
- Does each call produce meaningful progress?
- Could tool calls be combined?

**Examples:**
- 5: "Reorder my usual" → single order_create call
- 3: "Find and book a restaurant" → search, then book
- 1: "Set up my account" → 10 calls for profile, preferences, settings

## Criterion 4: UI Necessity (1-5)

Does the widget add value beyond what text can communicate?

| Score | Description |
|-------|-------------|
| 5 | **Essential** - Visual representation is required (maps, images, selection) |
| 4 | **Valuable** - Visual significantly improves comprehension or efficiency |
| 3 | **Helpful** - Nice visual enhancement, but text would work |
| 2 | **Marginal** - Widget mostly decorative; text is sufficient |
| 1 | **Unnecessary** - Widget adds no value over text response |

**Questions to ask:**
- Could the model just say this instead?
- Is visual comparison needed?
- Is there interactive selection required?
- Would users "glance" at the widget?

**Examples:**
- 5: Product carousel for comparing options visually
- 3: Order confirmation card (nice formatting, but text works)
- 1: "Your request was successful" widget (just say it)

## Criterion 5: Task Completion (1-5)

Can users finish the entire task within ChatGPT?

| Score | Description |
|-------|-------------|
| 5 | **Complete** - User accomplishes goal entirely in chat |
| 4 | **Nearly Complete** - One small external step (e.g., email verification) |
| 3 | **Mostly Complete** - Core action in chat, but follow-up outside |
| 2 | **Partial** - Significant portion requires leaving ChatGPT |
| 1 | **Incomplete** - Just links to your website/app |

**Questions to ask:**
- Does the user achieve their goal without leaving ChatGPT?
- Are there required external steps?
- Is the app just a fancy link?

**Examples:**
- 5: Book a restaurant and receive confirmation in chat
- 3: Start a return, but need to print shipping label externally
- 1: "Click here to view on our website"

## Scoring Matrix

| Total Score | Assessment | Recommendation |
|-------------|------------|----------------|
| 22-25 | **Excellent** | Strong candidate, proceed with development |
| 18-21 | **Good** | Viable concept, refine weak areas |
| 14-17 | **Needs Work** | Reconsider approach or scope |
| 10-13 | **Weak** | Major pivot needed |
| 5-9 | **Not Suitable** | This may not be right for ChatGPT |

## Red Flags

Automatic disqualifiers regardless of score:

- ❌ Requires users to leave ChatGPT for core functionality
- ❌ Ads, upsells, or marketing content as primary purpose
- ❌ Sensitive data displayed in visible cards (SSN, passwords)
- ❌ Duplicates core ChatGPT functionality
- ❌ Multi-step navigation within widgets
- ❌ Dashboard/analytics focus without clear action

## Comparative Analysis

When choosing between concepts, create a comparison table:

| Criterion | Concept A | Concept B | Concept C |
|-----------|-----------|-----------|-----------|
| Conversational Value | | | |
| Unique Data | | | |
| Atomic Actions | | | |
| UI Necessity | | | |
| Task Completion | | | |
| **Total** | | | |

## Iteration Questions

For concepts scoring 14-21, ask:

1. **How might we increase conversational value?**
   - Add context awareness
   - Enable multi-turn refinement
   - Leverage conversation history

2. **How might we make actions more atomic?**
   - Combine related tools
   - Let model infer parameters
   - Add smart defaults

3. **How might we justify the UI?**
   - Add visual comparison
   - Enable interactive selection
   - Show data that needs structure

4. **How might we complete more in-chat?**
   - Add confirmation flows
   - Reduce external dependencies
   - Handle edge cases in conversation
