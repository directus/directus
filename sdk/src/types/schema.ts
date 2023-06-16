export type ItemType<TSchema extends object> = TSchema[keyof TSchema];

export type PrimitiveFields<TSchema extends object, TItem extends object> = {
	[Key in keyof TItem]: Extract<TItem[Key], ItemType<TSchema>> extends never ? Key : never;
}[keyof TItem];

export type RelationalFields<TSchema extends object, TItem extends object> = {
	[Key in keyof TItem]: Extract<TItem[Key], ItemType<TSchema>> extends never ? never : Key;
}[keyof TItem];
