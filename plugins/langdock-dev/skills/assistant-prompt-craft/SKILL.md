---
name: assistant-prompt-craft
description: This skill should be used when the user asks to "generate assistant system prompt", "create agent system prompt", "write langdock assistant instructions", "neue Assistenten-Anweisung", "Systemprompt erstellen", or needs to craft expertly-formulated German system prompts for Langdock assistants with tool integrations.
---

# Assistant Prompt Craft

Generate expertly-crafted German system prompts for Langdock assistants following current best practices for clarity, tool usage guidance, and behavioral constraints.

## When to Use

- Creating new Langdock assistant system prompts
- Refining existing assistant instructions
- Adding tool integration guidance to prompts
- Ensuring consistent German language quality

## Workflow

### Step 1: Gather Requirements

Before writing the prompt, collect essential information:

**Required:**
- **Purpose**: What is this assistant's primary function?
- **Target users**: Who will interact with this assistant?
- **Core tasks**: What specific tasks should it perform?

**If tools are involved:**
- **Tool names**: Which integrations are available?
- **Tool capabilities**: What can each tool do?
- **Tool actions**: Specific actions/endpoints per tool

**Optional:**
- **Tone/personality**: Professional, friendly, expert, etc.
- **Constraints**: What should the assistant NOT do?
- **Output format preferences**: Structured, conversational, etc.

### Step 2: Structure the Prompt

Follow this proven structure for German system prompts:

```
1. ROLLENIDENTITÄT (Role Identity)
   - Clear role definition
   - Core competencies
   - Personality traits

2. KERNAUFGABEN (Core Tasks)
   - Primary responsibilities
   - Task priorities
   - Success criteria

3. VERFÜGBARE WERKZEUGE (Available Tools)
   - Tool inventory with descriptions
   - When to use each tool
   - Tool-specific instructions

4. ARBEITSWEISE (Working Method)
   - Step-by-step approach
   - Decision-making guidelines
   - Quality standards

5. EINSCHRÄNKUNGEN (Constraints)
   - Explicit boundaries
   - Error handling
   - Escalation paths

6. AUSGABEFORMAT (Output Format)
   - Response structure
   - Formatting conventions
   - Language register
```

### Step 3: Write Tool Descriptions

For each tool, provide structured guidance:

```markdown
### [Tool Name]
**Beschreibung:** [What this tool does]
**Verfügbare Aktionen:**
- `action_name`: [What it does, when to use it]
- `action_name`: [What it does, when to use it]

**Anwendung:** [Specific scenarios when to use this tool]
**Hinweise:** [Important considerations or limitations]
```

**Tool Usage Principles:**
- Describe tools in terms of user benefit, not technical implementation
- Specify trigger conditions ("Nutze dieses Werkzeug, wenn...")
- Include negative guidance ("Nutze dieses Werkzeug NICHT für...")
- Order tools by frequency of expected use

### Step 4: Apply German Language Standards

**Register:** Use formal "Sie" unless specifically requested otherwise.

**Clarity patterns:**
- Active voice over passive
- Concrete verbs over abstract nouns
- Short sentences for instructions
- Bullet points for lists

**Instruction verbs (imperative):**
- Analysiere, Prüfe, Erstelle, Fasse zusammen
- Recherchiere, Verifiziere, Vergleiche
- Formuliere, Strukturiere, Präsentiere

See `references/german-style-guide.md` for comprehensive patterns.

### Step 5: Validate the Prompt

**Checklist before finalizing:**

- [ ] Role is clearly defined in first paragraph
- [ ] All provided tools are documented with actions
- [ ] Tool usage conditions are explicit
- [ ] Constraints are stated (not just implied)
- [ ] Output format is specified
- [ ] German is grammatically correct and consistent
- [ ] No English terms where German alternatives exist
- [ ] Length is appropriate (typically 500-1500 words)

---

## Prompt Templates

### Minimal Template (No Tools)

```markdown
Du bist [ROLLE] bei [KONTEXT].

## Deine Aufgaben
- [Aufgabe 1]
- [Aufgabe 2]
- [Aufgabe 3]

## Arbeitsweise
[Beschreibung des Vorgehens]

## Ausgabeformat
[Formatvorgaben]
```

### Standard Template (With Tools)

```markdown
Du bist [ROLLE] mit Zugriff auf spezialisierte Werkzeuge für [ZWECK].

## Kernaufgaben
1. [Primäre Aufgabe]
2. [Sekundäre Aufgabe]
3. [Tertiäre Aufgabe]

## Verfügbare Werkzeuge

### [Werkzeug 1]
**Beschreibung:** [Was es tut]
**Aktionen:**
- `aktion_1`: [Beschreibung]
- `aktion_2`: [Beschreibung]
**Anwendung:** Nutze dieses Werkzeug, wenn [Bedingung].

### [Werkzeug 2]
[Gleiche Struktur]

## Arbeitsweise
1. [Schritt 1]
2. [Schritt 2]
3. [Schritt 3]

## Einschränkungen
- [Was der Assistent NICHT tun soll]
- [Grenzen der Zuständigkeit]

## Ausgabeformat
[Strukturvorgaben für Antworten]
```

---

## Best Practices

### Tool Call Optimization

**Explicit triggers** - State exactly when to use tools:
```
Nutze die Exa-Suche für:
- Aktuelle Nachrichtenartikel (< 7 Tage)
- Unternehmens- und Personenrecherche
- Quellensuche zu spezifischen Themen

Nutze die Exa-Suche NICHT für:
- Allgemeinwissen, das du bereits hast
- Berechnungen oder Analysen
- Meinungsfragen
```

**Action specificity** - Describe concrete actions:
```
### Perplexity
**Aktionen:**
- `search`: Schnelle Faktenprüfung und aktuelle Informationen
- `deep_research`: Umfassende Themenrecherche mit Quellenangaben
```

**Sequencing guidance** - Order of operations:
```
## Arbeitsweise bei Rechercheanfragen
1. Prüfe zunächst, ob die Information aus deinem Wissen beantwortet werden kann
2. Nutze Perplexity für schnelle Faktenprüfung
3. Nutze Exa für tiefergehende Quellenrecherche
4. Synthetisiere die Ergebnisse zu einer strukturierten Antwort
```

### Behavioral Guardrails

**Positive framing:**
```
Gib bei Unsicherheit an, dass weitere Recherche nötig ist, anstatt zu spekulieren.
```

**Explicit boundaries:**
```
## Einschränkungen
- Keine rechtlichen oder medizinischen Ratschläge
- Keine Spekulation über nicht-öffentliche Informationen
- Bei Widersprüchen in Quellen: transparent machen, nicht auflösen
```

---

## Additional Resources

### Reference Files

For detailed guidance, consult:
- **`references/prompt-structure.md`** - Deep dive into each prompt section
- **`references/tool-description-patterns.md`** - Patterns for various tool types
- **`references/german-style-guide.md`** - German language conventions

### Example Files

Working examples in `examples/`:
- **`research-assistant.md`** - Research assistant with Exa/Perplexity
- **`editor-assistant.md`** - Editorial assistant for journalism
