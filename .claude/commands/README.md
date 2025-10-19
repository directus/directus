# Command Reference

**12 organized commands for complete workflow coverage**

---

## 🎯 Core Commands (Daily Workflow)

Essential commands you'll use every day:

| Command | Purpose | Replaces |
|---------|---------|----------|
| `/work` | Start working (session + task + branch) | session-start, pick-task, sprint |
| `/done` | Finish task (commit + PR + analytics) | task-submit, task-complete, session-end |
| `/status` | Project dashboard (tasks, metrics, health) | daily-standup, analytics, workflow-validate |
| `/sync` | GitHub Project sync (two-way) | project-pull, project-sync |
| `/check` | Fast validation (type + test + lint) | ci-fast, workflow-validate |

---

## 🔧 Quality Commands

Maintain code quality:

| Command | Purpose |
|---------|---------|
| `/test` | Run test suite with coverage |
| `/fix` | Auto-fix common issues (format, lint, imports) |

---

## 🚀 Advanced Commands

Power user features:

| Command | Purpose |
|---------|---------|
| `/analytics` | Deep analytics dive (performance, patterns) |
| `/debug` | Diagnose recent errors |
| `/rollback` | Undo last operation safely |

---

## 🛠️ Utility Commands

Experimental and safety features:

| Command | Purpose |
|---------|---------|
| `/experiment` | Try risky changes safely (isolated branch) |
| `/archive` | Save current state snapshot |

---

## Quick Start

**Typical workflow:**

```bash
# Morning: Start work
/work              # Picks next task, creates branch

# During: Check status
/status            # See progress, metrics

# Before commit: Validate
/check             # Fast validation

# Finished: Submit work
/done              # Commit, PR, analytics

# Evening: Sync team progress
/sync              # Update from GitHub Project
```

---

## Command Details

See individual command files for:
- Detailed usage
- Example output
- Error handling
- Integration notes

**Core:** `core/work.md`, `core/done.md`, etc.
**Quality:** `quality/test.md`, `quality/fix.md`
**Advanced:** `advanced/analytics.md`, etc.
**Utils:** `utils/experiment.md`, `utils/archive.md`

---

## Migration from Old Commands

If you're familiar with the old 62-command system:

| Old Commands | New Command |
|--------------|-------------|
| `/session-start` + `/pick-task` | `/work` |
| `/task-submit` + `/task-complete` | `/done` |
| `/daily-standup` + `/workflow-validate` | `/status` |
| `/project-pull` + `/project-sync` | `/sync` |
| `/ci-fast` | `/check` |
| `/analytics` (various) | `/analytics` |
| Multiple test commands | `/test` |

**Benefit:** Less cognitive load, faster workflow, same functionality

---

## Philosophy

**Organization > Quantity:**
- 12 commands organized into clear categories
- Each command does ONE thing well (but may combine sub-operations)
- Progressive disclosure (core → quality → advanced → utils)

**Discoverability:**
- Clear naming (verb-based: work, done, check)
- Logical grouping (by use case, not implementation)
- Built-in help (each command documents itself)

**Composability:**
- Commands integrate automatically
- `/done` runs `/check` first
- `/work` runs `/sync` first
- Smart defaults everywhere

---

## Getting Help

```bash
# Command-specific help
cat .claude/commands/core/work.md

# Quick reference
cat .claude/commands/README.md

# Full workflow guide
cat .claude/docs/QUICK_START.md
```

---

**Last Updated:** 2025-10-13
**Version:** 2.0 (Organized)
**Commands:** 12 (down from 62)
