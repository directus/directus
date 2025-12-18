import type { Field } from '@directus/types';

export function updateSystemDivider(fields: Field[], isFieldVisible = (field: Field) => field.meta?.hidden !== true) {
	let hasVisibleSystemFields = false;
	let hasVisibleUserFields = false;
	let systemDivider;

	for (const field of fields) {
		if (field.field === '$system_divider') {
			systemDivider = field;
			continue;
		}

		if (!isFieldVisible(field)) continue;

		if (field.meta?.system) {
			hasVisibleSystemFields = true;
		} else {
			hasVisibleUserFields = true;
			// All system fields processed at this point, due to order
			break;
		}
	}

	if (systemDivider?.meta) systemDivider.meta.hidden = !hasVisibleSystemFields || !hasVisibleUserFields;
}
