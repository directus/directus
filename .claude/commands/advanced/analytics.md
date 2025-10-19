---
description: Deep analytics dive - performance, patterns, insights
argument-hint: [optional: "sprint" or "specialist" or "tasks"]
model: claude-sonnet-4-5-20250929
allowed-tools: Read, Bash
---

# /analytics - Deep Analytics

Comprehensive analytics and insights.

## Views

```bash
# Overview dashboard
/analytics

# Sprint analytics
/analytics sprint

# Specialist performance
/analytics specialist

# Task timing analysis
/analytics tasks
```

## Overview Output

```
📊 ANALYTICS DASHBOARD

## Session Stats (Last 30 days)

Total sessions: 47
Total time: 142.5h
Avg session: 3.0h
Streak: 13 days 🔥

Session quality:
- Excellent (>4h): 12 sessions
- Good (2-4h): 28 sessions
- Short (<2h): 7 sessions

## Task Completion

Completed: 38 tasks
Avg time per task: 3.7h
Estimation accuracy: 92%

Under estimate: 18 tasks (47%)
On estimate: 15 tasks (39%)
Over estimate: 5 tasks (13%)

## Quality Metrics

Overall avg: 0.89 (excellent)
Trend: ↑ improving (+0.05 last week)

Top specialists:
1. @ui-master: 0.94 (15 tasks)
2. @forms-master: 0.91 (12 tasks)
3. @api-master: 0.87 (11 tasks)

## Patterns

Most productive time: 9-11am (0.95 avg)
Best day: Tuesday (4.2h avg)
Peak flow state: After /check passes

Recommendations:
→ Schedule complex tasks for mornings
→ More Tuesday deep work sessions
→ Pre-validate with /check before coding
```

## Sprint Analytics

```bash
/analytics sprint

📊 SPRINT ANALYTICS

Sprint 5: Networks & Company (Oct 1-15)

Completion: 65% (13/20 tasks)
Velocity: 1.3 tasks/day (target: 1.0)
Burndown: On track ✅

Task breakdown:
- Small (<2h): 8 tasks (100% done)
- Medium (2-4h): 7 tasks (71% done)
- Large (>4h): 5 tasks (40% done)

Blockers removed: 3
Scope changes: 1 (approved)

Time distribution:
- Implementation: 68%
- Review/fixes: 22%
- Planning: 10%

Carry-over risk: Low
Sprint goal: Achievable
```

## See Also

- `/status` - Quick dashboard
- `/specialist-performance` - Specialist details
