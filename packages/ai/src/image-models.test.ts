import { describe, expect, it } from 'vitest';
import {
	getClosestAspectRatio,
	getImageSizeSetting,
	getMaxImagesPerCall,
	getSupportedAspectRatios,
} from './image-models.js';
import { isImageProviderType } from './types.js';

describe('getClosestAspectRatio', () => {
	it('keeps a supported ratio', () => {
		expect(getClosestAspectRatio('16:9', ['1:1', '16:9'])).toBe('16:9');
	});

	it('picks the closest supported ratio', () => {
		expect(getClosestAspectRatio('16:9', ['1:1', '3:2', '2:3'])).toBe('3:2');
		expect(getClosestAspectRatio('9:16', ['1:1', '3:2', '2:3'])).toBe('2:3');
		expect(getClosestAspectRatio('21:9', ['1:1', '16:9', '4:3'])).toBe('16:9');
	});

	it('falls back to square for an unreadable ratio', () => {
		expect(getClosestAspectRatio('wide', ['1:1', '16:9'])).toBe('1:1');
	});
});

describe('getImageSizeSetting', () => {
	it('sends a pixel size for OpenAI', () => {
		expect(getImageSizeSetting('openai', 'gpt-image-2.5-flare', '16:9')).toEqual({ size: '1536x864' });
		expect(getImageSizeSetting('openai', 'gpt-image-2.5-flare', '1:8')).toEqual({ size: '864x1536' });
	});

	it('sends an aspect ratio for OpenRouter, including OpenAI models routed through it', () => {
		expect(getImageSizeSetting('openrouter', 'openai/gpt-image-2.6-flare', '16:9')).toEqual({ aspectRatio: '16:9' });
		expect(getImageSizeSetting('openrouter', 'some/new-model', '7:3')).toEqual({ aspectRatio: '21:9' });
		expect(getImageSizeSetting('openrouter', 'some/new-model', '8:1')).toEqual({ aspectRatio: '21:9' });
	});

	it('sends an aspect ratio for Google', () => {
		expect(getImageSizeSetting('google', 'gemini-nano-banana-2.1', '8:1')).toEqual({ aspectRatio: '8:1' });
		expect(getImageSizeSetting('google', 'gemini-nano-banana-2.1', '7:3')).toEqual({ aspectRatio: '21:9' });
	});
});

describe('getSupportedAspectRatios', () => {
	it('falls back to the provider set for models not in the catalog', () => {
		expect(getSupportedAspectRatios('openai', 'gpt-image-9')).toEqual(
			getSupportedAspectRatios('openai', 'gpt-image-2'),
		);

		expect(getSupportedAspectRatios('google', 'gemini-9-image')).toContain('1:8');
		expect(getSupportedAspectRatios('openrouter', 'some/new-model')).not.toContain('1:8');
	});
});

describe('getMaxImagesPerCall', () => {
	it('limits Gemini models to one image per request', () => {
		expect(getMaxImagesPerCall('google', 'gemini-nano-banana-2.1')).toBe(1);
		expect(getMaxImagesPerCall('google', 'gemini-9-image')).toBe(1);
	});

	it('limits OpenRouter models to one image per request', () => {
		expect(getMaxImagesPerCall('openrouter', 'black-forest-labs/flux-3-image')).toBe(1);
		expect(getMaxImagesPerCall('openrouter', 'some/new-model')).toBe(1);
	});

	it("leaves other models at the provider's limit", () => {
		expect(getMaxImagesPerCall('openai', 'gpt-image-2.5-flare')).toBeUndefined();
	});
});

describe('isImageProviderType', () => {
	it('accepts only providers with image models', () => {
		expect(
			['openai', 'google', 'openrouter', 'anthropic', 'openai-compatible', 'other'].map(isImageProviderType),
		).toEqual([true, true, true, false, false, false]);
	});
});
