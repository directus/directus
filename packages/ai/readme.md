# @directus/ai

Shared AI types and model definitions for Directus AI features.

## Overview

This package contains:

- Type definitions for AI providers, models, and tools
- Default model definitions with capabilities and pricing
- Helper functions for building custom model definitions

## Adding a New Model

When adding a new model to an existing provider, update these files:

### 1. `packages/ai/src/models.ts`

Add the model to `DEFAULT_AI_MODELS`:

```typescript
{
  provider: 'openai',
  model: 'gpt-6',
  name: 'GPT-6',
  limit: { context: 500_000, output: 100_000 },
  cost: { input: 2.0, output: 8.0 },
  attachment: true,
  reasoning: true,
}
```

### 2. `packages/system-data/src/fields/settings.yaml`

Add the model to the appropriate `ai_*_allowed_models` choices:

```yaml
- field: ai_openai_allowed_models
  options:
    choices:
      # ... existing models
      - text: GPT-6
        value: gpt-6
```

### 3. Default allowed models (optional)

If the new model should be enabled by default, add it to `DEFAULT_ALLOWED_MODELS` in `packages/ai/src/models.ts`. This
applies to every install whose `ai_*_allowed_models` setting is still `null` (never customized), so no migration is
needed.
