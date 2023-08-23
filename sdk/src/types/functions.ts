import type { ItemType, RelationalFields } from "./schema.js";

/**
 * Available query functions
 */
export type QueryFunctions = {
	date: 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';
	array: 'count';
};

/**
 * Permute [function, field] combinations
 */
export type PermuteFields<Fields, Funcs> = Fields extends string
	? Funcs extends string
		? [Fields, Funcs]
		: never
	: never;


// type ArrayFunctionFields<Schema extends object, Item, RKeys extends keyof Item=RelationalFields<Schema, Item>, FKeys extends keyof Item=Fla> = {
// 	[Key in RKeys]: Extract<Item[Key], ItemType<Schema>> extends any[] ? Key : never
// }[RKeys] | ;

// export type ArrayFunctions<Schema extends object, Item, Keys extends keyof Item=RelationalFields<Schema, Item>> = {
// 	[Key in Keys]: Extract<Item[Key], ItemType<Schema>> extends any[] ? Key : never
// }[Keys];
