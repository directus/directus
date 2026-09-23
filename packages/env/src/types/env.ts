import type { DEFAULTS } from '../constants/defaults.js';
import type { CastKey, DefaultKey, Value } from './env-type.js';

/**
 * Variables that are guaranteed to be present. Variables that don't appear in the type map are kept
 * as `unknown`, as their default is used as-is while a configured value is cast based on its shape
 */
type RequiredEnv = {
	[Key in DefaultKey]: Key extends CastKey ? (typeof DEFAULTS)[Key] | (Value<Key> & Record<never, never>) : unknown;
};

/** Variables with a known type that are only present when they've been configured */
type OptionalEnv = {
	[Key in Exclude<CastKey, DefaultKey>]?: Value<Key>;
};

export type Env = RequiredEnv & OptionalEnv & Record<string, unknown>;
