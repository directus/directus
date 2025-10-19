# Template Cleanup Guide

**After copying this template to your project, customize it for your needs.**

## Quick Start (5 minutes)

### 1. Required Configuration

**Edit these files NOW:**

```bash
# Project configuration
vi .claude/config/project.json

# Required fields:
{
  "name": "Your Project Name",
  "slug": "your-project-slug",
  "type": "web|mobile|api|library",
  "tech_stack": ["Next.js", "TypeScript", "etc"]
}
```

```bash
# GitHub integration (if using)
vi .claude/config/github-project.json

# Required fields:
{
  "owner": "your-github-username",
  "repo": "your-repo-name",
  "projectNumber": 7,  # From GitHub Project URL
  "token": "ghp_..."   # GitHub PAT with project permissions
}
```

### 2. Review Examples

```bash
# Look at what's included
ls examples/

# Decision time:
- Building dashboard? Keep dashboard/ patterns
- Different project? Delete examples/ entirely
```

### 3. Test Commands

```bash
# Verify setup works
/work          # Should pick a task or prompt to create one
/status        # Should show project state
```

**Done! You're ready to work.**

---

## Detailed Customization

### Examples Directory

**Location:** `examples/`

**What's there:**
- Dashboard UI patterns (from proffbemanning-dashboard)
- Design systems (dark mode, asymmetric layouts)
- Component patterns (data tables, cards, etc.)

**Cleanup options:**

#### Option A: Keep as Reference
Good if building similar dashboard/UI project:
- Leave `examples/` intact
- Reference when building features
- Adapt patterns to your needs

#### Option B: Adapt and Integrate
Good if patterns are directly useful:
- Copy patterns into your `src/`
- Rename components
- Customize styles/logic
- Delete `examples/` when done adapting

#### Option C: Delete Entirely
Good if building something different:
```bash
rm -rf examples/
```

### Analytics Configuration

**Location:** `.claude/analytics/`

**What's there:**
- Empty JSON files (structure only)
- Analytics scripts

**Action:** No cleanup needed
- Will populate as you work
- Tracks sessions, tasks, quality metrics

### Command Customization

**Location:** `.claude/commands/`

**What's there:**
- 12 organized commands (core, quality, advanced, utils)

**Customization:**
- Commands work as-is for most projects
- Advanced users: add project-specific commands
- Place in `.claude/commands/custom/`

### Scripts

**Location:** `.claude/scripts/`

**What's there:**
- Analytics scripts (session, task timing)
- GitHub integration scripts
- Validation scripts

**Action:** No cleanup needed
- Scripts are generic
- Work with any project type

---

## Project-Specific Patterns

### For Web Projects

**Keep:**
- Design system examples (if helpful)
- Dashboard patterns (if building admin UI)
- Component patterns

**Add:**
- Your specific component library
- Your design tokens
- Your routing patterns

### For API Projects

**Delete:**
- `examples/` entirely (UI patterns not relevant)

**Add:**
- API route patterns
- Database schema patterns
- Authentication patterns

### For Mobile Projects

**Delete:**
- Most of `examples/` (web-specific)

**Maybe keep:**
- Design system concepts
- Data fetching patterns

**Add:**
- Navigation patterns (React Navigation, etc.)
- Platform-specific patterns
- State management patterns

### For Library Projects

**Delete:**
- `examples/` entirely
- GitHub Project integration (optional)

**Keep:**
- Testing commands
- Analytics (track usage patterns)

---

## GitHub Project Integration

**Optional but recommended**

### Setup

1. Create GitHub Project board
2. Add issues with labels
3. Configure `.claude/config/github-project.json`
4. Run `/sync` to test

### Without GitHub

If not using GitHub Project:
- Commands still work
- Uses KANBAN.md file instead
- Manual task management
- No auto-sync

---

## Common Customizations

### Change Command Behavior

**Example:** Make `/work` always run tests before starting

Edit `.claude/commands/core/work.md`:
```markdown
## Steps:
1. Run `/check` first
2. Session Start
3. Task Selection
...
```

### Add Custom Commands

Create `.claude/commands/custom/deploy.md`:
```markdown
---
description: Deploy to production
model: claude-sonnet-4-5-20250929
allowed-tools: Bash
---

# Your custom deploy logic here
```

Use with: `/deploy`

### Customize Analytics

**Location:** `.claude/scripts/analytics/`

- Add custom metrics
- Change tracking behavior
- Export to external tools

---

## Testing Your Setup

```bash
# 1. Configuration valid?
cat .claude/config/project.json
cat .claude/config/github-project.json

# 2. Commands available?
ls .claude/commands/*/

# 3. GitHub integration working?
/sync

# 4. Can start working?
/work

# 5. Full workflow test
/work      # Pick task
# ... make changes ...
/check     # Validate
/done      # Submit PR
```

---

## Troubleshooting

### Command not found
```bash
# Check command exists
ls .claude/commands/core/work.md

# Check claude-code can find it
# Commands must be in .claude/commands/
```

### GitHub sync failing
```bash
# Test token
gh auth status

# Check config
cat .claude/config/github-project.json

# Verify project number
# From URL: github.com/users/{owner}/projects/{NUMBER}
```

### Analytics not logging
```bash
# Check analytics directory exists
ls .claude/analytics/

# Check write permissions
touch .claude/analytics/test.json && rm .claude/analytics/test.json

# Check scripts exist
ls .claude/scripts/analytics/
```

---

## Gradual Cleanup Approach

**Week 1:** Use as-is, learn the system
**Week 2:** Decide on examples (keep/adapt/delete)
**Week 3:** Add custom patterns
**Week 4:** Optimize for your workflow

**Don't over-customize upfront.** Learn first, then adapt.

---

## Questions?

**Template source:** Extracted from proffbemanning-dashboard (17 production sessions)
**Philosophy:** Examples > Empty templates
**Approach:** Adapt, don't adopt

**Remember:** This template is a starting point, not a straitjacket. Make it yours.

---

**Checklist:**

- [ ] Edited `config/project.json`
- [ ] Edited `config/github-project.json` (if using)
- [ ] Reviewed `examples/` directory
- [ ] Decided: keep, adapt, or delete examples
- [ ] Tested `/work` command
- [ ] Tested `/status` command
- [ ] Tested `/sync` (if using GitHub)
- [ ] Read command docs (`commands/README.md`)

**Ready?** Run `/work` to start your first task!
