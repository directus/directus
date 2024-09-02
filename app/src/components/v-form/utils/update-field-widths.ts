import { Field } from '@directus/types';

export function updateFieldWidths(fields: Field[]) {
	for (const [index, field] of fields.entries()) {
		if (index !== 0 && field.meta?.width === 'half' && field.meta.hidden !== true) {
			let prevNonHiddenField;

			for (const formField of fields) {
				if (formField.meta?.group !== field.meta?.group || formField.meta?.hidden) continue;
				if (formField === field) break;
				prevNonHiddenField = formField;
			}

			if (prevNonHiddenField?.meta?.width === 'half') {
				field.meta.width = 'half-right';
			}
		}
	}
}
