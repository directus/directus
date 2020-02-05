export type Alignment = 'left' | 'center' | 'right';

export type HeaderRaw = {
	text: string;
	value: string;
	align?: Alignment;
	sortable?: boolean;
	width?: number | null;
};

export type Header = Required<HeaderRaw>;

export type ItemSelectEvent = {
	value: boolean;
	item: any;
};

export type Sort = {
	by: string | null;
	desc: boolean;
};
