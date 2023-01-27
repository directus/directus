import { Collection } from './collection';
import { Relation, RelationMeta, Field, FieldMeta } from '@directus/shared/types';
import { Diff } from 'deep-diff';
import { DatabaseClient } from './database';

export type Snapshot = {
	version: number;
	directus: string;
	vendor?: DatabaseClient;
	collections: Collection[];
	fields: SnapshotField[];
	relations: SnapshotRelation[];
};

export type SnapshotField = Field & { meta: Omit<FieldMeta, 'id'> };
export type SnapshotRelation = Relation & { meta: Omit<RelationMeta, 'id'> };

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
	relations: {
		collection: string;
		field: string;
		related_collection: string | null;
		diff: Diff<SnapshotRelation | undefined>[];
	}[];
};

export type SnapshotDiffWithHash = { hash: string; diff: SnapshotDiff };
