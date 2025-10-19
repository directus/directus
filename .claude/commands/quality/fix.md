---
description: Auto-fix common issues (format, lint, imports)
argument-hint: [optional: "safe" or "aggressive"]
model: claude-sonnet-4-5-20250929
allowed-tools: Bash, Edit
---

# /fix - Auto-Fix Issues

Automatically fix common code quality issues.

## What It Fixes

**Safe mode (default):**
- Formatting (prettier)
- Import sorting
- Unused imports
- Basic lint issues
- Trailing whitespace

**Aggressive mode:**
- All safe fixes +
- Type inference additions
- Missing null checks
- Deprecated API migrations
- Code complexity refactoring

## Usage

```bash
# Safe fixes only
/fix
/fix safe

# Aggressive fixes
/fix aggressive
```

## Output Example

```
🔧 Auto-fixing issues...

1. Formatting (prettier)
   ✓ Fixed 12 files
   - Indentation normalized
   - Line length adjusted
   - Quotes standardized

2. Import Organization
   ✓ Sorted imports in 8 files
   ✓ Removed 15 unused imports

3. Lint Auto-Fix
   ✓ Fixed 23 issues:
   - Removed console.log statements (7)
   - Added missing semicolons (8)
   - Fixed naming conventions (8)

4. Type Safety
   ⚠️  Skipped (use /fix aggressive)

---
✅ Fixed 50 issues in 20 files

Run /check to verify
```

## Aggressive Mode

```
🔧 Auto-fixing issues (aggressive mode)...

[Same as safe mode, plus:]

4. Type Safety
   ✓ Added explicit types to 12 functions
   ✓ Added null checks to 5 variables
   ⚠️  Review recommended for:
   - src/utils/api.ts:45 (type widening)

5. Code Quality
   ✓ Simplified 3 complex functions
   ✓ Extracted 2 reusable utilities

---
✅ Fixed 78 issues in 20 files
⚠️  2 changes need review (marked with TODO)

Run /check to verify
```

## Safety

- Creates git commit before fixes
- Safe to run anytime
- Aggressive mode adds TODOs for review
- All changes are undoable (`git revert`)

## See Also

- `/check` - Validate after fixes
- `/test` - Verify tests still pass
