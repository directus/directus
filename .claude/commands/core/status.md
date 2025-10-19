---
description: Show project status - dashboard view
argument-hint: [optional: "detailed"]
model: claude-sonnet-4-5-20250929
allowed-tools: Read, Bash, Grep, mcp__github__*
---

# /status - Project Dashboard

**Combines:** daily-standup + analytics + workflow-validate

One command for complete project context.

## What It Shows

1. **Current State**
   - Active task (if any)
   - Current branch
   - Session info
   - Git status

2. **Sprint Progress**
   - Sprint completion %
   - Days remaining
   - Tasks: Done / In Progress / Todo
   - On track? Yes/No

3. **Quality Metrics**
   - Overall avg score
   - Quality streak
   - Top specialist
   - Recent errors (if any)

4. **Recent Activity**
   - Last 5 commits
   - Recent completions
   - GitHub sync status

## Usage

```bash
# Quick dashboard
/status

# Detailed view (includes full analytics)
/status detailed
```

## Output Example

```
📊 PROJECT STATUS

Active Task: #142 - Add dark mode toggle
Branch: feature/issue-142-add-dark-mode-toggle
Session: #15, 1.2h elapsed
Git: 3 modified, 0 staged, 0 untracked

---
🎯 Sprint Progress

Sprint 5: Networks & Company
Progress: 65% complete (13/20 tasks)
Days remaining: 4 days
Status: ✅ On track

Todo: 7 tasks
In Progress: 2 tasks (you + 1 other)
Done: 13 tasks

Next up:
- #145: Company switcher component
- #147: Network invite flow

---
📈 Quality Metrics

Overall: 0.89 (excellent)
Streak: 5 tasks ✅
Top: @ui-master (0.94 avg, 15 tasks)

Recent sessions:
- Today: 1.2h (current)
- Yesterday: 3.5h (2 tasks)
- 2 days ago: 2.1h (1 task)

⚠️  Warnings: None

---
🔄 Recent Activity

Commits (last 5):
- 2h ago: feat: add network card component (#140)
- 5h ago: fix: mobile layout responsive issues (#138)
- 1d ago: docs: update component patterns (#136)

Completed today:
- #140: Network card component (2.3h)

GitHub: ✓ Synced 5 minutes ago

---
Quick actions:
- /work       # Continue #142 or pick next
- /sync       # Update from GitHub
- /check      # Run validation
```

## Detailed Mode

Adds:
- Full sprint task list
- Detailed analytics breakdown
- Error patterns (if any)
- Specialist performance table
- Command usage stats

```bash
/status detailed
```

## See Also

- `/work` - Start/continue work
- `/sync` - Sync with GitHub
- `/analytics` - Deep analytics dive (advanced)
