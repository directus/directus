import { SchemaOverview as SO } from '@directus/schema/dist/types/overview';
import { Relation } from './relation';

export type SchemaOverview = {
	tables: SO;
	relations: Relation[];
	fields: {
		id: number;
		collection: string;
		field: string;
		special: string[];
	}[];
};
