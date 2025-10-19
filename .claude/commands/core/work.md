---
description: Start working - session + task + branch in one command
argument-hint: [optional: task-id or "next"]
model: claude-sonnet-4-5-20250929
allowed-tools: Read, Edit, Bash, Grep, mcp__github__*
---

# /work - Start Working

**Combines:** session-start + pick-task + branch creation

One command to start your work session.

## What It Does

1. **Session Start**
   - Updates CLAUDE.md with session info
   - Auto-closes orphaned sessions
   - Logs session start to analytics
   - Quick health check

2. **Task Selection**
   - If task-id provided: use that task
   - If "next" or no arg: pick next from Todo
   - Check for recent errors (prevents working after failures)
   - Generate optimized prompt

3. **Branch Creation**
   - Creates feature branch: `feature/issue-{id}-{title}`
   - Checks out branch automatically
   - Updates git to latest

4. **Ready to Code**
   - Shows task details
   - Displays specialist performance
   - Prints optimized prompt location

## Usage

```bash
# Pick next task automatically
/work

# Work on specific task
/work 142

# Alternative: use "next" explicitly
/work next
```

## Output Example

```
✨ Session #15 started
🔥 Streak: 12 days

📊 Quick Health:
   ✓ Dependencies ok
   ✓ No recent errors
   ⚠️  3 uncommitted files

✅ NEXT TASK

id: 142
title: Add dark mode toggle
url: https://github.com/owner/repo/issues/142
branch: feature/issue-142-add-dark-mode-toggle ✓
status: In Progress ✓
specialist: @ui-master
complexity: moderate
estimated: 2.5h

---
👤 Specialist Performance

@ui-master: 0.92 avg (15 tasks)
✅ Excellent track record

---
📄 Optimized Prompt

Saved to: .claude/prompts/tasks/issue-142.yaml

---
🚀 Ready to Start

When done: /done
Check status: /status
```

## Error Handling

- **Recent errors detected:** Refuses to start, shows error log
- **No tasks available:** Suggests creating issue with `gh issue create`
- **Git conflicts:** Warns about uncommitted changes
- **GitHub offline:** Falls back to KANBAN.md

## See Also

- `/done` - Finish current task
- `/status` - Check current state
- `/sync` - Update from GitHub Project
