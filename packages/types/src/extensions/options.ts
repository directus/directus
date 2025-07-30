import type { LOCAL_TYPES } from '@directus/constants';
import type { Collection } from '../collection.js';
import type { Field } from '../fields.js';
import type { Relation } from '../relations.js';
import type { DeepPartial } from '../misc.js';

export type ExtensionOptionsContext = {
	collection: string | undefined;
	editing: string;
	field: DeepPartial<Field>;
	relations: {
		m2o: DeepPartial<Relation> | undefined;
		m2a?: DeepPartial<Relation> | undefined;
		o2m: DeepPartial<Relation> | undefined;
	};
	collections: {
		junction: DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined;
		related: DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined;
	};
	fields: {
		corresponding: DeepPartial<Field> | undefined;
		junctionCurrent: DeepPartial<Field> | undefined;
		junctionRelated: DeepPartial<Field> | undefined;
		sort: DeepPartial<Field> | undefined;
	};
	items: Record<string, Record<string, any>[]>;
	localType: (typeof LOCAL_TYPES)[number];
	autoGenerateJunctionRelation: boolean;
	saving: boolean;
};
