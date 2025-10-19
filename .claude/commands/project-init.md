---
description: Initialize new project with workflow system
argument-hint: <project-name> <type> [github-repo]
model: claude-sonnet-4-5-20250929
allowed-tools: Bash
---

# /project-init - Initialize New Project

Create a new project with the complete workflow system installed.

## Usage

```bash
# Run the init script
bash tools/headquarters/project-init/init-project.sh <name> <type> [github-repo]

# Examples:
bash tools/headquarters/project-init/init-project.sh my-app web
bash tools/headquarters/project-init/init-project.sh my-api api
bash tools/headquarters/project-init/init-project.sh my-app web owner/repo
```

## What It Does

1. **Creates project structure**
   - Based on project type (web/mobile/api/library)
   - Standard directories (src/, docs/, tests/)
   - Initializes git repo

2. **Installs workflow system**
   - Copies .claude-template-organized
   - 12 organized commands
   - Analytics infrastructure
   - Example patterns

3. **Configures project**
   - project.json with smart defaults
   - github-project.json template
   - PROJECT_SETUP.md checklist
   - .gitignore

4. **Ready to work**
   - All commands available
   - /work picks first task
   - Full GitHub integration (after config)

## Project Types

- **web:** Next.js, React, TypeScript (default)
- **mobile:** React Native, Expo
- **api:** Node.js, Express
- **library:** TypeScript, Rollup

## See Also

See full documentation in script file for complete usage.
