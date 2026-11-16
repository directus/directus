import { describe, expect, test, vi } from 'vitest';
import config from './index';

vi.mock('./fields', () => ({ getModelChoices: () => [{ value: 'openai:gpt-a', text: 'GPT A' }] }));
vi.mock('./options.vue', () => ({ default: {} }));

const overview = (options: Record<string, unknown>) => (config.overview as any)(options, { flow: {} });

describe('overview', () => {
	test('shows the model name and the output keys', () => {
		const schema = { type: 'object', properties: { alt: {}, focal_x: {} } };

		expect(overview({ model: 'openai:gpt-a', output: 'object', schema })).toEqual([
			{ label: '$t:ai.flow_operations.model', text: 'GPT A' },
			{ label: '$t:operations.ai-text.returns', text: 'alt, focal_x' },
		]);
	});

	test.each([
		['a JSON string', '{"properties":{"a":{}}}', 'a'],
		['invalid JSON', '{', '--'],
		['nothing', null, '--'],
	])('reads keys from %s', (_, schema, keys) => {
		expect(overview({ output: 'object', schema })[1].text).toBe(keys);
	});

	test('shows text output and a typed-in model id as is', () => {
		expect(overview({ model: 'openai:custom' })).toEqual([
			{ label: '$t:ai.flow_operations.model', text: 'openai:custom' },
			{ label: '$t:operations.ai-text.returns', text: '$t:text' },
		]);
	});
});
