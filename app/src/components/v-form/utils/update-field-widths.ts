import { Field } from '@directus/types';

export function updateFieldWidths(fields: Field[], comparisonFields?: Set<string>) {
	for (const [index, field] of fields.entries()) {
		const isVisible = !field.meta?.hidden || (comparisonFields && comparisonFields.has(field.field));

		if (index !== 0 && field.meta?.width === 'half' && isVisible) {
			let prevNonHiddenField;

			for (const formField of fields) {
				if (formField.meta?.group !== field.meta?.group) continue;

				const isPrevFieldVisible =
					!formField.meta?.hidden || (comparisonFields && comparisonFields.has(formField.field));

				if (!isPrevFieldVisible) continue;
				if (formField === field) break;
				prevNonHiddenField = formField;
			}

			if (prevNonHiddenField?.meta?.width === 'half') {
				field.meta.width = 'half-right';
			}
		}
	}
}
