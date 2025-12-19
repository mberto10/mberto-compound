# work-toolkit

Personal management plugin for daily planning with Linear, German business communication, YouTrack documentation, and meeting preparation.

## Features

- **Daily Planning** - Morning routine with Linear task review and prioritization
- **Meeting Preparation** - JF, stakeholder updates, and Lenkungsausschuss prep
- **German Communication** - Email drafting for status updates and meeting follow-ups
- **Content Structuring** - Presentations, documentation, and milestone planning
- **Linear Integration** - Query and manage personal tasks
- **YouTrack Integration** - Project documentation and KW updates

## Installation

```bash
/plugin work-toolkit
```

## Prerequisites

Set environment variables:

```bash
# Linear API
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxxxxx"

# YouTrack API
export YOUTRACK_API_TOKEN="perm:xxxxxxxxxxxxxxxx"
```

## Commands

### Daily Workflow
| Command | Description | Example |
|---------|-------------|---------|
| `/start-day` | Morning planning session | `/start-day today` |
| `/linear` | Manage Linear tasks | `/linear tasks` |

### Communication
| Command | Description | Example |
|---------|-------------|---------|
| `/draft-email` | Draft German emails | `/draft-email status RAG Update` |
| `/weekly-email` | Compile Lenkungsausschuss update | `/weekly-email --kw=51` |

### Meeting Preparation
| Command | Description | Example |
|---------|-------------|---------|
| `/prepare-jf` | Prepare Jour Fixe meeting | `/prepare-jf "RAG Pipeline"` |
| `/prepare-update` | Prepare update for audience | `/prepare-update stakeholder` |

### Project Planning
| Command | Description | Example |
|---------|-------------|---------|
| `/generate-milestones` | Generate project milestones | `/generate-milestones "Chatbot"` |
| `/structure` | Structure content | `/structure pres Architecture` |

### YouTrack
| Command | Description | Example |
|---------|-------------|---------|
| `/youtrack` | Query YouTrack | `/youtrack get AI-74` |
| `/update-youtrack-epic` | Post KW update | `/update-youtrack-epic "Project"` |

## Skills

Auto-activating knowledge:

- **Meetings Workflow** - JF prep, stakeholder updates, agenda templates
- **YouTrack Dashboard** - YouTrack API, KW updates, project tracking
- **Linear Workflow** - Task management, daily planning
- **German Business Communication** - Email templates, tone guidance
- **Content Structuring** - Presentations, documentation, milestone planning

## Workflows

### Daily Workflow
```
Morning:   /start-day → Review Linear → Plan day
During:    Work tasks → /linear progress <id>
Comms:     /draft-email status → Review → Send
Evening:   /linear done <id> → Update YouTrack docs
```

### Weekly Workflow
```
Monday:    /start-day week → Plan weekly priorities
Friday:    /weekly-email → Send Lenkungsausschuss update
           /update-youtrack-epic → Update project KW comments
```

### Meeting Preparation
```
Before JF:       /prepare-jf "Project" → Review → Print/Share
Before Update:   /prepare-update stakeholder → Tailor message
New Project:     /generate-milestones "Project" → Review → Create issues
```

## Helper Tools

CLI scripts in `helper_tools/`:

```bash
# Linear
python helper_tools/linear/linear.py tasks
python helper_tools/linear/linear.py create "New task"
python helper_tools/linear/linear.py done ABC-123

# YouTrack
python helper_tools/youtrack/yt.py get AI-74
python helper_tools/youtrack/yt.py comment AI-74 "Update text"
python helper_tools/youtrack/get_kw_updates.py --kw=51
```

## Project Structure

```
work-toolkit/
├── .claude-plugin/plugin.json
├── skills/
│   ├── meetings-workflow/      # NEW: JF and update prep
│   ├── youtrack-dashboard/
│   ├── linear-workflow/
│   ├── communication/
│   └── structuring/
├── commands/
│   ├── start-day.md
│   ├── draft-email.md
│   ├── structure.md
│   ├── linear.md
│   ├── youtrack.md
│   ├── update-youtrack-epic.md
│   ├── weekly-email.md
│   ├── prepare-jf.md           # NEW
│   ├── prepare-update.md       # NEW
│   └── generate-milestones.md  # NEW
└── helper_tools/
    ├── linear/
    └── youtrack/
```

## Configuration

### Linear
- Get API key from Linear Settings → API
- Key format: `lin_api_xxxxx`

### YouTrack
- Base URL: `https://fazit.youtrack.cloud`
- Get token from Profile → Account Security
- Default project: AI (ID: 0-331)
