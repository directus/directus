# .claude/ Workflow Template - Organized Edition

**Production-tested project workflow system with GitHub integration**

**Source:** Extracted from proffbemanning-dashboard (17 sessions, battle-tested)
**Version:** 2.0 (Organized - October 2025)
**Philosophy:** Organized > Complex, Examples > Empty Templates

---

## What This Is

A complete workflow system for Claude Code projects featuring:
- ✅ **12 organized commands** (core, quality, advanced, utils)
- ✅ **GitHub Project integration** (two-way sync)
- ✅ **Session & task analytics** (track performance, improve over time)
- ✅ **Quality metrics** (specialist performance, estimation accuracy)
- ✅ **Real examples** (production patterns from actual project)

---

## Quick Start (30 seconds)

```bash
# 1. Copy to your project
cp -r .claude-template-organized/ /path/to/your-project/.claude/

# 2. Configure (required)
cd /path/to/your-project
vi .claude/config/project.json        # Edit project details
vi .claude/config/github-project.json # Edit GitHub config (if using)

# 3. Clean up examples (optional)
vi .claude/CLEANUP_GUIDE.md           # Read this first

# 4. Start working
/work                                 # Pick first task
```

**Done. You're ready to work.**

---

## Command Overview

### Core (Daily Use)
- `/work` - Start session + pick task + create branch
- `/done` - Finish task + create PR + update analytics
- `/status` - Project dashboard (tasks, metrics, health)
- `/sync` - GitHub Project two-way sync
- `/check` - Fast validation (type, test, lint)

### Quality
- `/test` - Run test suite with coverage
- `/fix` - Auto-fix common issues

### Advanced
- `/analytics` - Deep performance insights
- `/debug` - Error diagnosis
- `/rollback` - Undo operations safely

### Utils
- `/experiment` - Safe experimentation branch
- `/archive` - Snapshot current state

**See:** `commands/README.md` for full reference

---

## Typical Workflow

```bash
# Morning
/work              # Start session, pick task

# During development
/status            # Check progress
/check             # Validate before commit

# Finish task
/done              # Commit, PR, analytics

# End of day
/sync              # Sync with team
```

**3-5 commands per day. That's it.**

---

## Directory Structure

```
.claude/
├── commands/              # 12 organized commands
│   ├── core/             # Daily workflow (5)
│   ├── quality/          # Testing & fixes (2)
│   ├── advanced/         # Power user (3)
│   └── utils/            # Experiments & safety (2)
│
├── config/               # Project configuration
│   ├── project.json.template
│   └── github-project.json.template
│
├── examples/             # Production patterns (OPTIONAL)
│   ├── dashboard/        # UI component patterns
│   └── design-systems/   # Design system docs
│
├── scripts/              # Automation scripts
│   ├── analytics/        # Session & task tracking
│   └── github/           # GitHub integration
│
├── analytics/            # Metrics & insights (auto-populated)
│   ├── session-history.json
│   ├── task-timing.json
│   └── specialist-performance.json
│
├── CLEANUP_GUIDE.md      # Customization instructions
└── README.md             # This file
```

---

## Features

### Session Management
- Auto-tracks work sessions
- Calculates duration, productivity
- Maintains streak counter
- Orphaned session detection

### Task Management
- GitHub Project integration
- Auto-creates feature branches
- Generates optimized prompts
- Tracks estimation accuracy

### Quality Metrics
- Specialist performance scoring
- Quality streak tracking
- Error pattern analysis
- Continuous improvement

### GitHub Integration
- Two-way sync with Project board
- Auto-creates PRs with templates
- Links issues to commits
- CI trigger automation

### Analytics
- Session insights
- Sprint progress tracking
- Velocity calculations
- Performance recommendations

---

## Examples Directory

**Location:** `examples/`

Contains real production patterns from proffbemanning-dashboard:
- Dashboard UI components
- Dark mode design system
- Asymmetric layout patterns

**Usage:**
- Keep as learning resources
- Adapt for your project
- Delete if not relevant

**See:** `examples/README.md` for details

---

## Configuration

### Required (5 minutes)

