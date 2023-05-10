import { parseQuery } from 'wild-wild-parser';
import type { Target } from 'wild-wild-path';
import { set } from 'wild-wild-path';

/**
 * Initialize function which can be used to redact values in an object.
 * @param paths List of object paths to be redacted (supports `*.` and `**.`).
 * @param censor The string used to redact values.
 * @returns Redact function.
 */
export function redact(paths: string[], censor: string) {
	// Parse paths only once on intialization, instead of every call
	const query = parseQuery(paths.join(' '));
	return (input: Target) => set(input, query, censor, { missing: false });
}
