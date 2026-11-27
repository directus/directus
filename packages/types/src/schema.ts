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
	 * Versioning of each collection, by live collection. Holds the tables managed by versioning, kept apart from the
	 * collections of the project.
	 */
	versioning?: Record<string, CollectionVersioning>;
};

/**
 * Versioning of a collection: its shadow and link tables, and how it's read together with its versions. The read goes
 * through a collection of its own name and primary key, as the live primary key isn't unique across the live items and
 * versions.
 */
export type CollectionVersioning = {
	/** The read collection, with the version fields and the key of the combined rows */
	collection: CollectionOverview;
	/** Relations of the read collection, which follow the ones of its live collection */
	relations: Relation[];
	/** Shadow table the versions are read from, whose permissions apply to those rows */
	shadow: CollectionOverview | null;
	/** Link table with the references of live items to versions of related items, if there is one */
	link: CollectionOverview | null;
	/** Relations of the shadow and link tables */
	tableRelations: Relation[];
	/**
	 * References to versions of related items, which the live collection doesn't have. Together with the version system
	 * fields, these are the version fields of the read collection.
	 */
	referenceFields: string[];
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
};
