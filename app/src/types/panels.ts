export type PanelFunction = 'count' | 'countDistinct' | 'avg' | 'avgDistinct' | 'sum' | 'sumDistinct' | 'min' | 'max';

export type BaseConditionalFillOperators = '=' | '!=' | '>' | '>=' | '<' | '<=';

export type StringConditionalFillOperators =
	| BaseConditionalFillOperators
	| 'contains'
	| 'ncontains'
	| 'starts_with'
	| 'nstarts_with'
	| 'istarts_with'
	| 'nistarts_with'
	| 'ends_with'
	| 'nends_with'
	| 'iends_with'
	| 'niends_with';
