import type { ClientFilterOperator } from '@directus/types';
import { getFilterOperatorsForType } from '@directus/utils';
import type { FilterEmptyValidator, FilterValidator } from '@query/filter';
import type { GeneratedFilter } from '..';

export const type = 'string';
export const filterOperatorList = getFilterOperatorsForType(type);

export const generateFilterForDataType = (filter: ClientFilterOperator, possibleValues: any): GeneratedFilter[] => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
		case 'contains':
		case 'icontains':
		case 'ncontains':
		case 'starts_with':
		case 'istarts_with':
		case 'nstarts_with':
		case 'nistarts_with':
		case 'ends_with':
		case 'iends_with':
		case 'nends_with':
		case 'niends_with':
		case 'eq':
		case 'neq':
			if (Array.isArray(possibleValues)) {
				return possibleValues.map((value) => {
					return {
						operator: filter,
						value: value,
						filter: {
							[`_${filter}`]: value,
						},
						validatorFunction: getValidatorFunction(filter),
						emptyAllowedFunction: getEmptyAllowedFunction(filter),
					};
				});
			}

			return [
				{
					operator: filter,
					value: possibleValues,
					filter: {
						[`_${filter}`]: possibleValues,
					},
					validatorFunction: getValidatorFunction(filter),
					emptyAllowedFunction: getEmptyAllowedFunction(filter),
				},
			];
		case 'empty':
		case 'nempty':
		case 'null':
		case 'nnull':
			return [
				{
					operator: filter,
					value: true,
					filter: {
						[`_${filter}`]: true,
					},
					validatorFunction: getValidatorFunction(filter),
					emptyAllowedFunction: getEmptyAllowedFunction(filter),
				},
			];
		case 'in':
		case 'nin':
			if (Array.isArray(possibleValues)) {
				// Check if other values outside of the range can be filtered
				const middleIndex = Math.floor(possibleValues.length / 2);
				const partialPossibleValues = possibleValues.slice(0, middleIndex);

				return [
					{
						operator: filter,
						value: partialPossibleValues,
						filter: {
							[`_${filter}`]: partialPossibleValues,
						},
						validatorFunction: getValidatorFunction(filter),
						emptyAllowedFunction: getEmptyAllowedFunction(filter),
					},
				];
			}

			return [
				{
					operator: filter,
					value: [possibleValues],
					filter: {
						[`_${filter}`]: [possibleValues],
					},
					validatorFunction: getValidatorFunction(filter),
					emptyAllowedFunction: getEmptyAllowedFunction(filter),
				},
			];
		default:
			throw new Error(`Unimplemented filter operator for ${type}: ${filter}`);
	}
};

export const getValidatorFunction = (filter: ClientFilterOperator): FilterValidator => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
		case 'contains':
			return _contains;
		case 'ncontains':
			return _ncontains;
		case 'icontains':
			return _icontains;
		case 'starts_with':
			return _starts_with;
		case 'istarts_with':
			return _istarts_with;
		case 'nstarts_with':
			return _nstarts_with;
		case 'nistarts_with':
			return _nistarts_with;
		case 'ends_with':
			return _ends_with;
		case 'iends_with':
			return _iends_with;
		case 'nends_with':
			return _nends_with;
		case 'niends_with':
			return _niends_with;
		case 'eq':
			return _eq;
		case 'neq':
			return _neq;
		case 'empty':
			return _empty;
		case 'nempty':
			return _nempty;
		case 'null':
			return _null;
		case 'nnull':
			return _nnull;
		case 'in':
			return _in;
		case 'nin':
			return _nin;
		default:
			throw new Error(`Unimplemented filter operator for ${type}: ${filter}`);
	}
};

const _contains = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue.includes(possibleValues)) {
		return true;
	}

	return false;
};

const _ncontains = (inputValue: any, possibleValues: any): boolean => {
	if (!inputValue.includes(possibleValues)) {
		return true;
	}

	return false;
};

const _icontains = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue.toLowerCase().includes(possibleValues.toLowerCase())) {
		return true;
	}

	return false;
};

const _starts_with = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue.startsWith(possibleValues)) {
		return true;
	}

	return false;
};

const _istarts_with = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue.toLowerCase().startsWith(possibleValues.toLowerCase())) {
		return true;
	}

	return false;
};

const _nstarts_with = (inputValue: any, possibleValues: any): boolean => {
	if (!inputValue.startsWith(possibleValues)) {
		return true;
	}

	return false;
};

const _nistarts_with = (inputValue: any, possibleValues: any): boolean => {
	if (!inputValue.toLowerCase().startsWith(possibleValues.toLowerCase())) {
		return true;
	}

	return false;
};

const _ends_with = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue.endsWith(possibleValues)) {
		return true;
	}

	return false;
};

const _iends_with = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue.toLowerCase().endsWith(possibleValues.toLowerCase())) {
		return true;
	}

	return false;
};

const _nends_with = (inputValue: any, possibleValues: any): boolean => {
	if (!inputValue.endsWith(possibleValues)) {
		return true;
	}

	return false;
};

const _niends_with = (inputValue: any, possibleValues: any): boolean => {
	if (!inputValue.toLowerCase().endsWith(possibleValues.toLowerCase())) {
		return true;
	}

	return false;
};

const _eq = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue === possibleValues) {
		return true;
	}

	return false;
};

const _neq = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue !== possibleValues) {
		return true;
	}

	return false;
};

const _empty = (inputValue: any, _possibleValues: any): boolean => {
	if (inputValue === '') {
		return true;
	}

	return _null(inputValue, _possibleValues);
};

const _nempty = (inputValue: any, _possibleValues: any): boolean => {
	if (inputValue !== '') {
		return true;
	}

	return _nnull(inputValue, _possibleValues);
};

const _null = (inputValue: any, _possibleValues: any): boolean => {
	if (inputValue === undefined || inputValue === null) {
		return true;
	}

	return false;
};

const _nnull = (inputValue: any, _possibleValues: any): boolean => {
	if (inputValue !== undefined && inputValue !== null) {
		return true;
	}

	return false;
};

const _in = (inputValue: any, possibleValues: any): boolean => {
	if (possibleValues.includes(inputValue)) {
		return true;
	}

	return false;
};

const _nin = (inputValue: any, possibleValues: any): boolean => {
	if (!possibleValues.includes(inputValue)) {
		return true;
	}

	return false;
};

export const getEmptyAllowedFunction = (filter: ClientFilterOperator): FilterEmptyValidator => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
		case 'empty':
			return empty_empty;
		case 'null':
			return empty_null;
		default:
			return empty_invalid;
	}
};

const empty_invalid = (_inputValue: any, _possibleValues: any): boolean => {
	return false;
};

const empty_empty = (_inputValue: any, possibleValues: any): boolean => {
	if (Array.isArray(possibleValues)) {
		for (const value of possibleValues) {
			if (value === '') {
				return false;
			}
		}

		return true;
	} else {
		return possibleValues !== '';
	}
};

const empty_null = (_inputValue: any, possibleValues: any): boolean => {
	if (Array.isArray(possibleValues)) {
		for (const value of possibleValues) {
			if (value === null) {
				return false;
			}
		}

		return true;
	} else {
		return possibleValues !== null;
	}
};
