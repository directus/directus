import { createError, type DirectusErrorConstructor } from '@directus/errors';
import type { ClientFilterOperator } from '@directus/types';
import { toArray } from '@directus/utils';

export type ImportRowLines = {
	type: 'lines';
	rows: number[];
};

export type ImportRowRange = {
	type: 'range';
	start: number;
	end: number;
};

export interface FailedValidationErrorExtensions {
	field: string;
	path: (string | number)[];
	type: ClientFilterOperator | 'required' | 'email';
	valid?: number | string | (number | string)[];
	invalid?: number | string | (number | string)[];
	substring?: string;
	rows?: (ImportRowLines | ImportRowRange)[];
}

export const messageConstructor = (extensions: FailedValidationErrorExtensions): string => {
	const atPath = extensions.path.length > 0 ? ` at "${extensions.path.join('.')}"` : '';
	let message = `Validation failed for field "${extensions.field}"${atPath}.`;

	if ('valid' in extensions) {
		switch (extensions.type) {
			case 'eq':
				message += ` Value has to be "${extensions.valid}".`;
				break;
			case 'lt':
				message += ` Value has to be less than "${extensions.valid}".`;
				break;
			case 'lte':
				message += ` Value has to be less than or equal to "${extensions.valid}".`;
				break;
			case 'gt':
				message += ` Value has to be greater than "${extensions.valid}".`;
				break;
			case 'gte':
				message += ` Value has to be greater than or equal to "${extensions.valid}".`;
				break;
			case 'in':
				message += ` Value has to be one of ${toArray(extensions.valid)
					.map((val) => `"${val}"`)
					.join(', ')}.`;

				break;
		}
	}

	if ('invalid' in extensions) {
		switch (extensions.type) {
			case 'neq':
				message += ` Value can't be "${extensions.invalid}".`;
				break;
			case 'nin':
				message += ` Value can't be one of ${toArray(extensions.invalid)
					.map((val) => `"${val}"`)
					.join(', ')}.`;

				break;
		}
	}

	if ('substring' in extensions) {
		switch (extensions.type) {
			case 'contains':
			case 'icontains':
				message += ` Value has to contain "${extensions.substring}".`;
				break;
			case 'ncontains':
				message += ` Value can't contain "${extensions.substring}".`;
				break;
		}
	}

	switch (extensions.type) {
		case 'null':
			message += ` Value has to be null.`;
			break;
		case 'nnull':
			message += ` Value can't be null.`;
			break;
		case 'empty':
			message += ` Value has to be empty.`;
			break;
		case 'nempty':
			message += ` Value can't be empty.`;
			break;
		case 'required':
			message += ` Value is required.`;
			break;
		case 'regex':
			message += ` Value doesn't have the correct format.`;
			break;
		case 'email':
			message += ` Value has to be a valid email address.`;
			break;
	}

	return message;
};

export const FailedValidationError: DirectusErrorConstructor<FailedValidationErrorExtensions> =
	createError<FailedValidationErrorExtensions>('FAILED_VALIDATION', messageConstructor, 400);
