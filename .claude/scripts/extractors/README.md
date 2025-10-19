# Pattern Extractors

Pattern extractors query external sources to discover and extract development patterns.

## Context7 Extractor

**File**: `context7-extractor.ts`
**Status**: ✅ Complete (Phase 1 Day 1)
**GitHub Issue**: #35

### Purpose

Extracts patterns from official framework documentation using Context7 MCP server.

### Usage

```bash
# From project root
npx tsx .claude/scripts/extractors/context7-extractor.ts [tech-stack...]

# Example with custom tech stack
npx tsx .claude/scripts/extractors/context7-extractor.ts directus vue3 typescript

# Default (no args): directus, vue3, typescript
npx tsx .claude/scripts/extractors/context7-extractor.ts
```

### Output

Patterns are saved to: `.claude/memory/patterns/context7/`

Example pattern file: `directus-hooks-patterns.json`

```json
{
  "name": "directus-hooks-patterns",
  "source": "context7",
  "framework": "directus",
  "confidence": 0.95,
  "topic": "hooks patterns",
  "pattern": {
    "description": "hooks patterns for directus",
    "examples": [...],
    "bestPractices": [...],
    "commonPitfalls": [...],
    "applicableTo": ["directus"],
    "frameworks": ["directus"]
  }
}
```

### Supported Frameworks

- **directus**: hooks, endpoints, panels, flows, schemas, interfaces, displays, modules
- **vue3**: composition API, composables, reactivity, components, lifecycle
- **typescript**: types, interfaces, generics, type guards, utility types

### Configuration

Framework patterns are defined in `FRAMEWORK_PATTERNS` object within the extractor.

To add new framework patterns:

```typescript
const FRAMEWORK_PATTERNS: Record<string, string[]> = {
  'your-framework': [
    'pattern topic 1',
    'pattern topic 2'
  ]
};
```

### Confidence Score

All Context7 patterns have confidence: **0.95** (95%)

Rationale: Context7 provides official documentation, making it highly reliable.

### Integration with MCP

The extractor is designed to use the Context7 MCP server configured in `.mcp.json`.

Current implementation uses placeholder queries. To fully integrate with Context7 MCP:

1. The `queryContext7()` function should call the actual MCP server
2. Replace placeholder returns with real Context7 API responses
3. Parse Context7 responses into pattern structure

### Next Steps

- [ ] Enhance with actual Context7 MCP integration (currently uses placeholders)
- [ ] Add pattern validation
- [ ] Implement caching to avoid redundant queries
- [ ] Add support for version-specific patterns

### Related

- **Next Extractor**: `github-extractor.ts` (Phase 1 Day 2)
- **Integration**: `pattern-seeder.ts` (Phase 1 Day 3)
- **Command**: `/project-init` enhancement (Phase 1 Day 4)
