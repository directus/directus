import { Field } from '@directus/types';

export function updateFieldWidths(fields: Field[], isFieldVisible = (field: Field) => field.meta?.hidden !== true) {
	for (const [index, field] of fields.entries()) {
		if (index !== 0 && field.meta?.width === 'half' && isFieldVisible(field)) {
			let prevNonHiddenField;

			for (const formField of fields) {
				if (formField.meta?.group !== field.meta?.group) continue;
				if (!isFieldVisible(formField)) continue;
				if (formField === field) break;
				prevNonHiddenField = formField;
			}

			if (prevNonHiddenField?.meta?.width === 'half') {
				field.meta.width = 'half-right';
			}
		}
	}
}
