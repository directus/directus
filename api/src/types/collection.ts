import type { Table } from '@directus/schema';
import type { BaseCollectionMeta } from '@directus/system-data';
import type { Field } from '@directus/types';

export type Collection = {
	collection: string;
	fields?: Field[];
	meta: BaseCollectionMeta | null;
	schema: Table | null;
};
