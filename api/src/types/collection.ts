import { Field } from './field';
import { Table } from 'knex-schema-inspector/dist/types/table';

export type CollectionMeta = {
	collection: string;
	note: string | null;
	hidden: boolean;
	singleton: boolean;
	icon: string | null;
	translations: Record<string, string>;
	accountability: 'all' | 'accountability' | null;
};

export type Collection = {
	collection: string;
	fields?: Field[];
	meta: CollectionMeta | null;
	schema: Table;
};
