import { TranslateResult } from 'vue-i18n';

export type FieldTree = {
	field: string;
	name: string | TranslateResult;
	children?: FieldTree[];
};

export type OperatorType = {
	type: string;
	operators: string[];
};