**1. Project Config**
```json
// .claude/config/project.json
{
  "name": "Your Project",
  "slug": "your-project",
  "type": "web",
  "tech_stack": ["Next.js", "TypeScript"],
  "analytics_enabled": true
}
```

**2. GitHub Config** (if using)
```json
// .claude/config/github-project.json
{
  "owner": "your-username",
  "repo": "your-repo",
  "projectNumber": 7,  // From project URL
  "token": "ghp_..."   // GitHub PAT
}
```

### Optional
- Custom commands: `commands/custom/`
- Project-specific patterns: `patterns/`
- Additional scripts: `scripts/custom/`

---

## Without GitHub

**Works perfectly without GitHub Project:**
- Uses KANBAN.md for task management
- Local-only analytics
- Manual PR creation
- All core features work

**To disable GitHub:**
```json
// .claude/config/project.json
{
  "github_integration": false
}
```

---

## Customization

**See:** `CLEANUP_GUIDE.md` for complete customization guide

**Common customizations:**
1. Delete `examples/` if not building dashboard
2. Add custom commands in `commands/custom/`
3. Adapt analytics scripts for your tools
4. Configure CI integration

**Philosophy:** Start with defaults, customize as you learn.

---

## Success Metrics (From Original Project)

**proffbemanning-dashboard:**
- 17 production sessions
- 85%+ workflow health score
- 3x efficiency gains (documented)
- 10x faster task completion (task #68)
- 92% estimation accuracy

**Your results may vary** - system adapts to your workflow.

---

## Comparison to Old System

### Old Template (62 commands)
- ❌ Overwhelming command count
- ❌ Poor discoverability
- ❌ Unclear organization
- ✅ Complete functionality

### New Template (12 commands)
- ✅ Clear organization
- ✅ Easy discoverability
- ✅ Reduced cognitive load
- ✅ Same functionality
- ✅ + Production examples

**Result:** Same power, better UX

---

## Troubleshooting

### Commands not found
```bash
# Check installation
ls .claude/commands/core/

# Verify claude-code config
cat ~/.claude/claude-code-config.json
```

### GitHub sync failing
```bash
# Test connection
gh auth status

# Verify config
cat .claude/config/github-project.json

# Check project number in URL:
# github.com/users/{owner}/projects/{NUMBER}
```

### Analytics not tracking
```bash
# Check directory
ls .claude/analytics/

# Check permissions
touch .claude/analytics/test.json
rm .claude/analytics/test.json
```

**See:** `CLEANUP_GUIDE.md` for more troubleshooting

---

## Support & Documentation

### In This Template
- `CLEANUP_GUIDE.md` - Customization instructions
- `commands/README.md` - Command reference
- `examples/README.md` - Example usage

### Command Help
```bash
# View any command docs
cat .claude/commands/core/work.md
cat .claude/commands/quality/test.md
```

---

## Philosophy

**Organized > Complex:**
- 12 commands in 4 clear categories
- Progressive disclosure (core → advanced)
- Composable operations

**Examples > Empty Templates:**
- Real production patterns included
- Learn from working code
- Adapt, don't copy-paste

**Smart Defaults > Configuration:**
- Works out-of-box
- Customize as you learn
- No premature optimization

**Iterate > Perfect:**
- Ship fast, improve continuously
- Analytics guide improvements
- Adapt to your workflow

---

## Credits

**Source Project:** proffbemanning-dashboard
**Sessions:** 17 production sessions
**Performance:** 3x efficiency gains, 85%+ health score
**Extraction Date:** October 2025
**Organization:** From reality check analysis

**Prompt Patterns Used:**
- Perspective Collision Engine (validation)
- Multi-Agent Orchestrator (not in template)
- Edge Case Generator (command testing)

**See:** `library/prompts/patterns/` for pattern documentation

---

## Getting Started

1. **Copy template** to your project (`.claude/` directory)
2. **Configure** project.json and github-project.json
3. **Review** CLEANUP_GUIDE.md
4. **Start working:** `/work`

**Ready in 5 minutes. Working efficiently forever.**

---

**Version:** 2.0 (Organized)
**Status:** Production-ready
**Last Updated:** 2025-10-13
**Commands:** 12 organized (down from 62)
**Philosophy:** Simple, discoverable, battle-tested
