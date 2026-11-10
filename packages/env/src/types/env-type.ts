import type { DEFAULTS } from '../constants/defaults.js';
import type { ENV_TYPES } from '../constants/env-types.js';
import type { TYPE_MAP } from '../constants/type-map.js';

export type EnvType = (typeof ENV_TYPES)[number];

/**
 * Type that can be listed in the type map. Next to the env types, `false` marks variables that can be turned off
 */
export type TypeMapType = EnvType | 'false';

/**
 * Type(s) of a variable in the type map. When multiple types are allowed, the first one is used to cast the value and
 * the remaining ones are additionally accepted, eg `['milliseconds', 'false']`
 */
export type TypeMapEntry = EnvType | readonly [EnvType, ...TypeMapType[]];

/** All types listed in a type map entry */
type EntryTypes<Entry extends TypeMapEntry> = Entry extends readonly TypeMapType[] ? Entry[number] : Entry;

/**
 * A duration in milliseconds, parsed from a number or a human readable value like `15m`. The intersection keeps the
 * alias name visible in editors, while staying interchangeable with `number`
 */
export type Milliseconds = number & Record<never, never>;

/**
 * A size in bytes, parsed from a number or a human readable value like `10mb`. The intersection keeps the alias name
 * visible in editors, while staying interchangeable with `number`
 */
export type Bytes = number & Record<never, never>;

/**
 * Runtime type that's produced by `cast` for each of the supported env types
 */
interface EnvTypeValue extends Record<TypeMapType, unknown> {
	false: false;
	string: string;
	number: number;
	boolean: boolean;
	regex: RegExp;
	array: unknown[];
	'string-array': string[];
	json: unknown;
	milliseconds: Milliseconds;
	bytes: Bytes;
}

/**
 * Raw value that's accepted as input by `cast` for each of the supported env types, eg for defaults
 */
interface EnvTypeInput extends Omit<EnvTypeValue, 'milliseconds' | 'bytes'> {
	milliseconds: string | number;
	bytes: string | number;
}

/**
 * Keys in the type map that are regular expression patterns (eg `STORAGE_.+_SECRET`) rather than
 * literal variable names, and can therefore not be used as known keys
 */
type PatternKey<Key extends PropertyKey> = Key extends `${string}.+${string}` ? Key : never;

/** Variables that are cast to a known type */
export type CastKey = Exclude<keyof typeof TYPE_MAP, PatternKey<keyof typeof TYPE_MAP>>;

/** Variables that always have a value, as a default is defined for them */
export type DefaultKey = keyof typeof DEFAULTS;

export type Value<Key extends CastKey> = EnvTypeValue[EntryTypes<(typeof TYPE_MAP)[Key]>];

export type InputValue<Key extends CastKey> = EnvTypeInput[EntryTypes<(typeof TYPE_MAP)[Key]>];
