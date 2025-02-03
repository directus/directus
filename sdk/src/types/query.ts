import type { QueryDeep } from './deep.js';
import type { HasManyToAnyRelation, HasNestedFields, QueryFields } from './fields.js';
import type { QueryFilter } from './filters.js';
import type { ItemType, RelationalFields } from './schema.js';
import type { IfAny, UnpackList } from './utils.js';

/**
 * All query options available
 */
export interface Query<Schema, Item> {
	readonly fields?: IfAny<Schema, (string | Record<string, any>)[], QueryFields<Schema, Item>> | undefined;
	filter?: IfAny<Schema, Record<string, any>, QueryFilter<Schema, Item>> | undefined;
	search?: string | undefined;
	sort?: IfAny<Schema, string | string[], QuerySort<Schema, Item> | QuerySort<Schema, Item>[]> | undefined;
	limit?: number | undefined;
	offset?: number | undefined;
	page?: number | undefined;
	deep?: IfAny<Schema, Record<string, any>, QueryDeep<Schema, Item>> | undefined;
	readonly alias?: IfAny<Schema, Record<string, string>, QueryAlias<Schema, Item>> | undefined;
}

/**
 * All query options with an additional version query option for readItem and readSingleton
 */
export interface QueryItem<Schema, Item> extends Query<Schema, Item> {
	readonly version?: string | undefined;
	readonly versionRaw?: boolean | undefined;
}

/**
 * Returns Item types that are available in the root Schema
 */
export type ExtractItem<Schema, Item> = Extract<UnpackList<Item>, ItemType<Schema>>;

/**
 * Returns the relation type from the current item by key
 */
export type ExtractRelation<Schema, Item extends object, Key> = Key extends keyof Item
	? ExtractItem<Schema, Item[Key]>
	: never;

/**
 * Merge union of optional objects
 */
export type MergeRelationalFields<FieldList> = Exclude<UnpackList<FieldList>, string> extends infer RelatedFields
	? {
			[Key in RelatedFields extends any ? keyof RelatedFields : never]-?: Exclude<RelatedFields[Key], undefined>;
	  }
	: never;

/**
 * Merge separate relational objects together
 */
export type MergeFields<FieldList> = HasNestedFields<FieldList> extends never
	? Extract<UnpackList<FieldList>, string>
	: Extract<UnpackList<FieldList>, string> | MergeRelationalFields<FieldList>;

/**
 * Query sort with support for nested relational fields
 */
export type QuerySort<Schema, Item> = UnpackList<Item> extends infer FlatItem
	? readonly (keyof FlatItem | `-${keyof FlatItem & string}` | RelationalSort<Schema, FlatItem>)[]
	: never;

/**
 * Handle relational field sorting using dot notation
 */
type RelationalSort<Schema, Item> = {
	[Key in RelationalFields<Schema, Item>]: Extract<Item[Key], ItemType<Schema>> extends infer RelatedCollection
		? RelatedCollection extends any[]
			? HasManyToAnyRelation<RelatedCollection> extends never
				? never // many-to-many or one-to-many should not be sortable
				: never // many-to-any
			: `${Key & string}.${keyof RelatedCollection & string}` | `-${Key & string}.${keyof RelatedCollection & string}` // many-to-one only
		: never;
}[RelationalFields<Schema, Item>];

export type MergeObjects<A, B> = object extends A ? (object extends B ? A & B : A) : object extends B ? B : never;

/**
 * Alias object
 *
 * TODO somehow include these aliases in the Field Types!!
 */
export type QueryAlias<_Schema, Item> = Record<string, keyof Item>;
