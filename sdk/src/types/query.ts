import type { ItemType, RelationalFields } from './schema.js';

export interface Query<TSchema extends object, TItem extends object> {
	fields?: QueryFields<TSchema, TItem>;
}

export type QueryFields<TSchema extends object, TItem extends object> = (
	| '*'
	| keyof TItem
	| QueryFieldsNested<TSchema, TItem>
)[];

export type QueryFieldsNested<TSchema extends object, TItem extends object> = {
	[Key in keyof Pick<TItem, RelationalFields<TSchema, TItem>>]: QueryFields<
		TSchema,
		Extract<TItem[Key], ItemType<TSchema>>
	>;
};
