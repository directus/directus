import { Field } from './field';
import { Table } from 'knex-schema-inspector/lib/types/table';

export type Collection = {
	collection: string;
	fields?: Field[];
	system: {
		collection: string;
		note: string | null;
		hidden: boolean;
		single: boolean;
		icon: string | null;
		translation: Record<string, string>;
	} | null;
	database: Table;
};
