import { SchemaOverview as SO } from '@directus/schema/dist/types/overview';
import { Relation } from './relation';
import { Permission } from './permissions';

export type SchemaOverview = {
	tables: SO;
	relations: Relation[];
	collections: {
		collection: string;
		sort_field: string | null;
	}[];
	fields: {
		id: number;
		collection: string;
		field: string;
		special: string[];
	}[];
	permissions: Permission[];
};
