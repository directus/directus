/* Directus default settings for DECIMAL type */
export const DEFAULT_NUMERIC_PRECISION = 10;
export const DEFAULT_NUMERIC_SCALE = 5;

/* Extremes for big integer type */
export const MAX_SAFE_INT64: bigint = 2n ** 63n - 1n;
export const MIN_SAFE_INT64: bigint = (-2n) ** 63n;

/* Extremes for integer type */
export const MAX_SAFE_INT32: number = 2 ** 31 - 1;
export const MIN_SAFE_INT32: number = (-2) ** 31;
