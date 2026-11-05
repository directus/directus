import type { DEFAULTS } from '../constants/defaults.js';
import type { CastKey, DefaultKey, Value } from './env-type.js';

/**
 * The default of a variable, if it's kept as-is by `cast`. Defaults that are parsed into another type
 * (eg `'15m'` into milliseconds) are left out
 */
type DefaultValue<Key extends DefaultKey & CastKey> =
	(typeof DEFAULTS)[Key] extends Value<Key> ? (typeof DEFAULTS)[Key] : never;

/**
 * Keeps the literal default for editor suggestions, without collapsing the value type (`& Record<never, never>`
 * prevents `'info' | string` from collapsing to `string`). Without a literal default, the value type is used as-is so
 * aliases like `Milliseconds` stay visible
 */
type RequiredValue<Key extends DefaultKey & CastKey> = [DefaultValue<Key>] extends [never]
	? Value<Key>
	: DefaultValue<Key> | (Value<Key> & Record<never, never>);

/**
 * Variables that are guaranteed to be present. Variables that don't appear in the type map are kept
 * as `unknown`, as their default is used as-is while a configured value is cast based on its shape
 */
type RequiredEnv = {
	[Key in DefaultKey]: Key extends CastKey ? RequiredValue<Key> : unknown;
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

/**
 * The loaded environment variables as exposed to extensions. Known variables keep their type, while custom variables
 * are typed as `any` for backwards compatibility with the previous `Record<string, any>` type
 */
export interface ExtensionEnv extends Env {
	[key: string]: any;
}
