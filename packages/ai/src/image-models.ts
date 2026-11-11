import type { AspectRatio, ImageModelDefinition, ImageProviderType, ImageSizeSetting } from './types.js';

/** The ratio used when none is set, or when one can't be read */
export const DEFAULT_ASPECT_RATIO: AspectRatio = '1:1';

/**
 * GPT Image 2 and later take any size whose sides are multiples of 16, between 1:3 and 3:1, and at least 655,360 pixels.
 * These sizes stay near 1.5 megapixels, under the 2560x1440 above which OpenAI calls output experimental.
 */
const OPENAI_RATIOS: Pick<ImageModelDefinition, 'aspectRatios' | 'sizes'> = {
	aspectRatios: ['1:1', '3:2', '2:3', '4:3', '3:4', '5:4', '4:5', '16:9', '9:16', '21:9'],
	sizes: {
		'1:1': '1024x1024',
		'3:2': '1536x1024',
		'2:3': '1024x1536',
		'4:3': '1280x960',
		'3:4': '960x1280',
		'5:4': '1280x1024',
		'4:5': '1024x1280',
		'16:9': '1536x864',
		'9:16': '864x1536',
		'21:9': '1792x768',
	},
};

const GEMINI_RATIOS: AspectRatio[] = [
	'1:1',
	'3:2',
	'2:3',
	'4:3',
	'3:4',
	'5:4',
	'4:5',
	'16:9',
	'9:16',
	'21:9',
	'4:1',
	'1:4',
	'8:1',
	'1:8',
];

const GEMINI: Pick<ImageModelDefinition, 'aspectRatios' | 'transparency' | 'maxImagesPerCall'> = {
	aspectRatios: GEMINI_RATIOS,
	transparency: false,
	// The Gemini adapter rejects n > 1 but reports a limit of 10, so the SDK wouldn't split the request
	maxImagesPerCall: 1,
};

/** Models without an announced shutdown date. */
export const DEFAULT_IMAGE_MODELS: ImageModelDefinition[] = [
	{
		provider: 'openai',
		model: 'gpt-image-2.6-sunburst',
		name: 'GPT Image 2.6 Sunburst',
		...OPENAI_RATIOS,
		transparency: true,
	},
	{
		provider: 'openai',
		model: 'gpt-image-2.6-flare',
		name: 'GPT Image 2.6 Flare',
		...OPENAI_RATIOS,
		transparency: true,
	},
	{
		provider: 'openai',
		model: 'gpt-image-2.5-sunburst',
		name: 'GPT Image 2.5 Sunburst',
		...OPENAI_RATIOS,
		transparency: true,
	},
	{
		provider: 'openai',
		model: 'gpt-image-2.5-flare',
		name: 'GPT Image 2.5 Flare',
		...OPENAI_RATIOS,
		transparency: true,
	},
	{ provider: 'openai', model: 'gpt-image-2', name: 'GPT Image 2', ...OPENAI_RATIOS, transparency: false },
	{ provider: 'google', model: 'gemini-nano-banana-2.1', name: 'Nano Banana 2.1', ...GEMINI },
	{ provider: 'google', model: 'gemini-3-pro-image', name: 'Nano Banana Pro', ...GEMINI },
	{ provider: 'google', model: 'gemini-3.1-flash-image', name: 'Nano Banana 2', ...GEMINI },
	{ provider: 'google', model: 'gemini-3.1-flash-lite-image', name: 'Nano Banana 2 Lite', ...GEMINI },
];

export function findImageModel(provider: ImageProviderType, model: string): ImageModelDefinition | undefined {
	return DEFAULT_IMAGE_MODELS.find((m) => m.provider === provider && m.model === model);
}

/**
 * Ratios for a model, falling back to the provider's usual set for ids that aren't in the catalog. OpenRouter models
 * are never in the catalog, and some of them reject ratios like 8:1, so they only get the common ones.
 */
export function getSupportedAspectRatios(provider: ImageProviderType, model: string): AspectRatio[] {
	const known = findImageModel(provider, model);
	if (known) return known.aspectRatios;
	return provider === 'google' ? GEMINI_RATIOS : OPENAI_RATIOS.aspectRatios;
}

/** The supported ratio closest in shape to the one asked for. */
export function getClosestAspectRatio(ratio: string, supported: AspectRatio[]): AspectRatio {
	if (supported.includes(ratio as AspectRatio)) return ratio as AspectRatio;

	const target = toNumber(ratio) ?? toNumber(DEFAULT_ASPECT_RATIO)!;

	return supported.reduce((best, candidate) =>
		Math.abs(Math.log(toNumber(candidate)! / target)) < Math.abs(Math.log(toNumber(best)! / target)) ? candidate : best,
	);
}

/** What to send to `generateImage`: a pixel size for OpenAI, an aspect ratio for everyone else. */
export function getImageSizeSetting(provider: ImageProviderType, model: string, ratio: string): ImageSizeSetting {
	const aspectRatio = getClosestAspectRatio(ratio, getSupportedAspectRatios(provider, model));

	if (provider === 'openai') {
		const sizes = findImageModel(provider, model)?.sizes ?? OPENAI_RATIOS.sizes!;

		return { size: sizes[aspectRatio] ?? sizes[DEFAULT_ASPECT_RATIO]! };
	}

	return { aspectRatio };
}

/**
 * Gemini ids outside the catalog get the same limit as the catalogued ones. Some OpenRouter models only make one image
 * per request, so OpenRouter always asks for one.
 */
export function getMaxImagesPerCall(provider: ImageProviderType, model: string): number | undefined {
	const known = findImageModel(provider, model);
	if (known) return known.maxImagesPerCall;
	if (provider === 'openrouter') return 1;
	return provider === 'google' && model.startsWith('gemini-') ? 1 : undefined;
}

function toNumber(ratio: string): number | null {
	const [width, height] = ratio.split(':').map(Number);
	if (!width || !height) return null;
	return width / height;
}
