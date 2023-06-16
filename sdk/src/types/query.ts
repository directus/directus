import type { ItemType, RelationalFields } from './schema.js';

export interface Query<Schema extends object, Item extends object> {
	fields?: QueryFields<Schema, Item>;
}

export type QueryFields<Schema extends object, Item extends object> = (
	| '*'
	| keyof Item
	| QueryFieldsNested<Schema, Item>
)[];

export type QueryFieldsNested<Schema extends object, Item extends object> = {
	[Key in keyof Pick<Item, RelationalFields<Schema, Item>>]: QueryFields<
		Schema,
		Extract<Item[Key] extends any[] ? Item[Key][number] : Item[Key], ItemType<Schema>>
	>;
};
