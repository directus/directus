import type { ApiCollection } from './collection.js';
import type { DatabaseClient } from './database.js';
import type { Field, FieldMeta } from './fields.js';
import type { Relation, RelationMeta } from './relations.js';
import type { Table } from '@directus/schema';
import type { Diff } from 'deep-diff';

export type Snapshot = {
	version: number;
	directus: string;
	vendor?: DatabaseClient;
	collections: SnapshotCollection[];
	fields: SnapshotField[];
	systemFields: SnapshotSystemField[];
	relations: SnapshotRelation[];
};

export type SnapshotCollection = ApiCollection & { schema: Pick<Table, 'name'> };
export type SnapshotField = Field & { meta: Omit<FieldMeta, 'id'> };
export type SnapshotRelation = Relation & { meta: Omit<RelationMeta, 'id'> };

export type SnapshotSystemField = {
	collection: string;
	field: string;
	schema: {
		is_indexed: boolean;
	};
};

export type SnapshotWithHash = Snapshot & { hash: string };

export type SnapshotDiff = {
	collections: {
		collection: string;
		diff: Diff<ApiCollection | undefined>[];
	}[];
	fields: {
		collection: string;
		field: string;
		diff: Diff<SnapshotField | undefined>[];
	}[];
	systemFields: {
		collection: string;
		field: string;
		diff: Diff<SnapshotSystemField | undefined>[];
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
