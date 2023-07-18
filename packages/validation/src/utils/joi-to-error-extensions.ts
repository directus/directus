import type { ValidationErrorItem } from 'joi';
import type { FailedValidationErrorExtensions } from '../errors/failed-validation.js';

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
				extensions.valid = valid;
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
	if (joiType.endsWith('required') || joiType.endsWith('.base')) {
		extensions.type = 'required';
	}

	if (joiType.endsWith('.pattern.base')) {
		extensions.type = 'regex';
		extensions.invalid = validationErrorItem.context?.value;
	}

	// TODO Find a better way of passing the expected value down to the client
	if (joiType.endsWith('.pattern.name') || joiType.endsWith('.pattern.invert.name')) {
		extensions.type = validationErrorItem.context?.['name'];
		const regex = validationErrorItem.context?.['regex']?.toString();

		switch (extensions.type) {
			case 'starts_with':
			case 'nstarts_with':
			case 'istarts_with':
			case 'nistarts_with':
				extensions.substring = regex.substring(2, regex.lastIndexOf('/') - 2);
				break;
			case 'ends_with':
			case 'nends_with':
			case 'iends_with':
			case 'niends_with':
				extensions.substring = regex.substring(3, regex.lastIndexOf('/') - 1);
				break;
		}
	}

	if (!extensions.type) {
		throw new Error(`Couldn't extract validation error type from Joi validation error item`);
	}

	return extensions as FailedValidationErrorExtensions;
};
