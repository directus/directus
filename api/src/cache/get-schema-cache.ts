import type { SchemaOverview } from '@directus/types';
import { getCache } from './index.js';

export async function getSchemaCache(): Promise<SchemaOverview | undefined> {
	const { localSchemaCache, sharedSchemaCache } = getCache();

	const sharedSchemaHash = await sharedSchemaCache.get('hash');
	if (!sharedSchemaHash) return;

	const localSchemaHash = await localSchemaCache.get('hash');
	if (!localSchemaHash || localSchemaHash !== sharedSchemaHash) return;

	return await localSchemaCache.get('schema');
}
