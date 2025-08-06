import type { ClientFilterOperator } from '@directus/types';
import { getFilterOperatorsForType } from '@directus/utils';
import type { FilterEmptyValidator, FilterValidator } from '../../query/filter';
import type { GeneratedFilter } from '..';

export const type = 'uuid';
export const filterOperatorList = getFilterOperatorsForType(type);

export const generateFilterForDataType = (filter: ClientFilterOperator, possibleValues: any): GeneratedFilter[] => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
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
		case 'eq':
			return _eq;
		case 'neq':
			return _neq;
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

const _eq = (inputValue: any, possibleValues: any): boolean => {
	if (typeof inputValue === 'string') {
		const value = inputValue.toLowerCase();

		if (value === possibleValues.toLowerCase()) {
			return true;
		}
	}

	return false;
};

const _neq = (inputValue: any, possibleValues: any): boolean => {
	if (typeof inputValue === 'string') {
		const value = inputValue.toLowerCase();

		if (value !== possibleValues.toLowerCase()) {
			return true;
		}
	}

	return false;
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
	if (typeof inputValue === 'string') {
		const compareValue = inputValue.toLowerCase();

		for (const value of possibleValues) {
			if (value.toLowerCase() === compareValue) {
				return true;
			}
		}
	}

	return false;
};

const _nin = (inputValue: any, possibleValues: any): boolean => {
	if (typeof inputValue === 'string') {
		const compareValue = inputValue.toLowerCase();

		for (const value of possibleValues) {
			if (value.toLowerCase() === compareValue) {
				return false;
			}
		}
	}

	return true;
};

export const getEmptyAllowedFunction = (filter: ClientFilterOperator): FilterEmptyValidator => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
		case 'null':
			return empty_null;
		default:
			return empty_invalid;
	}
};

const empty_invalid = (_inputValue: any, _possibleValues: any): boolean => {
	return false;
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
