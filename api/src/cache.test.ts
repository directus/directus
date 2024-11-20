import type { SchemaOverview } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { getLocalSchemaCache, setLocalSchemaCache } from './cache.js';

// Test optimized memory caching with localSchemaCache
describe('optimize serialization and deserialization in keyv for memory store', async () => {
	// Keyv handles all JSON types plus Buffer
	const types = [
		{ type: 'string', value: 'sample-string' },
		{ type: 'number', value: 123 },
		{ type: 'boolean', value: true },
		{ type: 'null', value: null },
		{ type: 'array', value: [1, 2, 3, 'abc', true] },
		{ type: 'object', value: { some: { thing: 'here' } } },
		{ type: 'buffer', value: Buffer.from('sample-buffer') },
	];

	test.each(types)('returns the exact value for type $type', async ({ value }) => {
		await setLocalSchemaCache(value as unknown as SchemaOverview);
		expect(await getLocalSchemaCache()).toBe(value);
	});
});
