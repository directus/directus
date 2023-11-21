import { useRelationsStore } from '@/stores/relations';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
import { Field, LogicalFilterAND } from '@directus/types';
import { validatePayload } from '@directus/utils';
import { cloneDeep, flatten, isEmpty, isNil } from 'lodash';
import { applyConditions } from './apply-conditions';

export function validateItem(item: Record<string, any>, fields: Field[], isNew: boolean) {
	const relationsStore = useRelationsStore();

	const validationRules = {
		_and: [],
	} as LogicalFilterAND;

	const fieldsWithConditions = fields.map((field) => applyConditions(item, field));

	const requiredFields = fieldsWithConditions.filter((field) => field.meta?.required === true);

	const updatedItem = cloneDeep(item);

	for (const field of requiredFields) {
		if (isNew && isNil(field.schema?.default_value)) {
			validationRules._and.push({
				[field.field]: {
					_submitted: true,
				},
			});
		}

		const relation = relationsStore.getRelationsForField(field.collection, field.field);

		// Check if we are dealing with a relational field that has an empty array as its value
		if (relation.length > 0 && Array.isArray(updatedItem[field.field]) && isEmpty(updatedItem[field.field])) {
			updatedItem[field.field] = null;
		}

		validationRules._and.push({
			[field.field]: {
				_nnull: true,
			},
		});
	}

	return flatten(
		validatePayload(validationRules, updatedItem).map((error) =>
			error.details.map(
				(details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details)).extensions,
			),
		),
	).map((error) => {
		const errorField = fields.find((field) => field.field === error.field);
		return { ...error, hidden: errorField?.meta?.hidden, group: errorField?.meta?.group };
	});
}
