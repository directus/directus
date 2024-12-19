import type { SchemaOverview } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { getLocalSchemaCache, setLocalSchemaCache } from './cache.js';

// Test optimized memory caching using localSchemaCache
describe('optimize serialization and deserialization for memory cache', async () => {
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
		expect(JSON.stringify(await getLocalSchemaCache())).toBe(JSON.stringify(value));
	});

	test.each(types)('cached value cannot be updated for type $type', async ({ type, value }) => {
		await setLocalSchemaCache(value as unknown as SchemaOverview);

		const cachedValue = await getLocalSchemaCache();

		switch (type) {
			case 'string':
				value = 'updated';
				break;
			case 'number':
				value = 789;
				break;
			case 'boolean':
				value = false;
				break;
			case 'null':
				value = 'updated';
				break;
			case 'array':
				(value as Array<any>).push('updated');
				break;
			case 'object':
				(value as any).updated = true;
				break;
			case 'buffer':
				(value as Buffer).write('updated');
				break;
		}

		expect(await getLocalSchemaCache()).toEqual(cachedValue);
	});
});
