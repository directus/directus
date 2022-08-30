import { ForeignKey } from 'knex-schema-inspector/dist/types/foreign-key';
import { Field } from './fields';
import { DeepPartial } from './misc';

export type RelationMeta = {
	id: number;

	many_collection: string;
	many_field: string;

	one_collection: string | null;
	one_field: string | null;
	one_collection_field: string | null;
	one_allowed_collections: string[] | null;
	one_deselect_action: 'nullify' | 'delete';
	link_one_allowed_collections_back: boolean;
	one_allowed_collections_relation_field: string;

	junction_field: string | null;
	sort_field: string | null;

	system?: boolean;
};

export type Relation = {
	collection: string;
	field: string;
	related_collection: string | null;
	schema: ForeignKey | null;
	meta: RelationMeta | null;
	fields: [DeepPartial<Field>] | null
};
