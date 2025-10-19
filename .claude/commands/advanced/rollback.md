---
description: Undo last operation (commit, PR, status change)
argument-hint: [optional: operation-id or "last"]
model: claude-sonnet-4-5-20250929
allowed-tools: Bash, mcp__github__*
---

# /rollback - Undo Operation

Safely undo recent operations.

## What Can Be Rolled Back

- Git commits
- Pull requests (close + delete branch)
- GitHub Project status changes
- Session state changes

## Usage

```bash
# Rollback last operation
/rollback
/rollback last

# Rollback specific operation
/rollback COMMIT_abc123
/rollback PR_156
```

## Output Example

```
🔄 ROLLBACK OPERATION

Last operation: /done (10 minutes ago)
  - Created commit abc123
  - Created PR #156
  - Updated status #142 → Review

Rollback will:
  1. Close PR #156
  2. Delete branch feature/issue-142
  3. Revert commit abc123
  4. Restore status #142 → In Progress

⚠️  Are you sure? [y/N]: y

Rolling back...
✓ Closed PR #156
✓ Deleted branch
✓ Reverted commit abc123
✓ Restored status

✅ Rollback complete

Current state:
- Task #142: In Progress
- Branch: master
- Working tree: clean

Resume with: /work 142
```

## Safety

- Creates backup before rollback
- Preserves work in git reflog
- Can rollback the rollback
- Confirms destructive operations

## See Also

- `/work` - Resume after rollback
- `/status` - Check current state
