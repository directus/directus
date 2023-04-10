export type Option = {
	value: string | number | null;
	icon?: string;
	text?: string;
	disabled?: boolean;
	children?: Option[];
	divider?: boolean;
	selectable?: boolean;
	hidden?: boolean;
};
