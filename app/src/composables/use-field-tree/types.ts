import { TranslateResult } from 'vue-i18n';

export type FieldTree = {
	field: string;
	name: string | TranslateResult;
	key: string;
	children?: FieldTree[];
};
