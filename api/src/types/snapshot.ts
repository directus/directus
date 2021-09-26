import { Collection } from './collection';
import { Relation } from './relation';
import { Field } from '@directus/shared/types';
import { Diff } from 'deep-diff';

export type Snapshot = {
	version: number;
	directus: string;
	collections: Collection[];
	fields: Field[];
	relations: Relation[];
};

export type SnapshotDiff = {
	collections: {
		collection: string;
		diff: Diff<Collection | undefined>[];
	}[];
	fields: {
		collection: string;
		field: string;
		diff: Diff<Field | undefined>[];
	}[];
	relations: {
		collection: string;
		field: string;
		related_collection: string | null;
		diff: Diff<Relation | undefined>[];
	}[];
};
