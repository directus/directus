import type { LiteralFields } from './fields.js';
import type { ItemType, RelationalFields } from './schema.js';
import type { Merge } from './utils.js';

/**
 * Available query functions
 */
export type DateTimeFunctions = 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';
export type DateFunctions = 'year' | 'month' | 'week' | 'day' | 'weekday';
export type TimeFunctions = 'hour' | 'minute' | 'second';
export type ArrayFunctions = 'count';

/** First arg is constrained to json fields on Item; path is a runtime string so the response alias cannot be statically resolved. */
export type JsonFunctionField<Item> = `json(${Extract<LiteralFields<Item, 'json'>, string>}, ${string})`;

/**
 * Concrete prefix strings used to drive IDE completions. Each json-typed field contributes
 * `json(fieldName, ` as a specific (non-template) literal so the completer enumerates it and
 * positions the cursor ready for the path argument. These are a subset of JsonFunctionField
 * (${string} matches the empty suffix) so validation is unaffected.
 */
type JsonFunctionFieldPartial<Item> = `json(${Extract<LiteralFields<Item, 'json'>, string>}, `;

/** Replace all occurrences of `From` with `To` in string `S` */
type ReplaceChar<S extends string, From extends string, To extends string> = S extends `${infer B}${From}${infer A}`
	? `${B}${To}${ReplaceChar<A, From, To>}`
	: S;

/** Collapse consecutive underscores to a single one: `a__b` → `a_b` */
type CollapseUnderscores<S extends string> = S extends `${infer B}__${infer A}` ? CollapseUnderscores<`${B}_${A}`> : S;

/** Strip a trailing underscore: `foo_` → `foo` */
type StripTrailingUnderscore<S extends string> = S extends `${infer B}_` ? B : S;

/**
 * Normalize a json path to its response-alias form.
 * Replaces `.`, `[`, `]` with `_`, then collapses consecutive underscores and strips any trailing one.
 * e.g. `tags[0]` → `tags_0`, `items[0].name` → `items_0_name`
 */
type NormalizeJsonPath<S extends string> = StripTrailingUnderscore<
	CollapseUnderscores<ReplaceChar<ReplaceChar<ReplaceChar<S, '.', '_'>, '[', '_'>, ']', '_'>>
>;

/**
 * Given a literal `json(field, path)` string, compute the server-generated response alias.
 * e.g. `json(metadata, settings.theme)` → `metadata_settings_theme_json`
 * e.g. `json(metadata, tags[0])` → `metadata_tags_0_json`
 */
export type JsonFieldAlias<S extends string> = S extends `json(${infer Field}, ${infer Path})`
	? `${Field}_${NormalizeJsonPath<Path>}_json`
	: never;

export type QueryFunctions = {
	datetime: DateTimeFunctions;
	date: DateFunctions;
	time: TimeFunctions;
	json: ArrayFunctions;
	csv: ArrayFunctions;
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
 * Get all many relations on an item
 */
type RelationalFunctions<Schema, Item> = keyof {
	[Key in RelationalFields<Schema, Item> as Extract<Item[Key], ItemType<Schema>> extends any[] ? Key : never]: Key;
};

/**
 * Create a map of function fields and their resulting output names
 */
type TranslateFunctionFields<Fields, Funcs> = {
	[F in PermuteFields<Fields, Funcs> as `${F[1]}(${F[0]})`]: `${F[0]}_${F[1]}`;
};

/**
 * Combine the various function types
 */
export type FunctionFields<Schema, Item> =
	| {
			[Type in keyof QueryFunctions]: TypeFunctionFields<Item, Type>;
	  }[keyof QueryFunctions]
	| keyof TranslateFunctionFields<RelationalFunctions<Schema, Item>, ArrayFunctions>
	| JsonFunctionFieldPartial<Item>
	| JsonFunctionField<Item>;

/**
 *
 */
export type TypeFunctionFields<Item, Type extends keyof QueryFunctions> = keyof TranslateFunctionFields<
	LiteralFields<Item, Type>,
	QueryFunctions[Type]
>;

/**
 * Json function fields are dropped from the static output type because the server-generated alias
 * ({field}_{path}_json) cannot be computed from the type-level string. Access extracted values
 * with a cast or typed helper after the request.
 */
type JsonFunctionFieldAliases<Item> = {
	[K in JsonFunctionField<Item>]: never;
};

/**
 * Map json function fields to their original field name (the first argument)
 */
type JsonFunctionFieldOrigins<Item> = {
	[K in JsonFunctionField<Item>]: K extends `json(${infer F}, ${string})` ? F : never;
};

/**
 * Map all possible function fields on an item
 */
export type MappedFunctionFields<Schema, Item> = Merge<
	TranslateFunctionFields<RelationalFunctions<Schema, Item>, ArrayFunctions>,
	TranslateFunctionFields<LiteralFields<Item, 'datetime'>, DateTimeFunctions> &
		TranslateFunctionFields<LiteralFields<Item, 'date'>, DateFunctions> &
		TranslateFunctionFields<LiteralFields<Item, 'time'>, TimeFunctions> &
		TranslateFunctionFields<LiteralFields<Item, 'json' | 'csv'>, ArrayFunctions> &
		JsonFunctionFieldAliases<Item>
>;

/**
 * Create a map of function fields with its original field name
 */
type FunctionFieldNames<Fields, Funcs> = {
	[F in PermuteFields<Fields, Funcs> as `${F[1]}(${F[0]})`]: F[0];
};

/**
 * Map all possible function fields to name on an item
 */
export type MappedFieldNames<Schema, Item> = Merge<
	FunctionFieldNames<RelationalFunctions<Schema, Item>, ArrayFunctions>,
	FunctionFieldNames<LiteralFields<Item, 'datetime'>, DateTimeFunctions> &
		FunctionFieldNames<LiteralFields<Item, 'date'>, DateFunctions> &
		FunctionFieldNames<LiteralFields<Item, 'time'>, TimeFunctions> &
		FunctionFieldNames<LiteralFields<Item, 'json' | 'csv'>, ArrayFunctions> &
		JsonFunctionFieldOrigins<Item>
>;
