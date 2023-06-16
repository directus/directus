export type ItemType<Schema extends object> = Schema[keyof Schema];

export type PrimitiveFields<Schema extends object, Item extends object> = {
	[Key in keyof Item]: Extract<Item[Key], ItemType<Schema>> extends never ? Key : never;
}[keyof Item];

export type RelationalFields<Schema extends object, Item extends object> = {
	[Key in keyof Item]: Extract<Item[Key], ItemType<Schema>> extends never ? never : Key;
}[keyof Item];
