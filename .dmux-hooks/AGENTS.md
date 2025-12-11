# dmux Hooks System - Agent Reference

**Auto-generated documentation for AI agents**

This document contains everything an AI agent needs to create, modify, and understand dmux hooks. It is automatically generated from the dmux source code and embedded in the binary.

## What You're Working On

You are editing hooks for **dmux**, a tmux pane manager that creates AI-powered development workflows. Each pane runs in its own git worktree with an AI agent (Claude Code or opencode).

## Your Goal

Create executable bash scripts in `.dmux-hooks/` that run automatically at key lifecycle events.

## Quick Start

1. **Create a hook file**: `touch .dmux-hooks/worktree_created`
2. **Make it executable**: `chmod +x .dmux-hooks/worktree_created`
3. **Add shebang**: Start with `#!/bin/bash`
4. **Use environment variables**: Access `$DMUX_ROOT`, `$DMUX_WORKTREE_PATH`, etc.
5. **Test it**: Set env vars manually and run the script

## Hook Execution Model

- **Non-blocking**: Hooks run in background (detached processes)
- **Silent failures**: Hook errors are logged but don't stop dmux
- **Environment-based**: All context passed via environment variables
- **Version controlled**: Hooks in `.dmux-hooks/` are shared with team
- **Priority resolution**: `.dmux-hooks/` → `.dmux/hooks/` → `~/.dmux/hooks/`

## Available Hooks

### Pane Lifecycle Hooks

| Hook | When | Common Use Cases |
|------|------|------------------|
| `before_pane_create` | Before pane creation | Validation, notifications, pre-flight checks |
| `pane_created` | After pane, before worktree | Configure tmux settings, prepare environment |
| `worktree_created` | After full setup | Install deps, copy configs, setup git |
| `before_pane_close` | Before closing | Save state, backup uncommitted work |
| `pane_closed` | After closed | Cleanup resources, analytics, notifications |

### Worktree Lifecycle Hooks

| Hook | When | Common Use Cases |
|------|------|------------------|
| `before_worktree_remove` | Before worktree removal | Archive worktree, save artifacts |
| `worktree_removed` | After worktree removed | Cleanup external references |

### Merge Lifecycle Hooks

| Hook | When | Common Use Cases |
|------|------|------------------|
| `pre_merge` | Before merge operation | Run final tests, create backups |
| `post_merge` | After successful merge | Deploy, close issues, notify team |

### Interactive Hooks (with HTTP callbacks)

| Hook | When | Common Use Cases |
|------|------|------------------|
| `run_test` | When tests triggered | Run test suite, report status via HTTP |
| `run_dev` | When dev server triggered | Start dev server, create tunnel, report URL |


## Environment Variables

### Always Available
```bash
DMUX_ROOT="/path/to/project"           # Project root directory
DMUX_SERVER_PORT="3142"                # HTTP server port
```

### Pane Context (most hooks)
```bash
DMUX_PANE_ID="dmux-1234567890"         # dmux pane identifier
DMUX_SLUG="fix-auth-bug"               # Branch/worktree name
DMUX_PROMPT="Fix authentication bug"   # User's prompt
DMUX_AGENT="claude"                    # Agent type (claude|opencode)
DMUX_TMUX_PANE_ID="%38"                # tmux pane ID
```

### Worktree Context
```bash
DMUX_WORKTREE_PATH="/path/.dmux/worktrees/fix-auth-bug"
DMUX_BRANCH="fix-auth-bug"             # Same as slug
```

### Merge Context
```bash
DMUX_TARGET_BRANCH="main"              # Branch being merged into
```

## HTTP Callback API

Interactive hooks (`run_test` and `run_dev`) can update dmux UI via HTTP.

### Update Test Status
```bash
curl -X PUT "http://localhost:$DMUX_SERVER_PORT/api/panes/$DMUX_PANE_ID/test"   -H "Content-Type: application/json"   -d '{"status": "running", "output": "optional test output"}'

# Status values: "running" | "passed" | "failed"
```

### Update Dev Server
```bash
curl -X PUT "http://localhost:$DMUX_SERVER_PORT/api/panes/$DMUX_PANE_ID/dev"   -H "Content-Type: application/json"   -d '{"status": "running", "url": "http://localhost:3000"}'

# Status values: "running" | "stopped"
# url: Can be localhost or tunnel URL (ngrok, cloudflared, etc.)
```

## Common Patterns

