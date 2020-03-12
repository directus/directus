import VueI18n from 'vue-i18n';

type Translation = {
	locale: string;
	translation: string;
};

type Width = 'half' | 'half-left' | 'half-right' | 'full' | 'fill';

export interface FieldRaw {
	id: number;
	collection: string;
	field: string;
	datatype: string;
	unique: boolean;
	primary_key: boolean;
	auto_increment: boolean;
	default_value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
	note: string;
	signed: boolean;
	type: string;
	sort: null | number;
	interface: string;
	hidden_detail: boolean;
	hidden_browse: boolean;
	required: boolean;
	options: null | { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
	locked: boolean;
	translation: null | Translation[];
	readonly: boolean;
	width: null | Width;
	validation: string | null;
	group: number | null;
	length: string | number;
}

export interface Field extends FieldRaw {
	name: string | VueI18n.TranslateResult;
}
