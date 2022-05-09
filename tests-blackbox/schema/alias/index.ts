import { ClientFilterOperator } from '@directus/shared/types';
import { FilterValidator } from '@query/filter';
import { GeneratedFilter } from '..';

export const type = 'alias';
export const filterOperatorList: ClientFilterOperator[] = [];

export const generateFilterForDataType = (filter: ClientFilterOperator, _possibleValues: any): GeneratedFilter[] => {
	throw new Error(`Invalid filter operator for ${type}: ${filter}`);
};

export const getValidatorFunction = (filter: ClientFilterOperator): FilterValidator => {
	throw new Error(`Invalid filter operator for ${type}: ${filter}`);
};
