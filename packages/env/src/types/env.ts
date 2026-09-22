import type { DEFAULTS } from '../constants/defaults.js';
import type { TYPE_MAP } from '../constants/type-map.js';
import type { EnvType } from './env-type.js';

/**
 * Runtime type that's produced by `cast` for each of the supported env types
 */
interface EnvTypeValue extends Record<EnvType, unknown> {
	string: string;
	number: number;
	boolean: boolean;
	regex: RegExp;
	array: unknown[];
	json: unknown;
}

/**
 * Keys in the type map that are regular expression patterns (eg `STORAGE_.+_SECRET`) rather than
 * literal variable names, and can therefore not be used as known keys
 */
type PatternKey<Key extends PropertyKey> = Key extends `${string}.+${string}` ? Key : never;

/** Variables that are cast to a known type */
type CastKey = Exclude<keyof typeof TYPE_MAP, PatternKey<keyof typeof TYPE_MAP>>;

/** Variables that always have a value, as a default is defined for them */
type DefaultKey = keyof typeof DEFAULTS;

type Value<Key extends CastKey> = EnvTypeValue[(typeof TYPE_MAP)[Key]];

/**
 * Variables that are guaranteed to be present. Variables that don't appear in the type map are kept
 * as `unknown`, as their default is used as-is while a configured value is cast based on its shape
 */
type RequiredEnv = {
	[Key in DefaultKey]: Key extends CastKey ? Value<Key> : unknown;
};

/** Variables with a known type that are only present when they've been configured */
type OptionalEnv = {
	[Key in Exclude<CastKey, DefaultKey>]?: Value<Key>;
};

export type Env = RequiredEnv & OptionalEnv & Record<string, unknown>;
