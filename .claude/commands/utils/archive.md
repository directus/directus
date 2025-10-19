---
description: Archive current state (snapshot for safety)
argument-hint: [optional: archive-name]
model: claude-sonnet-4-5-20250929
allowed-tools: Bash
---

# /archive - Save Current State

Create snapshot of current project state.

## Usage

```bash
# Quick archive
/archive

# Named archive
/archive before-refactor

# List archives
/archive list

# Restore archive
/archive restore before-refactor
```

## Creating Archive

```
📦 Creating archive...

Archive: before-refactor
Date: 2025-10-13 14:32
Branch: feature/issue-142
Commit: abc123
Files: 5 modified, 234 lines

Saved to: .claude/archives/before-refactor/

Contents:
✓ Current working tree
✓ Git state
✓ CLAUDE.md snapshot
✓ Analytics state

✅ Archive created

Restore with: /archive restore before-refactor
```

## Listing Archives

```
📦 Available archives:

1. before-refactor (2 hours ago)
   Branch: feature/issue-142
   Files: 5 modified

2. pre-major-change (1 day ago)
   Branch: master
   Files: 12 modified

3. sprint-4-end (5 days ago)
   Branch: master
   Files: clean

Total: 3 archives (2.3 MB)
```

## Restoring Archive

```
📦 Restoring archive: before-refactor

Current changes will be saved first
Creating safety backup...
✓ Safety backup created

Restoring:
✓ Working tree restored
✓ Git state restored
✓ CLAUDE.md restored

✅ Archive restored

Current state matches: before-refactor (2 hours ago)
```

## See Also

- `/rollback` - Undo recent operation
- `/experiment` - Safe experimentation
