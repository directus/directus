import type { ItemType, RelationalFields, RemoveRelationships } from './schema.js';

/**
 * All query options available
 */
export interface Query<Schema extends object, Item extends object> {
	fields?: QueryFields<Schema, Item>;
}

/**
 * Fields querying, including nested relational fields
 */
export type QueryFields<Schema extends object, Item extends object> = (
	| '*'
	| keyof Item
	| QueryFieldsRelational<Schema, Item>
)[];

/**
 * Object of nested relational fields in a given Item with it's own fields available for selection
 */
export type QueryFieldsRelational<Schema extends object, Item extends object> = {
	[Key in keyof Pick<Item, RelationalFields<Schema, Item>>]?: QueryFields<Schema, ExtractItem<Schema, Item[Key]>>;
};

/**
 * Returns Item types that are available in the root Schema
 */
type ExtractItem<Schema extends object, Item extends object> = Extract<UnpackList<Item>, ItemType<Schema>>;

/**
 * Flatten array types to their singular root
 */
type UnpackList<Item extends object> = Item extends any[] ? Item[number] : Item;

/**
 * Apply the configured fields query parameter on a given Item type
 */
export type ApplyQueryFields<
	Schema extends object,
	Item extends object,
	Fields extends QueryFields<Schema, Item> | undefined
> = Fields extends undefined
	? RemoveRelationships<Schema, Item>
	: PickFromFields<Schema, Item, Exclude<Fields, undefined>>;

/**
 * Apply the query fields set on a given Item type
 * @TODO do the difficult bit
 */
export type PickFromFields<Schema extends object, Item extends object, Fields extends QueryFields<Schema, Item>> = Item;
