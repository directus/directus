import type { Type } from './fields.js';
import type { Relation } from './relations.js';
import type { Filter } from './filter.js';

export type FieldOverview = {
	field: string;
	defaultValue: any;
	nullable: boolean;
	generated: boolean;
	type: Type | 'unknown' | 'alias';
	dbType: string | null;
	precision: number | null;
	scale: number | null;
	special: string[];
	note: string | null;
	validation: Filter | null;
	alias: boolean;
};

export type CollectionsOverview = {
	[name: string]: {
		collection: string;
		primary: string;
		singleton: boolean;
		sortField: string | null;
		note: string | null;
		accountability: 'all' | 'activity' | null;
		fields: {
			[name: string]: FieldOverview;
		};
	};
};

export type SchemaOverview = {
	collections: CollectionsOverview;
	relations: Relation[];
};
