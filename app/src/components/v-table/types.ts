export type Alignment = 'left' | 'center' | 'right';

export type HeaderRaw = {
	text: string;
	value: string;
	description?: string | null;
	align?: Alignment;
	sortable?: boolean;
	width?: number | null;
	// Columns with a flex value share the remaining space proportionally and shrink before the table overflows
	flex?: number | null;
	[key: string]: any;
};

// Same as HeaderRaw with all common fields required; `flex` stays optional since most columns are fixed-width
export type Header = {
	text: string;
	value: string;
	description: string | null;
	align: Alignment;
	sortable: boolean;
	width: number | null;
	flex?: number | null;
	[key: string]: any;
};

export type Item = {
	[key: string]: any;
};

export type ItemSelectEvent = {
	value: boolean;
	item: Item;
};

export type Sort = {
	by: string | null;
	desc: boolean;
};
