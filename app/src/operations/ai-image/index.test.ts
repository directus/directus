import { describe, expect, test, vi } from 'vitest';
import config from './index';

vi.mock('./fields', () => ({ getImageModelChoices: () => [{ value: 'openai:gpt-image-2', text: 'GPT Image 2' }] }));
vi.mock('./options.vue', () => ({ default: {} }));

const overview = (options: Record<string, unknown>) => (config.overview as any)(options, { flow: {} });

describe('overview', () => {
	test('shows the model, ratio, and count, with defaults', () => {
		expect(overview({ model: 'openai:gpt-image-2' })).toEqual([
			{ label: '$t:ai.flow_operations.model', text: 'GPT Image 2' },
			{ label: '$t:aspect_ratio', text: '1:1' },
			{ label: '$t:operations.ai-image.count', text: '1' },
		]);
	});

	test('names the match reference option', () => {
		expect(overview({ aspectRatio: 'reference' })[1].text).toBe('$t:operations.ai-image.match_reference');
	});
});
