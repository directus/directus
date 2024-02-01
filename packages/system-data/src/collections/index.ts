import type { CollectionMeta } from '@directus/types';
import systemData from './collections.yaml';

export type BaseCollectionMeta = Pick<CollectionMeta, 'collection' | 'note' | 'hidden' | 'singleton' | 'icon' | 'translations' | 'versioning' | 'item_duplication_fields' | 'accountability' | 'group' | 'system'>;

export const systemCollectionRows: BaseCollectionMeta[] = systemData['data']
	.map((row: Record<string, any>) => ({
		system: true,
		...systemData['defaults'],
		...row
	}));

export const systemCollectionNames: string[] = systemData['data']
	.map((row: Record<string, any>) => row['collection']);

export function isSystemCollection(collection: string): boolean {
	return systemCollectionNames.includes(collection);
}
