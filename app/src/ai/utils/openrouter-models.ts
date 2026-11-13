import type { AspectRatio, OpenRouterModel } from '@directus/ai';
import formatTitle from '@directus/format-title';

interface OpenRouterCatalogEntry {
	id: string;
	name: string;
	context_length?: number;
	top_provider?: { max_completion_tokens?: number | null };
	/** Only the image list has per-parameter details. */
	supported_parameters?: { aspect_ratio?: { values?: string[] } } | string[];
}

/** An image model with the ratios OpenRouter lists for it. */
export interface OpenRouterImageModel extends OpenRouterModel {
	aspectRatios?: AspectRatio[];
}

export type OpenRouterCatalog = 'chat' | 'image';

// Public, unauthenticated endpoints. The assistant always sends tools, so only tool-capable models are useful for chat.
// Images use the list behind OpenRouter's `/images` endpoint, which is where the AI SDK sends image requests.
const OPENROUTER_MODELS_URLS: Record<OpenRouterCatalog, string> = {
	chat: 'https://openrouter.ai/api/v1/models?supported_parameters=tools&sort=most-popular',
	image: 'https://openrouter.ai/api/v1/images/models',
};

const modelsPromises: Partial<Record<OpenRouterCatalog, Promise<OpenRouterImageModel[]>>> = {};

export function fetchOpenRouterModels(catalog?: 'chat'): Promise<OpenRouterModel[]>;
export function fetchOpenRouterModels(catalog: 'image'): Promise<OpenRouterImageModel[]>;
export function fetchOpenRouterModels(catalog: OpenRouterCatalog = 'chat'): Promise<OpenRouterImageModel[]> {
	modelsPromises[catalog] ??= loadModels(catalog).catch(() => {
		delete modelsPromises[catalog];
		return [];
	});

	return modelsPromises[catalog];
}

async function loadModels(catalog: OpenRouterCatalog): Promise<OpenRouterImageModel[]> {
	const response = await fetch(OPENROUTER_MODELS_URLS[catalog]);

	if (!response.ok) throw new Error(`OpenRouter models request failed with ${response.status}`);

	const { data }: { data: OpenRouterCatalogEntry[] } = await response.json();

	return (
		data
			// Batch variants are for OpenRouter's batch API
			.filter((model) => !model.id.endsWith(':batch'))
			.map((model) => ({
				id: model.id,
				name: model.name,
				...(model.context_length ? { context: model.context_length } : {}),
				...(model.top_provider?.max_completion_tokens ? { output: model.top_provider.max_completion_tokens } : {}),
				...getAspectRatios(model),
			}))
	);
}

export function toSavedModel(id: string, catalog: OpenRouterModel[]): OpenRouterModel {
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

function getAspectRatios(model: OpenRouterCatalogEntry): Pick<OpenRouterImageModel, 'aspectRatios'> {
	const values = Array.isArray(model.supported_parameters)
		? undefined
		: model.supported_parameters?.aspect_ratio?.values;

	const ratios = values?.filter((value): value is AspectRatio => /^\d+(\.\d+)?:\d+(\.\d+)?$/.test(value));
	return ratios?.length ? { aspectRatios: ratios } : {};
}
