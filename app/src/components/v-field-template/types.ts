export type FieldTree = {
	field: string;
	name: string;
	key: string;
	path: string;
	disabled?: boolean;
	children?: FieldTree[];
};
