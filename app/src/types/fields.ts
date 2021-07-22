import { FilterOperator } from '@directus/shared/types';

export type ValidationError = {
	code: string;
	field: string;
	type: FilterOperator;
	valid?: number | string | (number | string)[];
	invalid?: number | string | (number | string)[];
	substring?: string;
};
