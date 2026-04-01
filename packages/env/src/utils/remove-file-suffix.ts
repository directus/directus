/**
 * Convert a _FILE property back to the config option key name
 */
export const removeFileSuffix = (key: string): string => key.slice(0, -5);
