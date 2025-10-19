---
description: Debug recent errors and workflow issues
argument-hint: [optional: error-id or "recent"]
model: claude-sonnet-4-5-20250929
allowed-tools: Read, Bash
---

# /debug - Error Diagnosis

Diagnose and troubleshoot recent errors.

## Usage

```bash
# Show recent errors
/debug
/debug recent

# Debug specific error
/debug ERROR_2025_10_13_001
```

## Output Example

```
🔍 ERROR DIAGNOSIS

Recent errors (last 24h): 3

---
ERROR #1 (2 hours ago)
Type: Type Error
Command: /check
File: src/components/DarkMode.tsx:15

Error:
  Type 'string' is not assignable to type 'ThemeMode'

Context:
  const [theme, setTheme] = useState('light')

Cause: Missing type annotation
Fix: Add explicit type:
  const [theme, setTheme] = useState<ThemeMode>('light')

Status: ⚠️  Still present

---
ERROR #2 (5 hours ago)
Type: Test Failure
Command: /test
File: DarkMode.test.tsx

Error:
  Expected 'dark' but received 'light'

Cause: Test assertion incorrect
Fix: Updated test expectation

Status: ✅ Fixed (commit abc123)

---
ERROR #3 (1 day ago)
Type: GitHub API
Command: /sync

Error:
  Rate limit exceeded (5000 requests)

Cause: Excessive API calls
Fix: Added caching, reduced polling

Status: ✅ Fixed (monitoring)

---
📊 Error Patterns

Most common: Type errors (40%)
Trend: Decreasing ↓
Avg time to fix: 18 minutes

Recommendations:
→ Add pre-commit type checking
→ Enable strict mode in tsconfig
```

## See Also

- `/fix` - Auto-fix common issues
- `/check` - Validate fixes
