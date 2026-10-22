import type { core, ZodError } from 'zod';

const MAX_ISSUES = 99;

// Keys that can be written in dot notation (Unicode letters, digits, `_` and `$`, not starting with a digit)
const IDENTIFIER = /^[\p{L}_$][\p{L}\p{N}_$]*$/u;

const formatPath = (path: PropertyKey[]): string =>
	path.reduce<string>((result, segment) => {
		if (typeof segment === 'number') return `${result}[${segment}]`;
		if (typeof segment === 'symbol') return `${result}[${segment.toString()}]`;
		if (IDENTIFIER.test(segment)) return result ? `${result}.${segment}` : segment;
		return `${result}[${JSON.stringify(segment)}]`;
	}, '');

const formatIssue = (issue: core.$ZodIssue, parentPath: PropertyKey[]): string => {
	const path = [...parentPath, ...(issue.path ?? [])];

	// List what each union branch expected instead of a bare "Invalid input"
	if (issue.code === 'invalid_union' && issue.errors.length > 0) {
		return issue.errors
			.map((branch) => {
				const formatted = branch.map((branchIssue) => formatIssue(branchIssue, path));
				return formatted.length > 1 ? `(${formatted.join('; ')})` : formatted.join('');
			})
			.join(' or ');
	}

	return path.length > 0 ? `${issue.message} at "${formatPath(path)}"` : issue.message;
};

/**
 * Format the issues of a Zod error into a single human readable line,
 * e.g. `Invalid input: expected string, received number at "profile.name"; Invalid input: expected string, received boolean at "tags[1]"`
 */
export const formatZodError = (error: ZodError): string => {
	const { issues } = error;

	if (issues.length === 0) return 'Invalid input';

	const formatted = issues.slice(0, MAX_ISSUES).map((issue) => formatIssue(issue, []));

	if (issues.length > MAX_ISSUES) formatted.push(`and ${issues.length - MAX_ISSUES} more issues`);

	return formatted.join('; ');
};
