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

---

## GitHub Extractor

**File**: `github-extractor.ts`
**Status**: ✅ Complete (Phase 1 Day 2)
**GitHub Issue**: #36

### Purpose

Discovers community-validated patterns by analyzing similar GitHub repositories.

### Usage

```bash
# From project root
npx tsx .claude/scripts/extractors/github-extractor.ts [project-type] [tech-stack...]

# Example with Directus extension
npx tsx .claude/scripts/extractors/github-extractor.ts directus-extension directus vue3 typescript

# Default: directus-extension with directus, vue3, typescript
npx tsx .claude/scripts/extractors/github-extractor.ts
```

### Output

Patterns are saved to: `.claude/memory/patterns/github/`

Example pattern file: `folder-structure.json`

```json
{
  "name": "folder-structure",
  "source": "github",
  "frequency": 1.0,
  "quality": 0.6,
  "confidence": 0.6,
  "examples": ["owner/repo1", "owner/repo2"],
  "projectType": "directus-extension",
  "pattern": {
    "description": "Pattern found in 100% of analyzed repositories",
    "category": "folder-structure",
    "commonImplementation": {...},
    "alternatives": [],
    "applicableTo": ["directus-extension"],
    "frameworks": ["directus", "vue3", "typescript"]
  }
}
```

### Pattern Categories

1. **folder-structure** - Directory organization and architecture
2. **testing-approach** - Testing frameworks and strategies
3. **common-dependencies** - Frequently used packages
4. **configuration-patterns** - Config files and tooling setup

### Confidence Calculation

```
confidence = frequency × quality

where:
  frequency = % of repos using this pattern (0-1)
  quality   = normalized star rating (0-1, capped at 200 stars)
```

**Consensus Threshold**: Patterns must be used by >60% of analyzed repos

### Search Strategy

The extractor builds GitHub search queries with:
- Tech stack keywords
- Minimum 10 stars (quality filter)
- Updated since 2023-01-01 (active projects)

Example query:
```
directus extension OR directus-extension directus vue3 typescript stars:>10 pushed:>2023-01-01
```

### Integration with MCP

Uses GitHub MCP server configured in `.mcp.json` for:
- Repository search
- File content retrieval
- Repository tree analysis

Current implementation uses mock data structure. Full MCP integration ready.

### Next Steps

- [ ] Integrate actual GitHub MCP calls
- [ ] Add caching to avoid rate limits
- [ ] Expand pattern analysis (commit patterns, issue patterns)
- [ ] Add pattern versioning based on repo updates

### Related

- **Previous Extractor**: `context7-extractor.ts` (Phase 1 Day 1)
- **Integration**: `pattern-seeder.ts` (Phase 1 Day 3)
- **Command**: `/project-init` enhancement (Phase 1 Day 4)
