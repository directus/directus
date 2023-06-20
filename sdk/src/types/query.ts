import type { ItemType, RelationalFields, RemoveRelationships } from './schema.js';

/**
 * All query options available
 */
export interface Query<Schema extends object, Item extends object> {
	fields?: QueryFields<Schema, Item> | undefined;
}

/**
 * Fields querying, including nested relational fields
 */
export type QueryFields<Schema extends object, Item extends object> = (
	| '*'
	| (keyof Item & string)
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
export type ExtractItem<Schema extends object, Item extends object> = Extract<UnpackList<Item>, ItemType<Schema>>;
export type ExtractRelation<Schema extends object, Item extends object, Key> = Key extends keyof Item
	? ExtractItem<Schema, Item> extends infer Relation
		? Relation extends never
			? never
			: Relation
		: never
	: never;
/**
 * Flatten array types to their singular root
 */
export type UnpackList<Item> = Item extends any[] ? Item[number] : Item;

// -- helpers
type HasNestedFields<Fields> = UnpackList<Fields> extends infer Field ? (Field extends object ? true : never) : never;
export type FieldsWildcard<Item extends object, Fields> = UnpackList<Fields> extends infer Field
	? Field extends undefined
		? keyof Item
		: Field extends '*'
		? keyof Item
		: Field extends string
		? Field
		: never
	: never;
export type RelationalQueryFields<Fields> = UnpackList<Fields> extends infer Field
	? Field extends object
		? Field
		: never
	: never;

type PickFlatFields<Schema extends object, Item extends object, Fields> = Pick<
	RemoveRelationships<Schema, Item>,
	Extract<Fields, keyof Item>
>;

/**
 * Apply the configured fields query parameter on a given Item type
 */
export type ApplyQueryFields<Schema extends object, Item extends object, Fields> = HasNestedFields<Fields> extends never
	? PickFlatFields<Schema, Item, FieldsWildcard<Item, Fields>> // no relation
	: RelationalQueryFields<Fields> extends infer RelatedFields
	? PickFlatFields<Schema, Item, Exclude<FieldsWildcard<Item, Fields>, keyof RelatedFields>> & {
			[K in keyof RelatedFields]: ExtractRelation<Schema, Item, K> extends infer Relation
				? Relation extends object
					? ApplyQueryFields<Schema, Relation, RelatedFields[K]>
					: never
				: never;
	  }
	: never;
