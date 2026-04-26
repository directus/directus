import type { ValidationErrorItem } from 'joi';
import type { FailedValidationErrorExtensions } from '../errors/failed-validation.js';

export const joiValidationErrorItemToErrorExtensions = (
	validationErrorItem: ValidationErrorItem,
	path?: string[],
): FailedValidationErrorExtensions => {
	const extensions: Partial<FailedValidationErrorExtensions> = {
		field: validationErrorItem.path[0] as string,
		path: [...(path ?? []), ...validationErrorItem.path.slice(1)],
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

	// ncontains (must be checked before contains since ncontains ends with contains)
	if (joiType.endsWith('ncontains')) {
		extensions.type = 'ncontains';
		extensions.substring = validationErrorItem.context?.['substring'];
	}

	// icontains (must be checked before contains since icontains ends with contains)
	if (joiType.endsWith('icontains')) {
		extensions.type = 'icontains';
		extensions.substring = validationErrorItem.context?.['substring'];
	}

	// contains (only plain contains, not icontains or ncontains)
	if (joiType.endsWith('contains') && !joiType.endsWith('icontains') && !joiType.endsWith('ncontains')) {
		extensions.type = 'contains';
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

	// number.unsafe fires when a value exceeds Number.MAX_SAFE_INTEGER. Map it to
	// a generic invalid type so validation callers receive a structured error instead
	// of an unhandled crash.
	if (joiType === 'number.unsafe') {
		extensions.type = 'neq';
		extensions.invalid = validationErrorItem.context?.['value'];
	}

	// alternatives.match fires when Joi.alternatives().try() exhausts every branch
	// (used by _nbetween, _contains, _icontains, _ncontains). Recursively extract
	// from the first sub-error so callers get a structured error rather than a crash.
	if (joiType === 'alternatives.match') {
		const details: ValidationErrorItem[][] | undefined = validationErrorItem.context?.['details'];
		const firstSubError = details?.[0]?.[0];

		if (firstSubError) {
			return joiValidationErrorItemToErrorExtensions(firstSubError, path);
		}
	}

	if (!extensions.type) {
		throw new Error(`Couldn't extract validation error type from Joi validation error item`);
	}

	return extensions as FailedValidationErrorExtensions;
};
