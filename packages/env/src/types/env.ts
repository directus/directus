import type { CastKey, DefaultKey, Value } from './env-type.js';

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

/**
 * The loaded environment variables. Declared as an interface so that custom variables can be typed through
 * declaration merging, eg `declare module '@directus/env' { interface Env { MY_VARIABLE: string } }`
 */
export interface Env extends RequiredEnv, OptionalEnv, Record<string, unknown> {}
