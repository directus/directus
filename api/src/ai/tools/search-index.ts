import { z } from 'zod';
import type { ToolConfig } from './types.js';

export type ToolSearchMatch = {
	name: string;
	description: string;
};

export type ToolSearchResults = {
	results: ToolSearchMatch[];
	availableToolNames?: string[];
	hint?: string;
};

export interface SearchIndex {
	search(query: string): ToolSearchResults;
}

type IndexedTool = {
	tool: ToolConfig<any>;
	match: ToolSearchMatch;
	normalizedName: string;
	termFrequency: Map<string, number>;
	fieldWeights: Map<string, number>;
	documentLength: number;
};

type JsonSchema = {
	description?: string;
	properties?: Record<string, JsonSchema>;
	items?: JsonSchema | JsonSchema[];
	prefixItems?: JsonSchema[];
	anyOf?: JsonSchema[];
	oneOf?: JsonSchema[];
	allOf?: JsonSchema[];
};

const BM25_K1 = 1.2;
const BM25_B = 0.75;

const FIELD_WEIGHTS = {
	name: 3,
	keywords: 2,
	description: 2,
	arguments: 1,
	instructions: 1,
} as const;

export function createSearchIndex(tools: readonly ToolConfig<any>[]): SearchIndex {
	const indexedTools = tools.map(indexTool).sort((a, b) => a.tool.name.localeCompare(b.tool.name));
	const availableToolNames = indexedTools.map(({ tool }) => tool.name);

	return {
		search(query) {
			const queryTokens = tokenize(query);

			if (queryTokens.length === 0) {
				return {
					results: indexedTools.map(({ match }) => match),
					availableToolNames,
				};
			}

			const ranked = rankTools(indexedTools, queryTokens);

			if (ranked.length === 0) {
				return {
					results: [],
					availableToolNames,
					hint: `No tools matched. Available tools: ${availableToolNames.join(', ')}`,
				};
			}

			return {
				results: ranked.map(({ match }) => match),
			};
		},
	};
}

function indexTool(tool: ToolConfig<any>): IndexedTool {
	const termFrequency = new Map<string, number>();
	const fieldWeights = new Map<string, number>();

	addFieldTerms(termFrequency, fieldWeights, tokenize(tool.name), FIELD_WEIGHTS.name);
	addFieldTerms(termFrequency, fieldWeights, tokenize(tool.keywords?.join(' ') ?? ''), FIELD_WEIGHTS.keywords);
	addFieldTerms(termFrequency, fieldWeights, tokenize(tool.description), FIELD_WEIGHTS.description);
	addFieldTerms(termFrequency, fieldWeights, getArgumentTokens(tool), FIELD_WEIGHTS.arguments);
	addFieldTerms(termFrequency, fieldWeights, tokenize(tool.instructions ?? ''), FIELD_WEIGHTS.instructions);

	return {
		tool,
		match: {
			name: tool.name,
			description: tool.description,
		},
		normalizedName: normalizeTokens(tokenize(tool.name)),
		termFrequency,
		fieldWeights,
		documentLength: [...termFrequency.values()].reduce((sum, count) => sum + count, 0),
	};
}

function rankTools(indexedTools: IndexedTool[], queryTokens: string[]): IndexedTool[] {
	const queryTerms = [...new Set(queryTokens)];
	const documentFrequencies = getDocumentFrequencies(indexedTools, queryTerms);
	const averageDocumentLength = getAverageDocumentLength(indexedTools);
	const normalizedQuery = normalizeTokens(queryTokens);

	return indexedTools
		.map((tool) => ({
			tool,
			fieldScore: getFieldScore(tool, queryTerms),
			score: scoreTool(tool, queryTerms, documentFrequencies, indexedTools.length, averageDocumentLength),
			exactNameMatch: tool.normalizedName === normalizedQuery,
		}))
		.filter(({ score, exactNameMatch }) => exactNameMatch || score > 0)
		.sort((a, b) => {
			if (a.exactNameMatch !== b.exactNameMatch) return a.exactNameMatch ? -1 : 1;
			if (a.fieldScore !== b.fieldScore) return b.fieldScore - a.fieldScore;
			if (a.score !== b.score) return b.score - a.score;
			return a.tool.tool.name.localeCompare(b.tool.tool.name);
		})
		.map(({ tool }) => tool);
}

function scoreTool(
	tool: IndexedTool,
	queryTerms: string[],
	documentFrequencies: Map<string, number>,
	documentCount: number,
	averageDocumentLength: number,
): number {
	if (tool.documentLength === 0) return 0;

	return queryTerms.reduce((score, term) => {
		const termFrequency = tool.termFrequency.get(term) ?? 0;

		if (termFrequency === 0) return score;

		const documentFrequency = documentFrequencies.get(term) ?? 0;
		const fieldWeight = tool.fieldWeights.get(term) ?? 0;
		const idf = Math.log(1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5));
		const denominator = termFrequency + BM25_K1 * (1 - BM25_B + BM25_B * (tool.documentLength / averageDocumentLength));

		return score + fieldWeight * idf * ((termFrequency * (BM25_K1 + 1)) / denominator);
	}, 0);
}

function getFieldScore(tool: IndexedTool, queryTerms: string[]): number {
	return queryTerms.reduce((score, term) => score + (tool.fieldWeights.get(term) ?? 0), 0);
}

function getDocumentFrequencies(indexedTools: IndexedTool[], queryTerms: string[]): Map<string, number> {
	const frequencies = new Map<string, number>();

	for (const term of queryTerms) {
		frequencies.set(
			term,
			indexedTools.reduce((count, tool) => count + (tool.termFrequency.has(term) ? 1 : 0), 0),
		);
	}

	return frequencies;
}

function getAverageDocumentLength(indexedTools: IndexedTool[]): number {
	if (indexedTools.length === 0) return 1;

	return indexedTools.reduce((sum, tool) => sum + tool.documentLength, 0) / indexedTools.length || 1;
}

function getArgumentTokens(tool: ToolConfig<any>): string[] {
	const schema = z.toJSONSchema(tool.inputSchema, { io: 'input' }) as JsonSchema;

	return collectSchemaTokens(schema);
}

function collectSchemaTokens(schema: JsonSchema | undefined): string[] {
	if (!schema) return [];

	const tokens: string[] = [];
	tokens.push(...tokenize(schema.description ?? ''));

	for (const [name, property] of Object.entries(schema.properties ?? {})) {
		tokens.push(...tokenize(name));
		tokens.push(...collectSchemaTokens(property));
	}

	if (schema.items) {
		const items = Array.isArray(schema.items) ? schema.items : [schema.items];

		for (const item of items) {
			tokens.push(...collectSchemaTokens(item));
		}
	}

	for (const item of schema.prefixItems ?? []) {
		tokens.push(...collectSchemaTokens(item));
	}

	for (const item of [...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])]) {
		tokens.push(...collectSchemaTokens(item));
	}

	return tokens;
}

function addFieldTerms(
	termFrequency: Map<string, number>,
	fieldWeights: Map<string, number>,
	terms: string[],
	weight: number,
): void {
	for (const term of terms) {
		termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);
		fieldWeights.set(term, Math.max(fieldWeights.get(term) ?? 0, weight));
	}
}

function tokenize(value: string): string[] {
	return (
		value
			.replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
			.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
			.match(/[A-Za-z0-9]+/g)
			?.map((token) => token.toLowerCase()) ?? []
	);
}

function normalizeTokens(tokens: string[]): string {
	return tokens.join(' ');
}
