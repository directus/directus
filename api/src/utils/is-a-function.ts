/**
 * Checks if a string looks like a (simple) function like do_something().
 *
 * Since this functions decides if a user specified value is going to be escaped or not in the SQL query, this utility is very strict and doesn't allow much.
 * Parameters are not allowed to not deal with escape characters.
 * The function name must start with a letter, afterwards numbers and underscores are also allowed.
 * Special characters and white spaces are not allowed.
 */
export function valueIsAFunction(value: string): boolean {
	const regex = /^([a-zA-Z][a-zA-Z0-9_]*)\(\)$/g;

	return regex.test(value);
}
