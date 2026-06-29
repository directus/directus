import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { defineTool } from './define-tool.js';
import { createSearchIndex } from './search-index.js';
import type { ToolConfig } from './types.js';

describe('createSearchIndex', () => {
	test('ranks an exact normalized tool-name match first', () => {
		const index = createSearchIndex([
			createTool({
				name: 'flow-helper',
				description: 'Trigger flow helper',
			}),
			createTool({
				name: 'trigger_flow',
				description: 'Runs a flow',
			}),
		]);

		const result = index.search('trigger flow');

		expect(result.results.map(({ name }) => name)).toEqual(['trigger_flow', 'flow-helper']);
	});

	test('weights name matches above description and argument matches', () => {
		const index = createSearchIndex([
			createTool({
				name: 'name-locator',
				description: 'Tool for unrelated work',
			}),
			createTool({
				name: 'keyword-tool',
				description: 'Tool for unrelated work',
				keywords: ['locator'],
			}),
			createTool({
				name: 'description-tool',
				description: 'Finds locator values',
			}),
			createTool({
				name: 'argument-tool',
				description: 'Tool for unrelated work',
				inputSchema: z.object({
					value: z.string().describe('Finds locator values'),
				}),
			}),
		]);

		const result = index.search('locator');
		const names = result.results.map(({ name }) => name);

		expect(names[0]).toBe('name-locator');
		expect(names.slice(1, 3).sort()).toEqual(['description-tool', 'keyword-tool']);
		expect(names[3]).toBe('argument-tool');
	});

	test('tokenizes camel case, separators, and casing', () => {
		const index = createSearchIndex([
			createTool({
				name: 'triggerFlow',
				description: 'Runs a flow',
			}),
		]);

		const result = index.search('TRIGGER flow');

		expect(result.results.map(({ name }) => name)).toEqual(['triggerFlow']);
	});

	test('returns all tools by name for an empty query', () => {
		const index = createSearchIndex([
			createTool({ name: 'zeta', description: 'Last tool' }),
			createTool({ name: 'alpha', description: 'First tool' }),
		]);

		const result = index.search('   ');

		expect(result.results.map(({ name }) => name)).toEqual(['alpha', 'zeta']);
		expect(result.availableToolNames).toEqual(['alpha', 'zeta']);
		expect(result.hint).toBeUndefined();
	});

	test('returns available names and a recovery hint when nothing matches', () => {
		const index = createSearchIndex([
			createTool({ name: 'items', description: 'Manage items' }),
			createTool({ name: 'files', description: 'Manage files' }),
		]);

		const result = index.search('quux');

		expect(result.results).toEqual([]);
		expect(result.availableToolNames).toEqual(['files', 'items']);
		expect(result.hint).toBe('No tools matched. Available tools: files, items');
	});

	test('does not return available names for a successful non-empty search', () => {
		const index = createSearchIndex([createTool({ name: 'items', description: 'Manage items' })]);

		const result = index.search('items');

		expect(result.availableToolNames).toBeUndefined();
	});

	test('indexes keywords without returning them', () => {
		const index = createSearchIndex([
			createTool({
				name: 'assets',
				description: 'Reads assets',
				keywords: ['rendition'],
			}),
		]);

		const result = index.search('rendition');

		expect(result.results).toHaveLength(1);

		expect(result.results[0]).toEqual({
			name: 'assets',
			description: 'Reads assets',
		});

		expect(result.results[0]).not.toHaveProperty('keywords');
		expect(result.results[0]).not.toHaveProperty('instructions');
		expect(result.results[0]).not.toHaveProperty('inputType');
		expect(result.results[0]).not.toHaveProperty('outputType');
	});

	test('indexes instructions without returning them', () => {
		const index = createSearchIndex([
			createTool({
				name: 'flows',
				description: 'Reads flows',
				instructions: 'Use this when the user asks about automation recipes.',
			}),
		]);

		const result = index.search('recipes');

		expect(result.results.map(({ name }) => name)).toEqual(['flows']);
		expect(result.results[0]).not.toHaveProperty('instructions');
	});

	test('indexes argument names', () => {
		const index = createSearchIndex([
			createTool({
				name: 'items',
				description: 'Reads items',
				inputSchema: z.object({
					collectionName: z.string(),
				}),
			}),
		]);

		const result = index.search('collection name');

		expect(result.results.map(({ name }) => name)).toEqual(['items']);
	});

	test('tokenizes acronym camel case', () => {
		const index = createSearchIndex([createTool({ name: 'JSONParser', description: 'Parses values' })]);

		const result = index.search('json parser');

		expect(result.results.map(({ name }) => name)).toEqual(['JSONParser']);
	});

	test('does not return input or output types in discovery results', () => {
		const index = createSearchIndex([
			createTool({
				name: 'schema',
				description: 'Reads schema',
				output: z.object({
					data: z.array(z.string()),
				}),
			}),
		]);

		const result = index.search('schema');

		expect(result.results[0]).toEqual({
			name: 'schema',
			description: 'Reads schema',
		});

		expect(result.results[0]).not.toHaveProperty('inputType');
		expect(result.results[0]).not.toHaveProperty('outputType');
	});
});

function createTool(
	options: Pick<ToolConfig<{ value?: string }>, 'name' | 'description'> &
		Partial<Pick<ToolConfig<{ value?: string }>, 'keywords' | 'instructions' | 'inputSchema' | 'output'>>,
): ToolConfig<{ value?: string }> {
	const tool: ToolConfig<{ value?: string }> = {
		name: options.name,
		description: options.description,
		inputSchema:
			options.inputSchema ??
			z.object({
				value: z.string().optional(),
			}),
		handler: async () => ({
			type: 'text',
			data: {},
		}),
	};

	if (options.keywords) tool.keywords = options.keywords;
	if (options.instructions) tool.instructions = options.instructions;
	if (options.output) tool.output = options.output;

	return defineTool(tool);
}
