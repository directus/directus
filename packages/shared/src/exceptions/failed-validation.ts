import { ValidationErrorItem } from 'joi';
import { FilterOperator } from '../types';
import { BaseException } from './base';

type FailedValidationExtensions = {
	field: string;
	type: FilterOperator | 'required' | 'regex';
	valid?: number | string | (number | string)[];
	invalid?: number | string | (number | string)[];
	substring?: string;
};

export class FailedValidationException extends BaseException {
	constructor(error: ValidationErrorItem) {
		const extensions: Partial<FailedValidationExtensions> = {
			field: error.path[0] as string,
		};

		const joiType = error.type;

		// eq | in | null | empty
		if (joiType.endsWith('only')) {
			if (error.context?.valids.length > 1) {
				extensions.type = 'in';
				extensions.valid = error.context?.valids;
			} else {
				const valid = error.context?.valids[0];

				if (valid === null) {
					extensions.type = 'null';
				} else if (valid === '') {
					extensions.type = 'empty';
				} else {
					extensions.type = 'eq';
					extensions.valid = error.context?.valids[0];
				}
			}
		}

		// neq | nin | nnull | nempty
		if (joiType.endsWith('invalid')) {
			if (error.context?.invalids.length > 1) {
				extensions.type = 'nin';
				extensions.invalid = error.context?.invalids;
			} else {
				const invalid = error.context?.invalids[0];

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
			extensions.valid = error.context?.limit;
		}

		// gte
		if (joiType.endsWith('min')) {
			extensions.type = 'gte';
			extensions.valid = error.context?.limit;
		}

		// lt
		if (joiType.endsWith('less')) {
			extensions.type = 'lt';
			extensions.valid = error.context?.limit;
		}

		// lte
		if (joiType.endsWith('max')) {
			extensions.type = 'lte';
			extensions.valid = error.context?.limit;
		}

		// contains
		if (joiType.endsWith('contains')) {
			extensions.type = 'contains';
			extensions.substring = error.context?.substring;
		}

		// ncontains
		if (joiType.endsWith('ncontains')) {
			extensions.type = 'ncontains';
			extensions.substring = error.context?.substring;
		}

		// required
		if (joiType.endsWith('required')) {
			extensions.type = 'required';
		}

		if (joiType.endsWith('.pattern.base')) {
			extensions.type = 'regex';
			extensions.invalid = error.context?.value;
		}

		super(error.message, 400, 'FAILED_VALIDATION', extensions);
	}
}
