import VueI18n from 'vue-i18n';

export type Alignment = 'left' | 'center' | 'right';

export type HeaderRaw = {
	text: string | VueI18n.TranslateResult;
	value: string;
	align?: Alignment;
	sortable?: boolean;
	width?: number | null;
	[key: string]: any;
};

export type Header = Required<HeaderRaw>;

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
