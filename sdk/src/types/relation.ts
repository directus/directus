import type { PrimaryKey } from '@directus/types';

// Simply helpers for building the schema

export type Relation<RelatedItem extends object, FieldType> = RelatedItem | FieldType;

export type ManyRelation<RelatedItem extends object, FieldType> = RelatedItem[] | FieldType[];

export type AnyRelation<RelatedItems extends object> = {
	collection: RelatedItems;
	item: PrimaryKey;
}[];
