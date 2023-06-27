import type { SchemaOverview } from '@directus/types';
import { getSimpleHash } from '@directus/utils';
import { getCache } from './index.js';

export async function setSchemaCache(schema: SchemaOverview): Promise<void> {
	const { localSchemaCache, sharedSchemaCache } = getCache();
	const schemaHash = getSimpleHash(JSON.stringify(schema));

	await sharedSchemaCache.set('hash', schemaHash);

	await localSchemaCache.set('schema', schema);
	await localSchemaCache.set('hash', schemaHash);
}
