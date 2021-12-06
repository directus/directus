import { parseExpression } from '@directus/shared/utils/parse-expression';

export function parseColumn(string: string) {
	const { func, params } = parseExpression(string);
	return { func, column: params ?? string };
}
