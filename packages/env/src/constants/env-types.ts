/**
 * Casting flags that are read from env var values. For example `number:1` is read as `1` instead of
 * `'1'`
 */
export const ENV_TYPES = ['string', 'number', 'regex', 'array', 'json', 'boolean'] as const;
