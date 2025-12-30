import type { FnHelperOptions } from '../../helpers/fn/types.js';
import type { Query } from '@directus/types';
import { getSimpleHash } from '@directus/utils';
import { customAlphabet } from 'nanoid/non-secure';

// Fallback to original random alias generator
const generateRandomAlias = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

// Context-aware alias generator
export function generateAlias(context = '') {
	if (context) {
		return generateDeterministicAlias(context);
	}

	return generateRandomAlias();
}

// Create a deterministic alias for general query contexts
export function generateQueryAlias(table: string, query: Query, path = ''): string {
	const context = JSON.stringify({
		table,
		path,
		sort: query.sort,
		group: query.group,
		aggregate: query.aggregate,
		// Exclude: limit, offset, page, search, filter - these are execution parameters
		// that don't affect the underlying query structure requiring aliases
	});

	return generateDeterministicAlias(context);
}

// Create a deterministic context for relational count aliases
export function generateRelationalQueryAlias(
	table: string,
	column: string,
	collectionName: string,
	options?: FnHelperOptions,
) {
	const context = JSON.stringify({
		table,
		column,
		collectionName,
		filter: options?.relationalCountOptions?.query?.filter,
	});

	return generateDeterministicAlias(context);
}

// Create a deterministic alias for join contexts
export function generateJoinAlias(collection: string, path: string[], relationType: string | null, parentFields = '') {
	const context = JSON.stringify({
		collection,
		path: path.join('.'),
		relationType,
		parentFields,
	});

	return generateDeterministicAlias(context);
}

// Generate deterministic alias based on context
function generateDeterministicAlias(context = '') {
	const hash = getSimpleHash(context);
	const alphabet = 'abcdefghijklmnopqrstuvwxyz';
	let result = '';
	let num = parseInt(hash, 16);

	// Generate 5 character alias
	for (let i = 0; i < 5; i++) {
		result += alphabet[num % alphabet.length];
		num = Math.floor(num / alphabet.length);
	}

	return result;
}