### Pattern 1: Install Dependencies
```bash
#!/bin/bash
# .dmux-hooks/worktree_created

cd "$DMUX_WORKTREE_PATH"

if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --prefer-offline &
elif [ -f "package-lock.json" ]; then
  npm install &
elif [ -f "yarn.lock" ]; then
  yarn install &
elif [ -f "Gemfile" ]; then
  bundle install &
elif [ -f "requirements.txt" ]; then
  pip install -r requirements.txt &
elif [ -f "Cargo.toml" ]; then
  cargo build &
fi
```

### Pattern 2: Copy Configuration
```bash
#!/bin/bash
# .dmux-hooks/worktree_created

# Copy environment file
if [ -f "$DMUX_ROOT/.env.local" ]; then
  cp "$DMUX_ROOT/.env.local" "$DMUX_WORKTREE_PATH/.env.local"
fi

# Copy other config files
for file in .env.development .npmrc .yarnrc; do
  if [ -f "$DMUX_ROOT/$file" ]; then
    cp "$DMUX_ROOT/$file" "$DMUX_WORKTREE_PATH/$file"
  fi
done
```

### Pattern 3: Run Tests with Status Updates
```bash
#!/bin/bash
# .dmux-hooks/run_test

set -e
cd "$DMUX_WORKTREE_PATH"
API="http://localhost:$DMUX_SERVER_PORT/api/panes/$DMUX_PANE_ID/test"

# Update: starting
curl -s -X PUT "$API" -H "Content-Type: application/json"   -d '{"status": "running"}' > /dev/null

# Run tests and capture output
OUTPUT_FILE="/tmp/dmux-test-$DMUX_PANE_ID.txt"
if pnpm test > "$OUTPUT_FILE" 2>&1; then
  STATUS="passed"
else
  STATUS="failed"
fi

# Get output (truncate if too long)
OUTPUT=$(head -c 5000 "$OUTPUT_FILE")

# Update: complete
curl -s -X PUT "$API" -H "Content-Type: application/json"   -d "$(jq -n --arg status "$STATUS" --arg output "$OUTPUT"     '{status: $status, output: $output}')" > /dev/null

rm -f "$OUTPUT_FILE"
```

### Pattern 4: Dev Server with Tunnel
```bash
#!/bin/bash
# .dmux-hooks/run_dev

set -e
cd "$DMUX_WORKTREE_PATH"
API="http://localhost:$DMUX_SERVER_PORT/api/panes/$DMUX_PANE_ID/dev"

# Start dev server in background
LOG_FILE="/tmp/dmux-dev-$DMUX_PANE_ID.log"
pnpm dev > "$LOG_FILE" 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 5

# Detect port from logs
PORT=$(grep -oP 'localhost:Kd+' "$LOG_FILE" | head -1)
[ -z "$PORT" ] && PORT=3000

# Optional: Create tunnel with cloudflared
if command -v cloudflared &> /dev/null; then
  TUNNEL=$(cloudflared tunnel --url "http://localhost:$PORT" 2>&1 |     grep -oP 'https://[a-z0-9-]+.trycloudflare.com' | head -1)
  URL="${TUNNEL:-http://localhost:$PORT}"
else
  URL="http://localhost:$PORT"
fi

# Report status
curl -s -X PUT "$API" -H "Content-Type: application/json"   -d "{"status": "running", "url": "$URL"}" > /dev/null

echo "[Hook] Dev server running at $URL (PID: $DEV_PID)"
```

### Pattern 5: Post-Merge Deployment
```bash
#!/bin/bash
# .dmux-hooks/post_merge

set -e
cd "$DMUX_ROOT"

# Only deploy from main/master
if [ "$DMUX_TARGET_BRANCH" != "main" ] && [ "$DMUX_TARGET_BRANCH" != "master" ]; then
  exit 0
fi

# Push to remote
git push origin "$DMUX_TARGET_BRANCH"

# Trigger deployment (example: Vercel)
if [ -n "$VERCEL_TOKEN" ]; then
  curl -s -X POST "https://api.vercel.com/v1/deployments"     -H "Authorization: Bearer $VERCEL_TOKEN"     -H "Content-Type: application/json"     -d '{"name": "my-project"}' > /dev/null
fi

# Close GitHub issue if prompt contains #123
ISSUE=$(echo "$DMUX_PROMPT" | grep -oP '#Kd+' | head -1)
if [ -n "$ISSUE" ] && command -v gh &> /dev/null; then
  gh issue close "$ISSUE"     -c "Resolved in $DMUX_SLUG, merged to $DMUX_TARGET_BRANCH"     2>/dev/null || true
fi
```

## Best Practices

