import type { Type } from './fields.js';
import type { Filter } from './filter.js';
import type { Relation } from './relations.js';

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
	versioned: boolean;
	sortField: string | null;
	note: string | null;
	accountability: 'all' | 'activity' | null;
	status?: 'active' | 'inactive' | string;
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
	/**
	 * Tables managed by versioning, kept apart from the collections of the project
	 */
	versioning?: VersioningOverview;
};

export type VersioningOverview = {
	/** Shadow and link tables */
	collections: CollectionsOverview;
	/** Relations of the shadow and link tables */
	relations: Relation[];
	/** Collections that read the live items of a collection together with their versions, one per collection */
	readCollections: CollectionsOverview;
	/** Relations of the read collections, which follow the ones of their live collection */
	readRelations: Relation[];
};
