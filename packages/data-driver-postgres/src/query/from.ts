import { escapeIdentifier } from '../utils/escape-identifier.js';

/**
 * Generate the `FROM x` part of a SQL statement
 */
export function from(from: string): string {
	return `FROM ${escapeIdentifier(from)}`;
}
