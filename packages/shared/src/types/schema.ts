import { Type } from './fields';
import { Relation } from './relations';

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
