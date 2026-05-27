import { i18n } from '@/lang';
import { useFieldsStore } from '@/stores/fields';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';

/**
 * Renders a function-wrapped field as the formatted function name and translated field key
 *
 * @param collection - Name of the collection the field lives in
 * @param fieldKey - Key of the field to format (including function)
 *
 * @example
 * ```js
 * formatFieldFunction('articles', 'year(date_created)');
 * // => "Year (Date Created)"
 * ```
 */
export function formatFieldFunction(collection: string, fieldKey: string) {
	const { field, fn } = extractFieldFromFunction(fieldKey);

	const fieldName = useFieldsStore().getField(collection, field)?.name ?? field;

	if (fn) {
		return i18n.global.t(`functions.${fn}`) + ` (${fieldName})`;
	}

	return fieldName;
}
