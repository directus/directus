import { getFilterOperatorsForType } from '@directus/shared/utils';
import { ClientFilterOperator } from '@directus/shared/types';
import { FilterValidator } from '@query/filter';
import { GeneratedFilter } from '..';

export const type = 'json';
export const filterOperatorList = getFilterOperatorsForType(type);

export const generateFilterForDataType = (filter: ClientFilterOperator, _possibleValues: any): GeneratedFilter[] => {
	if (!filterOperatorList.includes(filter)) {
		throw new Error(`Invalid filter operator for ${type}: ${filter}`);
	}

	switch (filter) {
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
		case 'null':
			return _null;
		case 'nnull':
			return _nnull;
		default:
			throw new Error(`Unimplemented filter operator for ${type}: ${filter}`);
	}
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
