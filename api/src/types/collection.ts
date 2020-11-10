import { Field } from './field';
import { Table } from '@directus/schema/dist/types/table';

export type CollectionMeta = {
	collection: string;
	note: string | null;
	hidden: boolean;
	singleton: boolean;
	icon: string | null;
	translations: Record<string, string>;
};

export type Collection = {
	collection: string;
	fields?: Field[];
	meta: CollectionMeta | null;
	schema: Table;
};
