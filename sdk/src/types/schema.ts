/**
 * Get all available top level Item types from a given Schema
 */
export type ItemType<Schema extends object> =
	| Schema[keyof Schema]
	| {
			[K in keyof Schema]: Schema[K] extends any[] ? Schema[K][number] : never;
	  }[keyof Schema];

export type CollectionType<Schema extends object, Collection extends keyof Schema> = UnpackList<Schema[Collection]>;

/**
 * Return string keys of all Primitive fields in the given schema Item
 */
export type PrimitiveFields<Schema extends object, Item> = {
	[Key in keyof Item]: Extract<Item[Key], ItemType<Schema>> extends never ? Key : never;
}[keyof Item];

/**
 * Return string keys of all Relational fields in the given schema Item
 */
export type RelationalFields<Schema extends object, Item> = {
	[Key in keyof Item]: Extract<Item[Key], ItemType<Schema>> extends never ? never : Key;
}[keyof Item];

/**
 * Remove the related Item types from relational m2o/a2o fields
 */
export type RemoveRelationships<Schema extends object, Item> = {
	[Key in keyof Item]: Exclude<Item[Key], ItemType<Schema>>;
};

/**
 * Flatten array types to their singular root
 */
export type UnpackList<Item> = Item extends any[] ? Item[number] : Item;