1. **Always start with shebang**: `#!/bin/bash`
2. **Set error handling**: `set -e` (exit on error)
3. **Make executable**: `chmod +x .dmux-hooks/hook_name`
4. **Background long operations**: Append `&` to avoid blocking
5. **Check for required tools**: `command -v tool &> /dev/null`
6. **Log for debugging**: `echo "[Hook] message" >> "$DMUX_ROOT/.dmux/hooks.log"`
7. **Handle missing vars gracefully**: `[ -z "$VAR" ] && exit 0`
8. **Use silent curl**: `curl -s` to avoid noise in logs
9. **Clean up temp files**: Remove files in `/tmp/`
10. **Test before committing**: Run hooks manually with mock env vars

## Testing Hooks

### Manual Testing
```bash
# 1. Set environment variables
export DMUX_ROOT="$(pwd)"
export DMUX_PANE_ID="test-pane"
export DMUX_SLUG="test-branch"
export DMUX_WORKTREE_PATH="$(pwd)"
export DMUX_SERVER_PORT="3142"
export DMUX_AGENT="claude"
export DMUX_PROMPT="Test prompt"

# 2. Run hook directly
./.dmux-hooks/worktree_created

# 3. Check exit code
echo $?  # Should be 0 for success
```

### Syntax Check
```bash
# Check for syntax errors without running
bash -n ./.dmux-hooks/worktree_created
```

### Shellcheck (if available)
```bash
shellcheck ./.dmux-hooks/worktree_created
```

## Project Context Analysis

Before creating hooks, analyze these files in the project:

### Package Manager Detection
```bash
# Check which package manager is used
if [ -f "pnpm-lock.yaml" ]; then
  # Use: pnpm install, pnpm test, pnpm dev
elif [ -f "package-lock.json" ]; then
  # Use: npm install, npm test, npm run dev
elif [ -f "yarn.lock" ]; then
  # Use: yarn install, yarn test, yarn dev
fi
```

### Test Command Discovery
```bash
# Read package.json to find test command
cat package.json | grep '"test"'
# Or with jq:
jq -r '.scripts.test' package.json
```

### Dev Command Discovery
```bash
# Read package.json to find dev command
cat package.json | grep '"dev"'
# Or with jq:
jq -r '.scripts.dev' package.json
```

### Environment Variables
```bash
# Check for .env files to copy
ls -la | grep '.env'
```

### Build System
```bash
# Detect build system
if [ -f "vite.config.ts" ]; then
  # Vite project
elif [ -f "next.config.js" ]; then
  # Next.js project
elif [ -f "nuxt.config.ts" ]; then
  # Nuxt project
fi
```

## Common Mistakes to Avoid

❌ **Blocking operations**: `sleep 60` (blocks dmux)
✅ **Background long tasks**: `slow_operation &`

❌ **Hardcoded paths**: `/Users/me/project`
✅ **Use variables**: `"$DMUX_ROOT"`

❌ **Assuming tools exist**: `pnpm install`
✅ **Check first**: `command -v pnpm && pnpm install`

❌ **No error handling**: Script fails silently
✅ **Set error mode**: `set -e` or check exit codes

❌ **Forgetting executable bit**: Hook won't run
✅ **Make executable**: `chmod +x`

❌ **Noisy output**: Clutters dmux logs
✅ **Silent operations**: `curl -s`, `> /dev/null 2>&1`

❌ **Not testing**: Deploy and hope
✅ **Test manually**: Run with mock env vars first

## Debugging

If a hook isn't working:

1. **Check if file exists**: `ls -la .dmux-hooks/`
2. **Check permissions**: Should show `x` in `rwxr-xr-x`
3. **Check syntax**: `bash -n .dmux-hooks/hook_name`
4. **Test manually**: Set env vars and run
5. **Check logs**: dmux logs to stderr with `[Hooks]` prefix
6. **Simplify**: Remove complex parts, test basic version
7. **Check tool availability**: `command -v required_tool`

### Debug Mode
```bash
#!/bin/bash
# Add to top of hook for debugging
set -x  # Print each command before executing
set -e  # Exit on error

# Your hook logic here
```

## Summary Checklist

When creating a new hook:

- [ ] Create file in `.dmux-hooks/`
- [ ] Add shebang: `#!/bin/bash`
- [ ] Make executable: `chmod +x`
- [ ] Add `set -e` for error handling
- [ ] Use environment variables (never hardcode paths)
- [ ] Background long operations with `&`
- [ ] Check for required tools before using
- [ ] Test manually with mock env vars
- [ ] Add comments explaining what it does
- [ ] Commit to version control

## Getting Help

- **Full documentation**: See `HOOKS.md` in project root
- **Claude-specific tips**: See `CLAUDE.md` in `.dmux-hooks/`
- **Examples**: Check `.dmux-hooks/examples/` directory
- **dmux API**: See `API.md` for REST endpoints

---

*This documentation was auto-generated from dmux source code.*
*Version: 2026-02-21*
