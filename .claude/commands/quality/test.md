---
description: Run test suite with detailed output
argument-hint: [optional: pattern or "watch"]
model: claude-sonnet-4-5-20250929
allowed-tools: Bash
---

# /test - Run Tests

Run test suite with detailed output and coverage.

## Usage

```bash
# Run all tests
/test

# Run specific test file/pattern
/test DarkMode

# Watch mode (re-run on changes)
/test watch

# With coverage
/test --coverage
```

## Output Example

```
🧪 Running test suite...

  DarkModeToggle
    ✓ renders with light mode by default
    ✓ toggles to dark mode on click
    ✓ respects system preference
    ✓ persists selection to localStorage

  useDarkMode hook
    ✓ initializes with system preference
    ✓ updates on manual toggle
    ✓ syncs across tabs
    ✓ handles missing localStorage

  8 tests passed (245ms)

---
📊 Coverage Summary

Statements: 94.2% (312/331)
Branches:   89.1% (45/50)
Functions:  96.3% (26/27)
Lines:      95.1% (284/299)

✅ All tests passed

Low coverage files:
- src/utils/theme.ts (78%)
```

## Watch Mode

```bash
/test watch

🔄 Test watch mode active

Watching for changes...
Press 'q' to quit
Press 'a' to run all tests
Press 'p' to filter by pattern

> Ready
```

## See Also

- `/check` - Quick validation
- `/fix` - Auto-fix test issues
