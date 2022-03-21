export type FieldTree = {
	field: string;
	name: string;
	key: string;
	path: string;
	group?: boolean;
	disabled?: boolean;
	children?: FieldTree[];
};
