import { useFieldsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';

export function formatFieldFunction(collection: string, fieldKey: string) {
	const { t } = useI18n();

	const { field, fn } = extractFieldFromFunction(fieldKey);

	const fieldName = useFieldsStore().getField(collection, field)?.name ?? field;

	if (fn) {
		return t(`functions.${fn}`) + ` (${fieldName})`;
	}

	return fieldName;
}
