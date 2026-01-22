# Face-to-Face IT Directus Fork Maintenance

This document describes the maintenance procedures for the Face-to-Face IT fork of Directus.

## Overview

This fork maintains custom features on top of upstream Directus. Features are kept on separate branches and merged together for releases, allowing us to:

- Track upstream updates easily
- Keep features isolated for potential upstreaming
- Create stable releases with selected features

## Architecture

### Branching Strategy

```
upstream/main (directus/directus)
    │
    ▼ [weekly sync workflow]
origin/main (integration branch)
    │
    ├── feature/* branches (rebased onto main)
    │
    ▼ [release workflow merges features]
origin/release/v11.14.x-f2f.N (tagged releases)
```

### Key Branches

| Branch | Purpose |
|--------|---------|
| `main` | Integration branch, synced with upstream |
| `feature/*` | Individual feature branches, rebased onto main |
| `release/*` | Tagged release snapshots with all features merged |
| `sync/upstream-*` | Temporary branches for upstream sync PRs |

## Fork Manifest

The `.fork-manifest.json` file tracks:

- **upstream_base**: Current upstream version we're based on
- **upstream_repo**: The upstream repository (directus/directus)
- **last_sync**: When we last synced from upstream
- **features**: Array of feature branches with descriptions and status
- **releases**: History of F2F releases

Example:
```json
{
  "upstream_base": "v11.14.0",
  "upstream_repo": "directus/directus",
  "last_sync": "2026-01-22T00:00:00Z",
  "features": [
    {
      "id": "form-context",
      "branch": "feature/form-context",
      "description": "$FORM context for nested relationships",
      "status": "maintained"
    }
  ],
  "releases": [
    {
      "tag": "v11.14.0-f2f.1",
      "date": "2026-01-22T00:00:00Z",
      "features": ["feature/form-context", "feature/draft-items"]
    }
  ]
}
```

## Automated Workflows

### 1. Upstream Sync (`upstream-sync.yml`)

**Schedule**: Weekly on Monday at 6am UTC (or manual trigger)

**Process**:
1. Fetches latest upstream release tag
2. Creates `sync/upstream-vX.Y.Z` branch
3. Attempts merge from upstream
4. Creates PR with appropriate labels

**If conflicts occur**:
- PR is labeled `needs-resolution`
- Maintainer must resolve conflicts manually
- After resolution, remove the label and merge

### 2. Feature Rebase (`rebase-features.yml`)

**Trigger**: After push to `main` (or manual)

**Process**:
1. Reads feature list from manifest
2. Rebases each feature branch onto updated main
3. Force-pushes rebased branches
4. Creates issues for any rebase failures

**If rebase fails**:
- GitHub issue is created with conflict details
- Maintainer resolves manually
- Close issue after resolution

### 3. Build Release (`build-release.yml`)

**Trigger**: Manual dispatch

**Inputs**:
- `release_suffix`: Version suffix (e.g., "1" for v11.14.0-f2f.1)
- `features`: Comma-separated feature IDs or "all"
- `skip_tests`: Skip test suite (not recommended)

**Process**:
1. Creates release branch from main
2. Merges selected feature branches
3. Runs build and tests
4. Updates manifest with release info
5. Creates tag and GitHub Release

## Manual Procedures

### Adding a New Feature Branch

1. Create branch from main:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-feature
   ```

2. Develop the feature with clean commits

3. Add to manifest:
   ```bash
   # Edit .fork-manifest.json
   jq '.features += [{
     "id": "my-feature",
     "branch": "feature/my-feature",
     "description": "Description of my feature",
     "status": "maintained"
   }]' .fork-manifest.json > tmp && mv tmp .fork-manifest.json
   ```

4. Push branch and manifest update:
   ```bash
   git push origin feature/my-feature
   git add .fork-manifest.json
   git commit -m "chore: add my-feature to manifest"
   git push origin main
   ```

### Resolving Upstream Sync Conflicts

1. Checkout the sync branch:
   ```bash
   git fetch origin
   git checkout sync/upstream-vX.Y.Z
   ```

2. The conflicts are already marked. Resolve each file.

3. Test the build:
   ```bash
   pnpm install
   pnpm build
   pnpm test
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "chore: resolve upstream sync conflicts"
   git push origin sync/upstream-vX.Y.Z
   ```

5. Remove `needs-resolution` label from PR

### Resolving Feature Rebase Conflicts

1. Checkout and rebase:
   ```bash
   git fetch origin
   git checkout feature/my-feature
   git rebase origin/main
   ```

2. Resolve conflicts, continue rebase:
   ```bash
   # For each conflict
   git add <resolved-files>
   git rebase --continue
   ```

3. Force push:
   ```bash
   git push origin feature/my-feature --force-with-lease
   ```

4. Close the GitHub issue

### Creating a Hotfix Release

For urgent fixes that can't wait for regular release:

1. Start from the latest release tag:
   ```bash
   git checkout v11.14.0-f2f.1
   git checkout -b hotfix/critical-fix
   ```

2. Apply fix and test

3. Create release manually or use workflow with just the hotfix branch

### Deprecating a Feature

1. Update manifest status:
   ```json
   {
     "id": "old-feature",
     "branch": "feature/old-feature",
     "status": "deprecated"
   }
   ```

2. Deprecated features are excluded from "all" in release workflow

3. Branch can be deleted after removing from manifest

## Extension Compatibility

The `directus-extensions` repository tracks which extensions depend on fork features.

See `directus-core-dependencies.json` in that repo for:
- Which extensions require which fork features
- Minimum compatible fork version

When deprecating features, check extension dependencies first.

## Troubleshooting

### Workflow Failures

1. Check Actions tab for error logs
2. Common issues:
   - **Merge conflicts**: Resolve manually as described above
   - **Test failures**: May indicate breaking changes in upstream
   - **Build failures**: Check for dependency issues

### Manifest Corruption

The manifest is just JSON. If corrupted:

1. Check git history: `git log -p -- .fork-manifest.json`
2. Restore from last good state
3. Verify with: `jq . .fork-manifest.json`

### Feature Branch Diverged

If a feature branch significantly diverged from main:

1. Consider squashing to a single commit
2. Rebase onto main
3. Verify functionality
4. Force push with `--force-with-lease`

## Best Practices

1. **Keep features focused**: Each feature branch should do one thing
2. **Write clear commit messages**: Helps when cherry-picking or upstreaming
3. **Test after rebases**: Rebases can introduce subtle issues
4. **Update manifest promptly**: Keep it accurate
5. **Document breaking changes**: Note in release descriptions
6. **Check extension deps**: Before deprecating features

## Related Documentation

- [Directus Docs](https://docs.directus.io/)
- [Extension Development](https://docs.directus.io/extensions/)
- [Contributing to Directus](https://github.com/directus/directus/blob/main/contributing.md)
