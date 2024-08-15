/**
 * Checks if a string looks like a function call.
 *
 * It basically returns true, if the string
 * -  starts with a word character or an underscore
 * -  followed by zero or more word characters, digits or underscores
 * -  followed by an opening parenthesis
 * -  followed by zero or more characters that are not a closing parenthesis or an opening parenthesis for nested function calls
 * -  followed by a closing parenthesis
 *
 * Spaces are also allowed between the function name and the opening parenthesis, as well as between the closing parenthesis and the arguments.
 */
export function valueIsAFunction(value: string): boolean {
	const regex =
		/(?:^|\s)([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*(?:[^)(;"'\\]*(?:(?:"(?:[^"\\]*|\\.)*"|'(?:[^'\\]*|\\.)*')[^)(;"'\\]*)*|\((?:[^)(;"'\\]*(?:(?:"(?:[^"\\]*|\\.)*"|'(?:[^'\\]*|\\.)*')[^)(;"'\\]*)*|\([^)(;"'\\]*(?:(?:"(?:[^"\\]*|\\.)*"|'(?:[^'\\]*|\\.)*')[^)(;"'\\]*)*\))*\))*\s*\)\s*$/g;

	return regex.test(value);
}
