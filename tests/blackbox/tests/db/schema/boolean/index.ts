import type { GeneratedFilter } from '..';
import type { FilterEmptyValidator, FilterValidator } from '../../query/filter';
import type { ClientFilterOperator } from '@directus/types';
import { getFilterOperatorsForType } from '@directus/utils';

export const type = 'boolean';
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
		default:
			throw new Error(`Unimplemented filter operator for ${type}: ${filter}`);
	}
};

const _eq = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue === true || inputValue === 1 || inputValue === '1') {
		return possibleValues === true;
	} else if (inputValue === false || inputValue === 0 || inputValue === '0') {
		return possibleValues === false;
	}

	return false;
};

const _neq = (inputValue: any, possibleValues: any): boolean => {
	if (inputValue !== possibleValues) {
		return true;
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

export const getEmptyAllowedFunction = (filter: ClientFilterOperator): FilterEmptyValidator => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
		default:
			return empty_invalid;
	}
};

const empty_invalid = (_inputValue: any, _possibleValues: any): boolean => {
	return false;
};
