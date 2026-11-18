/**
 * Convert a _FILE property back to the config option key name
 */
export function removeFileSuffix(key: string): string {
	return key.slice(0, -5);
}
