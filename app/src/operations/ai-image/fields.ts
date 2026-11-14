import {
	type AspectRatio,
	DEFAULT_ASPECT_RATIO,
	DEFAULT_IMAGE_MODELS,
	getClosestAspectRatio,
	getSupportedAspectRatios,
	isImageProviderType,
} from '@directus/ai';
import type { DeepPartial, Field } from '@directus/types';
import { omit } from 'lodash-es';
import { getModelKey, getProviderIcon } from '@/ai/utils/available-models';
import type { OpenRouterImageModel } from '@/ai/utils/openrouter-models';
import { getPermissionsField } from '@/ai/utils/operation-options';
import { useServerStore } from '@/stores/server';

/** The built-in OpenAI and Google models, plus OpenRouter's image models as loaded from its public list. */
export function getImageModelChoices(openRouterModels: OpenRouterImageModel[] = []) {
	const providers = useServerStore().info.ai_providers ?? [];

	const fromOpenRouter = openRouterModels.map((model) => ({
		provider: 'openrouter' as const,
		model: model.id,
		name: model.name,
		transparency: false,
	}));

	return [...DEFAULT_IMAGE_MODELS, ...fromOpenRouter]
		.filter((model) => providers.includes(model.provider))
		.map((model) => ({
			text: model.name,
			value: getModelKey(model),
			icon: getProviderIcon(model.provider),
			provider: model.provider,
			transparency: model.transparency,
		}));
}

/** OpenRouter models only get the ratios OpenRouter lists for them, out of the ones the API can send. */
export function getAspectRatioChoices(
	model: string | undefined,
	hasReferences: boolean,
	openRouterModels: OpenRouterImageModel[] = [],
) {
	const [provider, ...rest] = String(model ?? '').split(':');
	const id = rest.join(':');
	const supported = getSupportedAspectRatios(isImageProviderType(provider) ? provider : 'google', id);
	const listed = provider === 'openrouter' ? openRouterModels.find((m) => m.id === id)?.aspectRatios : undefined;
	const narrowed = listed ? supported.filter((ratio) => listed.includes(ratio)) : [];
	const ratios = narrowed.length ? narrowed : supported;
	const choices = ratios.map((ratio) => ({ text: ratio, value: ratio, icon: getAspectRatioIcon(ratio) }));

	if (!hasReferences) return choices;

	return [
		{ text: '$t:operations.ai-image.match_reference', value: 'reference', icon: 'photo_size_select_large' },
		...choices,
	];
}

function getAspectRatioIcon(ratio: AspectRatio) {
	const [width, height] = ratio.split(':').map(Number);
	if (width === height) return 'crop_square';
	return width! > height! ? 'crop_landscape' : 'crop_portrait';
}

export function hasReferences(panel: Record<string, any>) {
	return (panel['referenceImages']?.length ?? 0) > 0;
}

/**
 * Keeps the options valid for the selected model. The ratio snaps to the closest one the model lists, so the dropdown
 * never shows a value it doesn't have. Transparency is dropped for models known not to have it and for every OpenRouter
 * model, since its toggle hides for them. `{{ }}` ratios and models that aren't in the list are left for the API to decide.
 */
export function applyModelLimits(
	options: Record<string, any>,
	openRouterModels: OpenRouterImageModel[] = [],
): Record<string, any> {
	const next = { ...options };
	const ratio = next['aspectRatio'] ?? DEFAULT_ASPECT_RATIO;

	const supported = getAspectRatioChoices(next['model'], hasReferences(next), openRouterModels).map(
		(choice) => choice.value,
	);

	if (!supported.includes(ratio) && !String(ratio).includes('{{')) {
		const ratios = supported.filter((value): value is AspectRatio => value !== 'reference');
		next['aspectRatio'] = getClosestAspectRatio(ratio, ratios);
	}

	const model = getImageModelChoices().find((choice) => choice.value === next['model']);
	const isOpenRouter = String(next['model'] ?? '').startsWith('openrouter:');
	return model?.transparency === false || isOpenRouter ? omit(next, 'transparent') : next;
}

