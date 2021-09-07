import { Collection } from './collection';
import { Relation } from './relation';
import { Field } from '@directus/shared/types';

export type Snapshot = {
	version: number;
	directus: string;
	collections: Collection[];
	fields: Field[];
	relations: Relation[];
};
