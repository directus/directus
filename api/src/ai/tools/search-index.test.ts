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

	// Ranking is two-stage by design: field precedence (name > keywords/description > args/
	// instructions) decides coarse tiers, and field-weighted BM25 orders within a tier. The
	// next two tests pin one side of that choice each — do not "simplify" either away.

	// Names are the trusted, high-precision signal; description prose (eventually including
	// unvetted metadata from mounted external MCP servers) must not out-shout them by
	// repeating a term. Pure BM25 would rank the stuffed description first (tf saturation
	// caps at k1+1, so 2 × 2.2 beats 3 × ~1.1).
	test('a name match outranks a description that repeats the term', () => {
		const index = createSearchIndex([
			createTool({ name: 'zzz-helper', description: 'flow flow flow flow flow flow' }),
			createTool({ name: 'flow_trigger', description: 'Runs automations' }),
		]);

		expect(index.search('flow').results.map(({ name }) => name)).toEqual(['flow_trigger', 'zzz-helper']);
	});

	// Within a tier, BM25 does the real ranking as the catalog grows: a short, focused
	// description beats one that buries the term in unrelated prose. Without BM25 this tie
	// would fall through to alphabetical order and rank alpha-tool first.
	test('within the same field tier, focused descriptions outrank term-buried ones', () => {
		const index = createSearchIndex([
			createTool({
				name: 'alpha-tool',
				description: 'A long description that mentions a rendition once among many other unrelated words and features',
			}),
			createTool({ name: 'zeta-tool', description: 'Generates a rendition' }),
		]);

		expect(index.search('rendition').results.map(({ name }) => name)).toEqual(['zeta-tool', 'alpha-tool']);
	});

	test('tokenizes camel case, acronyms, separators, and casing', () => {
		const index = createSearchIndex([
			createTool({ name: 'triggerFlow', description: 'Runs a flow' }),
			createTool({ name: 'JSONParser', description: 'Parses values' }),
		]);

		expect(index.search('TRIGGER flow').results.map(({ name }) => name)).toEqual(['triggerFlow']);
		expect(index.search('json parser').results.map(({ name }) => name)).toEqual(['JSONParser']);
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

	test('indexes keywords but returns only name and description', () => {
		const index = createSearchIndex([
			createTool({
				name: 'assets',
				description: 'Reads assets',
				keywords: ['rendition'],
			}),
		]);

		const result = index.search('rendition');

		expect(result.results).toEqual([
			{
				name: 'assets',
				description: 'Reads assets',
			},
		]);

		expect(result.availableToolNames).toBeUndefined();
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
});

function createTool(
	options: Pick<ToolConfig<{ value?: string }>, 'name' | 'description'> &
		Partial<Pick<ToolConfig<{ value?: string }>, 'keywords' | 'instructions' | 'inputSchema'>>,
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

	return defineTool(tool);
}
