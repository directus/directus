import { Collection } from './collection';
import { Relation, RelationMeta, Field, FieldMeta } from '@directus/shared/types';
import { Diff } from 'deep-diff';

export type Snapshot = {
	version: number;
	directus: string;
	vendor?: 'mysql' | 'postgres' | 'cockroachdb' | 'sqlite' | 'oracle' | 'mssql' | 'redshift';
	collections: Collection[];
	fields: SnapshotField[];
	relations: SnapshotRelation[];
};

export type SnapshotField = Field & { meta: Omit<FieldMeta, 'id'> };
export type SnapshotRelation = Relation & { meta: Omit<RelationMeta, 'id'> };

export type SnapshotWithHash = Omit<Snapshot, 'collections' | 'fields' | 'relations'> & {
	hash: string;
	collections: (Collection & { hash: string })[];
	fields: (SnapshotField & { hash: string })[];
	relations: (SnapshotRelation & { hash: string })[];
};

export type SnapshotDiff = {
	collections: {
		collection: string;
		hash?: string;
		diff: Diff<Collection | undefined>[];
	}[];
	fields: {
		collection: string;
		field: string;
		hash?: string;
		diff: Diff<SnapshotField | undefined>[];
	}[];
	relations: {
		collection: string;
		field: string;
		related_collection: string | null;
		hash?: string;
		diff: Diff<SnapshotRelation | undefined>[];
	}[];
};
