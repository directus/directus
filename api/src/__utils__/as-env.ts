import type { Env } from '@directus/env';

/**
 * Wrap a partial set of environment variables for use with a mocked `useEnv`.
 *
 * The real env always holds a value for every variable that has a default, which tests generally
 * don't care about. This casts a partial object to `Env` so that individual tests can keep setting
 * only the variables that are relevant to them.
 */
export const asEnv = (env: Record<string, unknown>): Env => env as Env;
