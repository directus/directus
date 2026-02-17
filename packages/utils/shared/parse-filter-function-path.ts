import { REGEX_BETWEEN_PARENS } from '@directus/constants';

/**
 * Parse count(a.b.c) as a.b.count(c) and a.b.count(c.d) as a.b.c.count(d)
 */
export function parseFilterFunctionPath(path: string): string {
	if (path.includes('(') && path.includes(')')) {
		const pre = path.split('(')[0]!;
		const preHasColumns = pre.includes('.');
		const preColumns = preHasColumns ? pre.slice(0, pre.lastIndexOf('.') + 1) : '';
		const functionName = preHasColumns ? pre.slice(pre.lastIndexOf('.') + 1) : pre;

		const matched = path.match(REGEX_BETWEEN_PARENS);

		if (matched) {
			const argsString = matched[1]!;
			// Split by comma to handle multiple arguments
			const args = argsString.split(',').map((arg) => arg.trim());

			// Extract path from the first argument only
			const firstArg = args[0]!;
			const firstArgHasColumns = firstArg.includes('.');
			const firstArgColumns = firstArgHasColumns ? firstArg.slice(0, firstArg.lastIndexOf('.') + 1) : '';
			const firstArgField = firstArgHasColumns ? firstArg.slice(firstArg.lastIndexOf('.') + 1) : firstArg;

			// Keep other arguments as-is
			const reconstructedArgs = [firstArgField, ...args.slice(1)].join(', ');

			return `${preColumns}${firstArgColumns}${functionName}(${reconstructedArgs})`;
		}
	}

	return path;
}