export function getFields(
	panel: Record<string, any>,
	openRouterModels: OpenRouterImageModel[] = [],
): DeepPartial<Field>[] {
	const choices = getImageModelChoices(openRouterModels);
	const hasImageProvider = (useServerStore().info.ai_providers ?? []).some(isImageProviderType);
	const selected = choices.find((c) => c.value === panel['model']);
	const provider = selected?.provider ?? String(panel['model'] ?? '').split(':')[0];

	return [
		{
			field: 'model',
			name: '$t:ai.flow_operations.model',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'select-dropdown',
				required: true,
				note: hasImageProvider ? '$t:operations.ai-image.model_note' : '$t:operations.ai-image.no_providers',
				options: {
					choices: choices.map(({ text, value, icon }) => ({ text, value, icon })),
					allowOther: true,
					placeholder: '$t:ai.flow_operations.model_placeholder',
				},
			},
		},
		{
			field: 'prompt',
			name: '$t:ai.prompt',
			type: 'text',
			meta: {
				note: '$t:operations.ai-image.prompt_note',
				width: 'full',
				interface: 'input-multiline',
				required: true,
				options: {
					placeholder: '$t:operations.ai-image.prompt_placeholder',
				},
			},
		},
		{
			field: 'referenceImages',
			name: '$t:operations.ai-image.reference_images',
			type: 'csv',
			meta: {
				width: 'full',
				interface: 'tags',
				note: '$t:operations.ai-image.reference_images_note',
				options: {
					placeholder: '$t:operations.ai-image.reference_images_placeholder',
					iconRight: 'add_photo_alternate',
				},
			},
		},
		{
			field: 'aspectRatio',
			name: '$t:aspect_ratio',
			type: 'string',
			schema: { default_value: DEFAULT_ASPECT_RATIO },
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				note: hasReferences(panel)
					? '$t:operations.ai-image.aspect_ratio_reference_note'
					: '$t:operations.ai-image.aspect_ratio_note',
				options: { choices: getAspectRatioChoices(panel['model'], hasReferences(panel), openRouterModels) },
			},
		},
		{
			field: 'count',
			name: '$t:operations.ai-image.count',
			type: 'integer',
			schema: { default_value: 1 },
			meta: {
				note: '$t:operations.ai-image.count_note',
				width: 'half',
				interface: 'input',
				options: { min: 1, max: 4 },
			},
		},
		{
			field: 'quality',
			name: '$t:quality',
			type: 'string',
			meta: {
				note: '$t:operations.ai-image.quality_note',
				width: 'half',
				interface: 'select-dropdown',
				hidden: provider !== 'openai',
				options: {
					allowNone: true,
					placeholder: '$t:operations.ai-image.quality_placeholder',
					choices: [
						{ text: '$t:operations.ai-image.low', value: 'low' },
						{ text: '$t:medium', value: 'medium' },
						{ text: '$t:operations.ai-image.high', value: 'high' },
					],
				},
			},
		},
		{
			field: 'transparent',
			name: '$t:operations.ai-image.background',
			type: 'boolean',
			schema: { default_value: false },
			meta: {
				note: '$t:operations.ai-image.transparent_note',
				width: 'full',
				interface: 'boolean',
				hidden: selected ? selected.transparency === false : provider !== 'openai',
				options: { label: '$t:operations.ai-image.transparent' },
			},
		},
		{
			field: 'folder',
			name: '$t:folder',
			type: 'uuid',
			meta: {
				width: 'half',
				interface: 'system-folder',
				note: '$t:operations.ai-image.folder_note',
			},
		},
		getPermissionsField('$t:operations.ai-image.permissions_note'),
		{
			field: 'title',
			name: '$t:operations.ai-image.file_title',
			type: 'string',
			meta: {
				note: '$t:operations.ai-image.file_title_note',
				width: 'full',
				interface: 'input',
			},
		},
		{
			field: 'emitEvents',
			name: '$t:operations.ai-image.emit_events',
			type: 'boolean',
			schema: { default_value: false },
			meta: {
				note: '$t:operations.ai-image.emit_events_note',
				width: 'full',
				interface: 'boolean',
			},
		},
	];
}
