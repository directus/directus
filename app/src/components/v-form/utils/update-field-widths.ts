import { Field } from '@directus/types';
import { orderBy } from 'lodash';

export function updateFieldWidths(fields: Field[]) {
	const sortedFields = orderBy(
		fields,
		[(field) => !!field.meta?.system, 'meta.group', 'meta.sort', 'meta.id'],
		['desc', 'desc', 'asc', 'asc'],
	);

	for (const [index, field] of sortedFields.entries()) {
		if (index !== 0 && field.meta?.width === 'half' && field.meta.hidden !== true) {
			let prevNonHiddenField;

			for (const formField of sortedFields) {
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
