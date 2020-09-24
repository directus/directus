import { Field } from '@/types';
import { TranslateResult } from 'vue-i18n';

export type FieldTree = {
	field: string;
	name: string | TranslateResult;
	fieldInfo?: Field;
	disabled?: boolean;
	children?: FieldTree[];
};
