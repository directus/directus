import { describe, expect, it, vi } from 'vitest';
import { applyAnthropicToolSearch } from './anthropic-tool-search.js';

const mockToolSearchResult = { tool_search_bm25: { type: 'provider-defined', id: 'tool_search_bm25' } };

vi.mock('@ai-sdk/anthropic', () => ({
	anthropic: {
		tools: {
			toolSearchBm25_20251119: vi.fn(() => mockToolSearchResult),
		},
	},
}));

const sampleTools = {
	items: { description: 'Items tool', inputSchema: {} } as any,
	files: { description: 'Files tool', inputSchema: {} } as any,
};

describe('applyAnthropicToolSearch', () => {
	it('adds tool search and defers tools for Anthropic non-Haiku models', () => {
		const result = applyAnthropicToolSearch('anthropic', 'claude-sonnet-4-5', sampleTools);

		expect(result['items']!.providerOptions).toEqual({
			anthropic: { deferLoading: true },
		});

		expect(result['files']!.providerOptions).toEqual({
			anthropic: { deferLoading: true },
		});

		expect(result).toHaveProperty('toolSearch');
	});

	it('preserves existing providerOptions when deferring', () => {
		const toolsWithOptions = {
			items: {
				description: 'Items tool',
				inputSchema: {},
				providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } }, other: { foo: 'bar' } },
			} as any,
		};

		const result = applyAnthropicToolSearch('anthropic', 'claude-sonnet-4-5', toolsWithOptions);

		expect(result['items']!.providerOptions).toEqual({
			other: { foo: 'bar' },
			anthropic: { cacheControl: { type: 'ephemeral' }, deferLoading: true },
		});
	});

	it('returns tools unchanged for Haiku models', () => {
		const result = applyAnthropicToolSearch('anthropic', 'claude-haiku-4-5', sampleTools);
		expect(result).toBe(sampleTools);
	});

	it('returns tools unchanged for non-Anthropic providers', () => {
		const result = applyAnthropicToolSearch('openai', 'gpt-4', sampleTools);
		expect(result).toBe(sampleTools);
	});

	it('returns tools unchanged when tools object is empty', () => {
		const result = applyAnthropicToolSearch('anthropic', 'claude-sonnet-4-5', {});
		expect(result).toEqual({});
	});
});
