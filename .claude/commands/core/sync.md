---
description: Sync with GitHub Project - two-way sync
argument-hint: [optional: "pull" or "push" or "both"]
model: claude-sonnet-4-5-20250929
allowed-tools: Read, Edit, Bash, mcp__github__*
---

# /sync - GitHub Project Sync

**Combines:** project-pull + project-sync

One command for two-way GitHub synchronization.

## What It Does

1. **Pull from GitHub** (default)
   - Fetches latest project board state
   - Updates KANBAN.md
   - Syncs task statuses
   - Downloads new issues

2. **Push to GitHub** (optional)
   - Uploads local KANBAN.md changes
   - Updates issue statuses
   - Syncs task assignments
   - Creates missing issues

3. **Both** (optional)
   - Pull first (get latest)
   - Then push (send updates)
   - Conflict resolution if needed

## Usage

```bash
# Pull from GitHub (default)
/sync
/sync pull

# Push local changes to GitHub
/sync push

# Two-way sync
/sync both
```

## Output Example

```
🔄 Syncing with GitHub Project #7

Fetching project state...
✓ Retrieved 47 items from board

📥 Pull Changes:

Updated:
- #145: Company switcher → In Progress (assigned to @teammate)
- #147: Network invite flow → Todo
- #148: Mobile layout fixes → Done ✅

New issues:
- #149: Add user preferences
- #150: Implement notifications

Removed:
- #139: (closed and archived)

---
📝 Updating KANBAN.md...

✓ Todo: 7 tasks (+2)
✓ In Progress: 2 tasks
✓ Done: 13 tasks (+1)

---
✅ Sync complete

Last synced: just now
Next sync: automatic on /work or /status
```

## Push Mode (sync push)

```
🔄 Pushing local changes to GitHub

📤 Local changes detected:

KANBAN.md updates:
- #142: Move to "Review" status
- #140: Move to "Done" status

Pushing to GitHub Project...
✓ #142 status updated
✓ #140 status updated and closed

✅ Push complete
```

## Two-Way Sync (sync both)

Combines pull + push with conflict resolution:

```
🔄 Two-way sync starting...

Step 1: Pull from GitHub
✓ 3 updates retrieved

Step 2: Conflict check
⚠️  Conflict detected: #142
   Local: "Review"
   Remote: "In Progress"

Resolution: Using remote (GitHub wins on conflicts)

Step 3: Push local changes
✓ 2 updates pushed

✅ Sync complete (3 pulled, 2 pushed, 1 conflict)
```

## Auto-Sync

Automatic sync happens:
- On `/work` (ensures latest tasks)
- On `/status` (shows current state)
- Every 15 minutes (if session active)

Manual sync: Use `/sync` anytime

## Error Handling

- **GitHub offline:** Shows last synced state, queues changes
- **Auth failed:** Prompts to check `.claude/config/github-project.json`
- **Rate limited:** Backs off, retries automatically
- **Conflicts:** GitHub wins by default (can override with flags)

## See Also

- `/work` - Auto-syncs before picking task
- `/status` - Shows last sync time
- `/done` - Auto-syncs after PR creation
