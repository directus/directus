import type { CollectionMeta } from '@directus/types';
import systemData from './collections.yaml';

export type BaseCollectionMeta = Pick<
	CollectionMeta,
	| 'collection'
	| 'note'
	| 'hidden'
	| 'singleton'
	| 'icon'
	| 'translations'
	| 'versioning'
	| 'item_duplication_fields'
	| 'accountability'
	| 'group'
	| 'system'
>;

export type DataCollectionMeta = Partial<BaseCollectionMeta> & Pick<BaseCollectionMeta, 'collection' | 'note'>;

export const systemCollectionRows = (systemData['data'] as DataCollectionMeta[]).map(
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
	return systemCollectionNames.includes(collection);
}
