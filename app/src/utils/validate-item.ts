import { FailedValidationException } from '@directus/shared/exceptions';
import { Field, LogicalFilterAND } from '@directus/shared/types';
import { validatePayload } from '@directus/shared/utils';
import { flatten, isNil } from 'lodash';
import { applyConditions } from './apply-conditions';

export function validateItem(item: Record<string, any>, fields: Field[], isNew: boolean) {
	const validationRules = {
		_and: [],
	} as LogicalFilterAND;

	const fieldsWithConditions = fields.map((field) => applyConditions(item, field));

	const requiredFields = fieldsWithConditions.filter((field) => field.meta?.required === true);

	for (const field of requiredFields) {
		if (isNew && isNil(field.schema?.default_value)) {
			validationRules._and.push({
				[field.field]: {
					_submitted: true,
				},
			});
		}

		validationRules._and.push({
			[field.field]: {
				_nnull: true,
			},
		});
	}

	return flatten(
		validatePayload(validationRules, item).map((error) =>
			error.details.map((details) => new FailedValidationException(details).extensions)
		)
	).map((error) => {
		const errorField = fields.find((field) => field.field === error.field);
		return { ...error, hidden: errorField?.meta?.hidden, group: errorField?.meta?.group };
	});
}
