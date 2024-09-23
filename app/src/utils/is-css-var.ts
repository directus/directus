export const isCssVar = (input: string): boolean =>
	(input.match(/\(/g)?.length || 0) === (input.match(/\)/g)?.length || 0) &&
	input.startsWith('var(') &&
	input.endsWith(')');
