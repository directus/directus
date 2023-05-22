export type PanelFunction = 'count' | 'countDistinct' | 'avg' | 'avgDistinct' | 'sum' | 'sumDistinct' | 'min' | 'max';

export type BaseConditionalFillOperators = '=' | '!=' | '>' | '>=' | '<' | '<=';

export type StringConditionalFillOperators =
	| BaseConditionalFillOperators
	| 'contains'
	| 'ncontains'
	| 'starts_with'
	| 'ends_with';
