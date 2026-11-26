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
	/** How each collection is read together with its versions, by live collection */
	reads: Record<string, VersionedRead>;
};

/**
 * How a collection is read together with its versions: through a collection of its own name and primary key, as the
 * live primary key isn't unique across the live items and versions
 */
export type VersionedRead = {
	/** Name of the read collection */
	name: string;
	/** The read collection, with the version fields and the key of the combined rows */
	collection: CollectionOverview;
	/** Relations of the read collection, which follow the ones of its live collection */
	relations: Relation[];
	/** Shadow table the versions are read from, whose permissions apply to those rows */
	shadow: string | null;
	/** Link table with the references of live items to versions of related items, if there is one */
	link: string | null;
	/** Version system fields and references to versions of related items, which the live collection doesn't have */
	versionFields: string[];
	/** Columns that split the version references of a2o fields per related collection */
	a2oReferences: VersionedA2OReference[];
};

/**
 * Column of a read collection with the version references of an a2o field for one related collection, and a relation
 * to its shadow table
 */
export type VersionedA2OReference = {
	column: string;
	/** Column with the version references of the a2o field */
	reference: string;
	collectionField: string;
	collection: string;
	shadow: string;
};
