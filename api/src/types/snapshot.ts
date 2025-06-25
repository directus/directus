import type { DatabaseClient, Field, FieldMeta, Relation, RelationMeta, RawSchemaCollection } from '@directus/types';
import type { Diff } from 'deep-diff';

export type Snapshot = {
	version: number;
	directus: string;
	vendor?: DatabaseClient;
	collections: RawSchemaCollection[];
	fields: SnapshotField[];
	relations: SnapshotRelation[];
};

export type SnapshotField = Field & { meta: Omit<FieldMeta, 'id'> };
export type SnapshotRelation = Relation & { meta: Omit<RelationMeta, 'id'> };

export type SnapshotWithHash = Snapshot & { hash: string };

export type SnapshotDiff = {
	collections: {
		collection: string;
		diff: Diff<RawSchemaCollection | undefined>[];
	}[];
	fields: {
		collection: string;
		field: string;
		diff: Diff<SnapshotField | undefined>[];
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
