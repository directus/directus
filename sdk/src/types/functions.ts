import type { LiteralFields } from "./fields.js";
import type { ItemType, RelationalFields } from "./schema.js";

/**
 * Available query functions
 */
export type QueryFunctions = {
	datetime: 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';
	json: 'count';
	csv: 'count';
};

/**
 * Permute [function, field] combinations
 */
export type PermuteFields<Fields, Funcs> = Fields extends string
	? Funcs extends string
		? [Fields, Funcs]
		: never
	: never;

export type FunctionFields<Item> = TypeFunctionFields<Item, 'datetime'>;

export type TypeFunctionFields<Item, Type extends keyof QueryFunctions> = PermuteFields<LiteralFields<Item, Type>, QueryFunctions[Type]>

// type ArrayFunctionFields<Schema extends object, Item, RKeys extends keyof Item=RelationalFields<Schema, Item>, FKeys extends keyof Item=Fla> = {
// 	[Key in RKeys]: Extract<Item[Key], ItemType<Schema>> extends any[] ? Key : never
// }[RKeys] | ;

// export type ArrayFunctions<Schema extends object, Item, Keys extends keyof Item=RelationalFields<Schema, Item>> = {
// 	[Key in Keys]: Extract<Item[Key], ItemType<Schema>> extends any[] ? Key : never
// }[Keys];
