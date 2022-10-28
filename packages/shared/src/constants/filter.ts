export const FILTER_OPERATORS = [
	'eq',
	'neq',
	'lt',
	'lte',
	'gt',
	'gte',
	'in',
	'nin',
	'null',
	'nnull',
	'contains',
	'ncontains',
	'icontains',
	'between',
	'nbetween',
	'empty',
	'nempty',
	'intersects',
	'nintersects',
	'intersects_bbox',
	'nintersects_bbox',
] as const;

export const CLIENT_FILTER_OPERATORS = [
	...FILTER_OPERATORS,
	'starts_with',
	'nstarts_with',
	'ends_with',
	'nends_with',
	'regex',
] as const;

export const VALID_FILTER_OPERATORS = [...CLIENT_FILTER_OPERATORS, 'some', 'none'] as const;
