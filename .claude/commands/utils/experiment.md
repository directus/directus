---
description: Try risky changes safely (creates experiment branch)
argument-hint: [optional: experiment-name]
model: claude-sonnet-4-5-20250929
allowed-tools: Bash
---

# /experiment - Safe Experimentation

Create isolated experiment branch for risky changes.

## Usage

```bash
# Create experiment
/experiment

# Named experiment
/experiment refactor-api

# Finish experiment (keep or discard)
/experiment finish
/experiment finish --keep
/experiment finish --discard
```

## Creating Experiment

```
🧪 Starting experiment...

Current state saved
Branch: experiment/2025-10-13-refactor-api
Base: master (commit abc123)

🔓 Experiment mode active

Try anything! This branch is:
- Not tracked in GitHub Project
- Isolated from main workflow
- Easy to discard or merge
- Auto-archived after 7 days

When done:
- /experiment finish --keep   # Merge to master
- /experiment finish --discard # Delete experiment
```

## Finishing Experiment (Keep)

```
🧪 Finishing experiment...

Changes detected:
- 15 files modified
- 234 additions, 89 deletions

Review changes? [y/N]: y

[Shows git diff]

Keep these changes? [y/N]: y

Merging to master...
✓ Merged experiment/refactor-api
✓ Deleted experiment branch
✓ Back on master

✅ Experiment successful

Create issue for these changes? [y/N]: y
```

## Finishing Experiment (Discard)

```
🧪 Finishing experiment...

Discard all changes? [y/N]: y

✓ Deleted experiment branch
✓ Back on master
✓ Working tree clean

✅ Experiment discarded (safe in reflog)
```

## See Also

- `/rollback` - Undo if needed
- `/archive` - Save state before experimenting
