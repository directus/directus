import type { LiteralFields } from './fields.js';
import type { ItemType, RelationalFields } from './schema.js';
import type { Merge } from './utils.js';

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

/**
 * Create a map of function fields and output naming
 */
type TranslateFunctionFields<Fields, Funcs> = {
	[F in PermuteFields<Fields, Funcs> as `${F[1]}(${F[0]})`]: `${F[0]}_${F[1]}`;
};

/**
 * Create a map of function fields and output naming
 */
type FunctionFieldNames<Fields, Funcs> = {
	[F in PermuteFields<Fields, Funcs> as `${F[1]}(${F[0]})`]: F[0];
};

/**
 * Get all many relations on an item
 */
type RelationalFunctions<Schema extends object, Item> = keyof {
	[Key in RelationalFields<Schema, Item> as Extract<Item[Key], ItemType<Schema>> extends any[] ? Key : never]: Key;
};

/**
 * Combine the various function types
 */
export type FunctionFields<Schema extends object, Item> =
	| {
			[Type in keyof QueryFunctions]: TypeFunctionFields<Item, Type>;
	  }[keyof QueryFunctions]
	| keyof TranslateFunctionFields<RelationalFunctions<Schema, Item>, 'count'>;

/**
 *
 */
export type TypeFunctionFields<Item, Type extends keyof QueryFunctions> = keyof TranslateFunctionFields<
	LiteralFields<Item, Type>,
	QueryFunctions[Type]
>;

/**
 * Map all possible function fields on an item
 */
export type FunctionFieldsMap<Schema extends object, Item> = Merge<
	TranslateFunctionFields<RelationalFunctions<Schema, Item>, 'count'>,
	TranslateFunctionFields<LiteralFields<Item, 'datetime'>, QueryFunctions['datetime']> &
		TranslateFunctionFields<LiteralFields<Item, 'json'>, QueryFunctions['json']> &
		TranslateFunctionFields<LiteralFields<Item, 'csv'>, QueryFunctions['csv']>
>;

/**
 * Map all possible function fields to name on an item
 */
export type FunctionFieldNamesMap<Schema extends object, Item> = Merge<
	FunctionFieldNames<RelationalFunctions<Schema, Item>, 'count'>,
	FunctionFieldNames<LiteralFields<Item, 'datetime'>, QueryFunctions['datetime']> &
		FunctionFieldNames<LiteralFields<Item, 'json'>, QueryFunctions['json']> &
		FunctionFieldNames<LiteralFields<Item, 'csv'>, QueryFunctions['csv']>
>;
