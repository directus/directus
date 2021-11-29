export type FieldTree = {
	field: string;
	name: string;
	key: string;
	disabled?: boolean;
	divider?: boolean;
	children?: FieldTree[];
};
