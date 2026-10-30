import type { OpenAICompatibleModel } from '@directus/ai';
import formatTitle from '@directus/format-title';

interface OpenRouterCatalogEntry {
	id: string;
	name: string;
	context_length: number;
	top_provider?: { max_completion_tokens?: number | null };
}

// Public, unauthenticated endpoint. The assistant always sends tools, so only tool-capable models are useful.
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models?supported_parameters=tools&sort=most-popular';

let modelsPromise: Promise<OpenAICompatibleModel[]> | null = null;

export function fetchOpenRouterModels(): Promise<OpenAICompatibleModel[]> {
	modelsPromise ??= loadModels().catch(() => {
		modelsPromise = null;
		return [];
	});

	return modelsPromise;
}

async function loadModels(): Promise<OpenAICompatibleModel[]> {
	const response = await fetch(OPENROUTER_MODELS_URL);

	if (!response.ok) throw new Error(`OpenRouter models request failed with ${response.status}`);

	const { data }: { data: OpenRouterCatalogEntry[] } = await response.json();

	return (
		data
			// Batch variants are for OpenRouter's batch API, not chat
			.filter((model) => !model.id.endsWith(':batch'))
			.map((model) => ({
				id: model.id,
				name: model.name,
				context: model.context_length,
				...(model.top_provider?.max_completion_tokens ? { output: model.top_provider.max_completion_tokens } : {}),
			}))
	);
}

export function toSavedModel(id: string, catalog: OpenAICompatibleModel[]): OpenAICompatibleModel {
	const catalogModel = catalog.find((model) => model.id === id);

	if (!catalogModel) return { id, name: formatModelId(id) };

	// Drop the vendor ("Anthropic: ") to match the built-in model names
	return { ...catalogModel, name: catalogModel.name.replace(/^[^:]+:\s*/, '') };
}

// "acme/some-model:free" -> "Some Model (Free)"
function formatModelId(id: string): string {
	const [slug = id, variant] = id.slice(id.indexOf('/') + 1).split(':');

	return variant ? `${formatTitle(slug)} (${formatTitle(variant)})` : formatTitle(slug);
}
