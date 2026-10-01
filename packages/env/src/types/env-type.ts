import type { DEFAULTS } from '../constants/defaults.js';
import type { ENV_TYPES } from '../constants/env-types.js';
import type { TYPE_MAP } from '../constants/type-map.js';

export type EnvType = (typeof ENV_TYPES)[number];

/**
 * Runtime type that's produced by `cast` for each of the supported env types
 */
interface EnvTypeValue extends Record<EnvType, unknown> {
	string: string;
	number: number;
	boolean: boolean;
	regex: RegExp;
	array: unknown[];
	'string-array': string[];
	json: unknown;
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

export type Value<Key extends CastKey> = EnvTypeValue[(typeof TYPE_MAP)[Key]];
