import { TranslateResult } from 'vue-i18n';

type Translation = {
	locale: string;
	translation: string;
};

export type Width = 'half' | 'half-left' | 'half-right' | 'full' | 'fill';

export interface FieldRaw {
	id: number;
	collection: string;
	field: string;
	datatype: string | null;
	unique: boolean;
	primary_key: boolean;
	auto_increment: boolean;
	default_value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
	note: string | null;
	signed: boolean;
	type: string;
	sort: null | number;
	interface: string | null;
	options: null | { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
	display: string | null;
	display_options: null | { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
	hidden_detail: boolean;
	hidden_browse: boolean;
	required: boolean;
	locked: boolean;
	translation: null | Translation[];
	readonly: boolean;
	width: null | Width;
	validation: string | null;
	group: number | null;
	length: string | number | null;
}

export interface Field extends FieldRaw {
	name: string | TranslateResult;
}
