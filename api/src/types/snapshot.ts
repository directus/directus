import type { Field, FieldMeta, Relation, RelationMeta } from '@directus/types';
import type { Diff } from 'deep-diff';
import type { Collection } from './collection.js';
import type { DatabaseClient } from './database.js';

export type Snapshot = {
	version: number;
	directus: string;
	vendor?: DatabaseClient;
	collections: Collection[];
	fields: SnapshotField[];
	systemFields: SnapshotSystemField[];
	relations: SnapshotRelation[];
};

export type SnapshotField = Field & { meta: Omit<FieldMeta, 'id'> };
export type SnapshotRelation = Relation & { meta: Omit<RelationMeta, 'id'> };

export type SnapshotSystemField = {
    collection: string;
    field: string;
	schema: {
		is_indexed: boolean;
	};
}

export type SnapshotWithHash = Snapshot & { hash: string };

export type SnapshotDiff = {
	collections: {
		collection: string;
		diff: Diff<Collection | undefined>[];
	}[];
	fields: {
		collection: string;
		field: string;
		diff: Diff<SnapshotField | undefined>[];
	}[];
	systemFields: {
		collection: string;
		field: string;
	}[];
	relations: {
		collection: string;
		field: string;
		related_collection: string | null;
		diff: Diff<SnapshotRelation | undefined>[];
	}[];
};

export type SnapshotDiffWithHash = { hash: string; diff: SnapshotDiff };

/**
 * Indicates the kind of change based on comparisons by deep-diff package
 */
export const DiffKind = {
	/** indicates a newly added property/element */
	NEW: 'N',
	/** indicates a property/element was deleted */
	DELETE: 'D',
	/** indicates a property/element was edited */
	EDIT: 'E',
	/** indicates a change occurred within an array */
	ARRAY: 'A',
} as const;
