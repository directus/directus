import type { BaseCollectionMeta, DataCollectionMeta } from '../types.js';
import systemData from './collections.yaml';

export const systemCollectionRows: BaseCollectionMeta[] = (systemData['data'] as DataCollectionMeta[]).map(
	(row) =>
		({
			...(systemData['defaults'] as Partial<BaseCollectionMeta>),
			...row,
			system: true,
		}) as BaseCollectionMeta,
);

export const systemCollectionNames: string[] = (systemData['data'] as DataCollectionMeta[]).map(
	(row) => row['collection']!,
);

export function isSystemCollection(collection: string): boolean {
	if (!collection.startsWith('directus_')) return false;

	return systemCollectionNames.includes(collection);
}
