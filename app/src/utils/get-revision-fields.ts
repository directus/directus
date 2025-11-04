import {
	isDateCreated,
	isDateUpdated,
	isHidden,
	isRelational,
	isUserCreated,
	isUserUpdated,
} from '@/utils/field-utils';
import type { Field } from '@directus/types';

export function getRevisionFields(revisionFields: string[], fields: Field[]) {
	const filteredFields = revisionFields.filter((fieldKey) => {
		const field = fields.find((field) => field.field === fieldKey);
		if (!field) return false;

		if (isHidden(field) && isDateCreated(field)) return false;
		if (isHidden(field) && isDateUpdated(field)) return false;
		if (isHidden(field) && isUserCreated(field)) return false;
		if (isHidden(field) && isUserUpdated(field)) return false;

		if (isRelational(field)) return false;

		return true;
	});

	const specialFields = fields
		.filter((field) => !filteredFields.includes(field.field))
		.filter((field) => !isHidden(field) && (isDateCreated(field) || isUserCreated(field)))
		.map((field) => field.field);

	return [...filteredFields, ...specialFields];
}
