export type Alignment = 'left' | 'center' | 'right';

export type HeaderRaw = {
	text: string;
	value: string;
	align?: Alignment;
	sortable?: boolean;
	width?: number | null;
};

export type Header = Required<HeaderRaw>;

export type Item = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
