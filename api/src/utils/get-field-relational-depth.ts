/**
 * Counts the number of relational segments in a field path. Handles function syntax
 * (e.g. json(), year()) by counting relational segments in the prefix and in the first argument
 * separately, while ignoring subsequent arguments (e.g. json paths).
 *
 * @example
 * getFieldRelationalDepth('a.b.c')                              // 3
 * getFieldRelationalDepth('year(user.date_created)')            // 2
 * getFieldRelationalDepth('category_id.json(metadata, a.b.c)') // 2
 * getFieldRelationalDepth('json(a.b.field, some.path)')         // 3
 * getFieldRelationalDepth('json(metadata, path.to.value)')      // 1
 */
export function getFieldRelationalDepth(field: string): number {
	const openParenIndex = field.indexOf('(');

	if (openParenIndex === -1) {
		return field.split('.').length;
	}

	const functionDepth = field.slice(0, openParenIndex).split('.').length - 1;
	const commaIndex = field.indexOf(',', openParenIndex);

	const fieldDepth = field.slice(openParenIndex, commaIndex).split('.').length;
	return functionDepth + fieldDepth;
}
