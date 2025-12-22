import type { Type } from './fields.js';
import type { Relation } from './relations.js';
import type { Filter } from './filter.js';

export type FieldOverview = {
	field: string;
	defaultValue: any;
	nullable: boolean;
	generated: boolean;
	type: Type;
	dbType: string | null;
	precision: number | null;
	scale: number | null;
	special: string[];
	note: string | null;
	validation: Filter | null;
	alias: boolean;
	searchable: boolean;
};

export type CollectionOverview = {
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

export type CollectionsOverview = {
	[name: string]: CollectionOverview;
};

export type SchemaOverview = {
	collections: CollectionsOverview;
	relations: Relation[];
};
