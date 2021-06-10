export type FieldTree = {
	field: string;
	name: string;
	children?: FieldTree[];
};

export type OperatorType = {
	type: string;
	operators: string[];
};
