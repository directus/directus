import { Field } from './field';
import { Table } from 'knex-schema-inspector/lib/types/table';

export type Collection = {
	collection: string;
	fields?: Field[];
	meta: {
		collection: string;
		note: string | null;
		hidden: boolean;
		singleton: boolean;
		icon: string | null;
		translations: Record<string, string>;
	} | null;
	schema: Table;
};
