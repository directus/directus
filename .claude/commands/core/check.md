---
description: Fast validation - type-check + tests + lint
argument-hint: [optional: "quick" or "full"]
model: claude-sonnet-4-5-20250929
allowed-tools: Bash
---

# /check - Fast Validation

**Combines:** ci-fast + workflow-validate

One command to validate your changes before committing.

## What It Does

1. **Type Check**
   - Runs TypeScript compiler
   - Shows only errors (not warnings)
   - Fast mode: checks only changed files

2. **Tests**
   - Runs test suite
   - Quick mode: only affected tests
   - Full mode: entire suite

3. **Lint**
   - ESLint for code quality
   - Prettier for formatting
   - Auto-fix safe issues

4. **Build Check** (optional)
   - Dry-run build
   - Catches build-time errors
   - Skipped in quick mode

## Usage

```bash
# Quick check (changed files only, ~30s)
/check
/check quick

# Full check (entire codebase, ~2min)
/check full
```

## Output Example (Quick Mode)

```
🔍 Running quick validation...

1. Type Check (changed files)
   ✓ src/components/DarkModeToggle.tsx
   ✓ src/hooks/useDarkMode.ts
   ✅ No type errors

2. Tests (affected tests)
   ✓ DarkModeToggle.test.tsx (3 tests)
   ✓ useDarkMode.test.ts (5 tests)
   ✅ 8 tests passed

3. Lint (auto-fix enabled)
   ⚠️  2 issues auto-fixed:
   - Removed unused import
   - Fixed indentation
   ✅ No remaining issues

---
✅ All checks passed (32s)

Ready to commit!
Use: /done to create PR
```

## Output Example (Failures)

```
🔍 Running quick validation...

1. Type Check
   ❌ 2 errors found:

   src/components/DarkModeToggle.tsx:15:10
   Type 'string' is not assignable to type 'ThemeMode'

   src/hooks/useDarkMode.ts:8:22
   Property 'theme' does not exist on type 'Window'

2. Tests
   ⏭️  Skipped (fix type errors first)

3. Lint
   ⏭️  Skipped (fix type errors first)

---
❌ Validation failed (12s)

Fix errors and run /check again
Or use /fix to auto-fix common issues
```

## Quick vs Full Mode

**Quick (default):**
- Changed files only
- Affected tests only
- ~30 seconds
- Good for rapid iteration

**Full:**
- Entire codebase
- Full test suite
- ~2 minutes
- Good before PR submission

## Auto-Fix Mode

```bash
# Check with auto-fix
/check quick

# Automatically fixes:
- Formatting (prettier)
- Import sorting
- Unused imports
- Basic lint issues
```

## Integration with /done

```bash
# /done automatically runs /check first
/done

→ Running /check quick...
✅ All checks passed
→ Creating PR...
```

To skip checks (not recommended):
```bash
/done --skip-checks
```

## Error Handling

- **No package.json:** Skips npm commands
- **No tests:** Shows warning, continues
- **Build errors:** Shows first 10 errors
- **Timeout:** Shows partial results

## Performance

**Quick mode:**
- Type check: ~10s
- Tests: ~15s
- Lint: ~5s
- Total: ~30s

**Full mode:**
- Type check: ~30s
- Tests: ~60s
- Lint: ~15s
- Build: ~20s
- Total: ~2min

## See Also

- `/fix` - Auto-fix common issues
- `/test` - Run full test suite
- `/done` - Auto-runs /check before PR
