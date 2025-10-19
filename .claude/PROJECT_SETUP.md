# DirectApp - Workflow System Setup Complete

## Project Information

**Name:** DirectApp
**Type:** Directus Fork (Monorepo)
**GitHub:** gumpen-app/directapp
**Upstream:** directus/directus
**Setup Date:** 2025-10-18

---

## What's Installed

The .claude workflow system is now configured for your DirectApp project:

- ✅ **12 organized commands** (core, quality, advanced, utils)
- ✅ **Project configuration** (project.json)
- ✅ **GitHub integration setup** (partial - needs token)
- ✅ **Analytics infrastructure** (session, task, specialist tracking)
- ✅ **Documentation** (README, CLEANUP_GUIDE)

---

## Next Steps

### 1. GitHub Personal Access Token (Required for /sync)

To enable GitHub Project integration, you need to add a Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `project` (Full control of projects)
4. Generate and copy the token
5. Add it to `.claude/config/github-project.json`:
   ```json
   {
     "owner": "gumpen-app",
     "repo": "directapp",
     "projectNumber": 1,
     "token": "ghp_YOUR_TOKEN_HERE",  // ← Add your token here
     ...
   }
   ```

**Security Note:** Keep this token private! Add `.claude/config/github-project.json` to `.gitignore` if needed.

---

### 2. Test the Workflow (5 minutes)

Try these commands to verify everything works:

```bash
# Check project status
/status

# Start working on a task
/work

# Run quality checks
/check

# View analytics
/analytics
```

---

### 3. Customize for Your Workflow (Optional)

**Review these files:**
- `.claude/CLEANUP_GUIDE.md` - Customization instructions
- `.claude/README.md` - Full workflow documentation
- `.claude/commands/README.md` - Command reference

**Common customizations:**
- Remove example patterns you don't need
- Add custom commands in `.claude/commands/custom/`
- Configure CI integration
- Set up pre-commit hooks

---

## Available Commands

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

---

## Project Structure

Your DirectApp is a monorepo with these main components:

```
directapp/
├── api/              # Directus API
├── app/              # Directus App (Vue.js dashboard)
├── packages/         # Monorepo packages
├── sdk/              # Directus SDK
├── tests/            # Test suites
│
└── .claude/          # Workflow system
    ├── commands/     # 12 organized commands
    ├── config/       # Project & GitHub config
    ├── analytics/    # Session & task tracking
    ├── scripts/      # Automation scripts
    └── docs/         # Documentation
```

---

## Tech Stack

- **Runtime:** Node.js (pnpm monorepo)
- **Frontend:** Vue.js
- **Backend:** Node.js REST & GraphQL API
- **Databases:** PostgreSQL, MySQL, SQLite, and more
- **Build:** TypeScript, ESLint, Prettier
- **Testing:** pnpm test (per package)

---

## Typical Workflow

```bash
# Morning - Start work
/work              # Pick task from GitHub Project

# During development
/status            # Check progress
/check             # Validate before commit
pnpm test          # Run tests

# Finish task
/done              # Commit, create PR, update analytics

# End of day
/sync              # Sync with GitHub Project
```

---

## GitHub Project Integration

**Your Project:** https://github.com/orgs/gumpen-app/projects/1

Once you add the GitHub token, you'll be able to:
- Pull tasks from GitHub Project with `/work`
- Update task status automatically with `/done`
- Two-way sync with `/sync`
- Create PRs linked to issues

**Without token:** Commands will work in local-only mode using KANBAN.md

---

## Analytics & Tracking

The system automatically tracks:
- **Session history** - Work sessions, duration, productivity
- **Task timing** - Estimation vs actual time
- **Specialist performance** - Different modes (frontend, backend, etc.)

View analytics anytime with:
```bash
/analytics          # Full dashboard
/analytics sprint   # Sprint-specific metrics
/analytics tasks    # Task performance
```

---

## Troubleshooting

### Commands not working?
```bash
# Verify installation
ls .claude/commands/core/

# Check command files are markdown
cat .claude/commands/core/work.md
```

### GitHub sync failing?
```bash
# Test GitHub CLI
gh auth status

# Verify config
cat .claude/config/github-project.json
```

### Analytics not tracking?
```bash
# Check files exist
ls .claude/analytics/

# Verify JSON format
cat .claude/analytics/session-history.json
```

---

## Resources

- **Directus Docs:** https://docs.directus.io
- **GitHub Project:** https://github.com/orgs/gumpen-app/projects/1
- **Workflow Docs:** .claude/README.md
- **Cleanup Guide:** .claude/CLEANUP_GUIDE.md

---

## Quick Reference

```bash
# Start working
/work

# Check status
/status

# Run tests
pnpm test

# Validate code
/check

# Finish task
/done

# View metrics
/analytics
```

---

**Setup Status:** ✅ Complete (pending GitHub token)
**Ready to:** Start working with `/work`
**Next:** Add GitHub token to enable full integration

---

**Questions?** Check `.claude/README.md` or `.claude/CLEANUP_GUIDE.md`
