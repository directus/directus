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
	| 'icontains'
	| 'between'
	| 'nbetween'
	| 'empty'
	| 'nempty'
	| 'intersects'
	| 'nintersects'
	| 'intersects_bbox'
	| 'nintersects_bbox';
export type ClientFilterOperator =
	| FilterOperator
	| 'starts_with'
	| 'nstarts_with'
	| 'ends_with'
	| 'nends_with'
	| 'regex';
export type Filter<Item extends object> = LogicalFilter<Item> | FieldFilter<Item>;
export type LogicalFilterOR<Item extends object> = {
	_or: Filter<Item>[];
};
export type LogicalFilterAND<Item extends object> = {
	_and: Filter<Item>[];
};
export type LogicalFilter<Item extends object> = LogicalFilterOR<Item> | LogicalFilterAND<Item>;
export type FieldFilter<Item extends object> = {
	[field: string]: FieldFilterOperator | FieldValidationOperator | FieldFilter<Item>;
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
	_icontains?: string;
	_starts_with?: string;
	_nstarts_with?: string;
	_ends_with?: string;
	_nends_with?: string;
	_between?: (string | number)[];
	_nbetween?: (string | number)[];
	_empty?: boolean;
	_nempty?: boolean;
	_intersects?: string;
	_nintersects?: string;
	_intersects_bbox?: string;
	_nintersects_bbox?: string;
};
export type FieldValidationOperator = {
	_submitted?: boolean;
	_regex?: string;
};
