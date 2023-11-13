import type { ClientFilterOperator } from '@directus/types';
import { getFilterOperatorsForType } from '@directus/utils';
import type { FilterEmptyValidator, FilterValidator } from '@query/filter';
import type { GeneratedFilter } from '..';

export const type = 'bigInteger';
export const filterOperatorList = getFilterOperatorsForType(type);

export const generateFilterForDataType = (filter: ClientFilterOperator, possibleValues: any): GeneratedFilter[] => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
		case 'eq':
		case 'neq':
		case 'lt':
		case 'lte':
		case 'gt':
		case 'gte':
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
		case 'between':
		case 'nbetween':
			if (Array.isArray(possibleValues)) {
				// Check if other values outside of the range can be filtered
				const sortedPossibleValues = [...possibleValues].sort();
				const middleIndex = Math.floor(sortedPossibleValues.length / 2);

				return [
					{
						operator: filter,
						value: [sortedPossibleValues[0], sortedPossibleValues[middleIndex]],
						filter: {
							[`_${filter}`]: [sortedPossibleValues[0], sortedPossibleValues[middleIndex]],
						},
						validatorFunction: getValidatorFunction(filter),
						emptyAllowedFunction: getEmptyAllowedFunction(filter),
					},
				];
			}

			return [
				{
					operator: filter,
					value: [possibleValues, possibleValues],
					filter: {
						[`_${filter}`]: [possibleValues, possibleValues],
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
		case 'lt':
			return _lt;
		case 'lte':
			return _lte;
		case 'gt':
			return _gt;
		case 'gte':
			return _gte;
		case 'between':
			return _between;
		case 'nbetween':
			return _nbetween;
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
	if (BigInt(inputValue) === possibleValues) {
		return true;
	}

	return false;
};

const _neq = (inputValue: any, possibleValues: any): boolean => {
	if (BigInt(inputValue) !== possibleValues) {
		return true;
	}

	return false;
};

const _lt = (inputValue: any, possibleValues: any): boolean => {
	if (BigInt(inputValue) < possibleValues) {
		return true;
	}

	return false;
};

const _lte = (inputValue: any, possibleValues: any): boolean => {
	if (BigInt(inputValue) <= possibleValues) {
		return true;
	}

	return false;
};

const _gt = (inputValue: any, possibleValues: any): boolean => {
	if (BigInt(inputValue) > possibleValues) {
		return true;
	}

	return false;
};

const _gte = (inputValue: any, possibleValues: any): boolean => {
	if (BigInt(inputValue) >= possibleValues) {
		return true;
	}

	return false;
};

const _between = (inputValue: any, possibleValues: any): boolean => {
	if (BigInt(inputValue) >= possibleValues[0] && BigInt(inputValue) <= possibleValues[1]) {
		return true;
	}

	return false;
};

const _nbetween = (inputValue: any, possibleValues: any): boolean => {
	if (BigInt(inputValue) < possibleValues[0] || BigInt(inputValue) > possibleValues[1]) {
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

const _in = (inputValue: any, possibleValues: any): boolean => {
	if (possibleValues.includes(BigInt(inputValue))) {
		return true;
	}

	return false;
};

const _nin = (inputValue: any, possibleValues: any): boolean => {
	if (!possibleValues.includes(BigInt(inputValue))) {
		return true;
	}

	return false;
};

export const getEmptyAllowedFunction = (filter: ClientFilterOperator): FilterEmptyValidator => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
		case 'lt':
			return empty_lt;
		case 'gt':
			return empty_gt;
		case 'nbetween':
			return empty_nbetween;
		default:
			return empty_invalid;
	}
};

const empty_invalid = (_inputValue: any, _possibleValues: any): boolean => {
	return false;
};

const empty_lt = (inputValue: any, possibleValues: any): boolean => {
	if (Array.isArray(possibleValues)) {
		for (const value of possibleValues) {
			if (value < BigInt(inputValue)) {
				return false;
			}
		}

		return true;
	} else {
		return BigInt(inputValue) >= possibleValues;
	}
};

const empty_gt = (inputValue: any, possibleValues: any): boolean => {
	if (Array.isArray(possibleValues)) {
		for (const value of possibleValues) {
			if (value > BigInt(inputValue)) {
				return false;
			}
		}

		return true;
	} else {
		return BigInt(inputValue) <= possibleValues;
	}
};

const empty_nbetween = (inputValue: any, possibleValues: any): boolean => {
	if (Array.isArray(possibleValues)) {
		for (const value of possibleValues) {
			if (value < BigInt(inputValue[0]) || value > BigInt(inputValue[1])) {
				return false;
			}
		}

		return true;
	} else {
		return BigInt(inputValue[0]) >= possibleValues && BigInt(inputValue[1]) <= possibleValues;
	}
};
