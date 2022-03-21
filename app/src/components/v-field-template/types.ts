export type FieldTree = {
	field: string;
	name: string;
	key: string;
	group?: boolean;
	disabled?: boolean;
	children?: FieldTree[];
};
