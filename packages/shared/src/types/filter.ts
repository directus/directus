export type FilterOperator =
	| 'eq'
	| 'neq'
	| 'lt'
	| 'lte'
	| 'gt'
	| 'gte'
	| 'in'
	| 'nin'
	| 'null'
	| 'nnull'
	| 'contains'
	| 'ncontains'
	| 'between'
	| 'nbetween'
	| 'empty'
	| 'nempty';

export type Filter = FieldFilter & {
	_and?: FieldFilter[];
	_or?: FieldFilter[];
};

export type FieldFilter = {
	[field: string]: FieldFilterOperator | FieldFilter;
};

export type FieldFilterOperator = {
	_eq?: string | number | boolean;
	_neq?: string | number | boolean;
	_lt?: string | number;
	_lte?: string | number;
	_gt?: string | number;
	_gte?: string | number;
	_in?: (string | number)[];
	_nin?: (string | number)[];
	_null?: boolean;
	_nnull?: boolean;
	_contains?: string;
	_ncontains?: string;
	_between?: (string | number)[];
	_nbetween?: (string | number)[];
	_empty?: boolean;
	_nempty?: boolean;
};

const filterA: FieldFilter = {
	author: {
		_eq: 'Rijk',
	},
};

const filterB: FieldFilter = {
	author: {
		name: 'Rijk', // << This should be illegal
	},
};

const filterC: FieldFilter = {
	author: {
		name: {
			_eq: 'Rijk',
		},
	},
};
