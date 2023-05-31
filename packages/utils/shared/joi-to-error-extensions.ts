import type { FailedValidationErrorExtensions } from '@directus/errors';
import type { ValidationErrorItem } from 'joi';

export const joiValidationErrorItemToErrorExtensions = (
	validationErrorItem: ValidationErrorItem
): FailedValidationErrorExtensions => {
	const extensions: Partial<FailedValidationErrorExtensions> = {
		field: validationErrorItem.path[0] as string,
	};

	const joiType = validationErrorItem.type;

	// eq | in | null | empty
	if (joiType.endsWith('only')) {
		if (validationErrorItem.context?.['valids'].length > 1) {
			extensions.type = 'in';
			extensions.valid = validationErrorItem.context?.['valids'];
		} else {
			const valid = validationErrorItem.context?.['valids'][0];

			if (valid === null) {
				extensions.type = 'null';
			} else if (valid === '') {
				extensions.type = 'empty';
			} else {
				extensions.type = 'eq';
				extensions.valid = validationErrorItem.context?.['valids'][0];
			}
		}
	}

	// neq | nin | nnull | nempty
	if (joiType.endsWith('invalid')) {
		if (validationErrorItem.context?.['invalids'].length > 1) {
			extensions.type = 'nin';
			extensions.invalid = validationErrorItem.context?.['invalids'];
		} else {
			const invalid = validationErrorItem.context?.['invalids'][0];

			if (invalid === null) {
				extensions.type = 'nnull';
			} else if (invalid === '') {
				extensions.type = 'nempty';
			} else {
				extensions.type = 'neq';
				extensions.invalid = invalid;
			}
		}
	}

	// gt
	if (joiType.endsWith('greater')) {
		extensions.type = 'gt';
		extensions.valid = validationErrorItem.context?.['limit'];
	}

	// gte
	if (joiType.endsWith('min')) {
		extensions.type = 'gte';
		extensions.valid = validationErrorItem.context?.['limit'];
	}

	// lt
	if (joiType.endsWith('less')) {
		extensions.type = 'lt';
		extensions.valid = validationErrorItem.context?.['limit'];
	}

	// lte
	if (joiType.endsWith('max')) {
		extensions.type = 'lte';
		extensions.valid = validationErrorItem.context?.['limit'];
	}

	// contains
	if (joiType.endsWith('contains')) {
		extensions.type = 'contains';
		extensions.substring = validationErrorItem.context?.['substring'];
	}

	// ncontains
	if (joiType.endsWith('ncontains')) {
		extensions.type = 'ncontains';
		extensions.substring = validationErrorItem.context?.['substring'];
	}

	// required
	if (joiType.endsWith('required')) {
		extensions.type = 'required';
	}

	if (joiType.endsWith('.pattern.base')) {
		extensions.type = 'regex';
		extensions.invalid = validationErrorItem.context?.value;
	}

	if (!extensions.type) {
		throw new Error(`Couldn't extract validation error type from Joi validation error item`);
	}

	return extensions as FailedValidationErrorExtensions;
};
