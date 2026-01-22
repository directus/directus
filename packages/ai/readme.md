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

### 3. Database Migration (for default models)

If the new model should be enabled by default for existing installations, create a migration in
`api/src/database/migrations/`:

```typescript
// 20260115A-add-gpt6-to-defaults.ts
export async function up(knex: Knex): Promise<void> {
	// Add to existing allowed models arrays
	const settings = await knex('directus_settings').first();
	if (settings) {
		const openaiModels = JSON.parse(settings.ai_openai_allowed_models || '[]');
		if (!openaiModels.includes('gpt-6')) {
			openaiModels.push('gpt-6');
			await knex('directus_settings').update({
				ai_openai_allowed_models: JSON.stringify(openaiModels),
			});
		}
	}
}
```
