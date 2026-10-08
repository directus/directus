import type { Field } from '@directus/types';
import {
	isDateCreated,
	isDateUpdated,
	isHidden,
	isRelational,
	isUserCreated,
	isUserUpdated,
} from '@/utils/field-utils';

function isHiddenSystemField(field: Field) {
	if (!isHidden(field)) return false;
	return isDateCreated(field) || isDateUpdated(field) || isUserCreated(field) || isUserUpdated(field);
}

/**
 * The fields a revision's delta changed. Relational fields are kept here, unlike in
 * `getRevisionFields`: the delta holds a new value for the ones stored on the item itself (m2o and
 * file), so leaving them out reports an edit to a relation as no change at all.
 */
export function getRevisionDeltaFields(revisionFields: string[], fields: Field[]) {
	return revisionFields.filter((fieldKey) => {
		const field = fields.find((field) => field.field === fieldKey);
		if (!field) return false;

		return !isHiddenSystemField(field);
	});
}

export function getRevisionFields(revisionFields: string[], fields: Field[]) {
	const filteredFields = revisionFields.filter((fieldKey) => {
		const field = fields.find((field) => field.field === fieldKey);
		if (!field) return false;

		if (isHiddenSystemField(field)) return false;

		if (isRelational(field)) return false;

		return true;
	});

	const specialFields = fields
		.filter((field) => !filteredFields.includes(field.field))
		.filter((field) => !isHidden(field) && (isDateCreated(field) || isUserCreated(field)))
		.map((field) => field.field);

	return [...filteredFields, ...specialFields];
}
